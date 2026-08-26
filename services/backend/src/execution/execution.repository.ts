import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import type { DriverRosterEntry, ExecutionStatus, PickupInput, PickupResult, ServiceExecutionSummary, StartServiceInput } from './execution.types.js';

export const EXECUTION_DB = Symbol('EXECUTION_DB');

interface ServiceRow {
  id: string;
  tenant_id: string;
  school_id: string;
  operational_date: string | Date;
  lifecycle_status: string;
  execution_status: ExecutionStatus;
  version: number;
}

function error(code: string): Error { const value = new Error(code); Object.assign(value, { code }); return value; }
function toSummary(row: ServiceRow): ServiceExecutionSummary {
  return { id: row.id, tenantId: row.tenant_id, schoolId: row.school_id, operationalDate: String(row.operational_date), lifecycleStatus: row.lifecycle_status, executionStatus: row.execution_status, version: row.version };
}

@Injectable()
export class ExecutionRepository implements OnModuleDestroy {
  constructor(@Inject(EXECUTION_DB) private readonly pool: Pool) {}

  private async lockDriverAuthority(client: PoolClient, actorId: string, tenantId: string): Promise<void> {
    const result = await client.query(
      `SELECT u.id
       FROM "user" u
       JOIN tenant_membership m ON m.user_id = u.id AND m.status = 'active' AND m.tenant_id = $2
       JOIN role_assignment r ON r.membership_id = m.id AND r.status = 'active' AND r.role = 'driver'
       JOIN tenant t ON t.id = m.tenant_id AND t.status = 'active'
       WHERE u.id = $1 AND u.status = 'active'
       FOR UPDATE OF u, m, r, t`,
      [actorId, tenantId],
    );
    if (!result.rows.length) throw error('RESOURCE_NOT_FOUND');
  }

  private async lockAssignedInstance(client: PoolClient, actorId: string, serviceInstanceId: string): Promise<ServiceRow> {
    const instance = await client.query<ServiceRow>(
      `SELECT si.id, si.tenant_id, si.school_id, si.operational_date,
              si.status AS lifecycle_status, si.execution_status, si.version
       FROM service_instance si
       JOIN tenant t ON t.id = si.tenant_id AND t.status = 'active'
       JOIN school sc ON sc.id = si.school_id AND sc.tenant_id = si.tenant_id AND sc.status = 'active'
       WHERE si.id = $1 AND si.status = 'active'
       FOR UPDATE OF si, t, sc`,
      [serviceInstanceId],
    );
    if (!instance.rows[0]) throw error('RESOURCE_NOT_FOUND');
    const row = instance.rows[0];
    await this.lockDriverAuthority(client, actorId, row.tenant_id);
    const assignment = await client.query(
      `SELECT da.id
       FROM driver_service_assignment da
       JOIN driver_profile dp ON dp.id = da.driver_id AND dp.tenant_id = da.tenant_id AND dp.status = 'active'
       WHERE da.service_instance_id = $1 AND da.tenant_id = $2 AND da.school_id = $3
         AND da.status = 'active' AND dp.user_id = $4
       FOR UPDATE OF da, dp`,
      [serviceInstanceId, row.tenant_id, row.school_id, actorId],
    );
    if (!assignment.rows.length) throw error('RESOURCE_NOT_FOUND');
    return row;
  }

  async activeServices(actorId: string): Promise<ServiceExecutionSummary[]> {
    const result = await this.pool.query<ServiceRow>(
      `SELECT si.id, si.tenant_id, si.school_id, si.operational_date,
              si.status AS lifecycle_status, si.execution_status, si.version
       FROM service_instance si
       JOIN tenant t ON t.id = si.tenant_id AND t.status = 'active'
       JOIN school sc ON sc.id = si.school_id AND sc.tenant_id = si.tenant_id AND sc.status = 'active'
       JOIN driver_service_assignment da ON da.service_instance_id = si.id
         AND da.tenant_id = si.tenant_id AND da.school_id = si.school_id AND da.status = 'active'
       JOIN driver_profile dp ON dp.id = da.driver_id AND dp.tenant_id = da.tenant_id AND dp.status = 'active' AND dp.user_id = $1
       JOIN tenant_membership tm ON tm.user_id = dp.user_id AND tm.tenant_id = si.tenant_id AND tm.status = 'active'
       JOIN role_assignment ra ON ra.membership_id = tm.id AND ra.role = 'driver' AND ra.status = 'active'
       WHERE si.status = 'active'
       ORDER BY si.operational_date, si.id`,
      [actorId],
    );
    return result.rows.map(toSummary);
  }

  async transportState(actorId: string, serviceInstanceId: string): Promise<ServiceExecutionSummary> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const row = await this.lockAssignedInstance(client, actorId, serviceInstanceId);
      await client.query('COMMIT');
      return toSummary(row);
    } catch (cause) { await client.query('ROLLBACK'); throw cause; } finally { client.release(); }
  }

  async roster(actorId: string, serviceInstanceId: string): Promise<DriverRosterEntry[]> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const row = await this.lockAssignedInstance(client, actorId, serviceInstanceId);
      if (row.execution_status !== 'in_progress') throw error('RESOURCE_NOT_FOUND');
      const result = await client.query<DriverRosterEntry>(
        `SELECT s.id, s.display_name AS "displayName"
         FROM student_service_assignment sa
         JOIN student s ON s.id = sa.student_id AND s.tenant_id = sa.tenant_id AND s.school_id = sa.school_id AND s.status = 'active'
         WHERE sa.service_instance_id = $1 AND sa.tenant_id = $2 AND sa.school_id = $3 AND sa.status = 'active'
         ORDER BY s.id`,
        [serviceInstanceId, row.tenant_id, row.school_id],
      );
      await client.query('COMMIT');
      return result.rows;
    } catch (cause) { await client.query('ROLLBACK'); throw cause; } finally { client.release(); }
  }

  async start(actorId: string, serviceInstanceId: string, input: StartServiceInput, correlationId: string): Promise<ServiceExecutionSummary> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const current = await this.lockAssignedInstance(client, actorId, serviceInstanceId);
      if (current.execution_status === 'in_progress') { await client.query('COMMIT'); return toSummary(current); }
      if (current.version !== input.expectedVersion) throw error('VERSION_CONFLICT');
      const updated = await client.query<ServiceRow>(
        `UPDATE service_instance
         SET execution_status = 'in_progress', version = version + 1, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2 AND school_id = $3 AND status = 'active'
           AND execution_status = 'not_started' AND version = $4
         RETURNING id, tenant_id, school_id, operational_date, status AS lifecycle_status, execution_status, version`,
        [serviceInstanceId, current.tenant_id, current.school_id, input.expectedVersion],
      );
      if (!updated.rows[0]) throw error('VERSION_CONFLICT');
      await client.query(
        `INSERT INTO audit_record (id, tenant_id, actor_id, actor_type, action, target_type, target_id, outcome, correlation_id)
         VALUES ($1, $2, $3, 'human', 'driver_service.start', 'service_instance', $4, 'committed', $5)`,
        [randomUUID(), current.tenant_id, actorId, serviceInstanceId, correlationId],
      );
      await client.query('COMMIT');
      return toSummary(updated.rows[0]);
    } catch (cause) { await client.query('ROLLBACK'); throw cause; } finally { client.release(); }
  }

  async pickup(actorId: string, serviceInstanceId: string, studentId: string, input: PickupInput, correlationId: string, idempotencyKey: string): Promise<PickupResult> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const authority = await client.query(
        `SELECT u.id, m.tenant_id FROM "user" u
         JOIN tenant_membership m ON m.user_id=u.id AND m.status='active'
         JOIN role_assignment ra ON ra.membership_id=m.id AND ra.role='driver' AND ra.status='active'
         WHERE u.id=$1 AND u.status='active' FOR UPDATE OF u,m,ra`, [actorId]);
      const instance = await client.query<ServiceRow>(
        `SELECT si.id, si.tenant_id, si.school_id, si.operational_date, si.status AS lifecycle_status, si.execution_status, si.version
         FROM service_instance si WHERE si.id = $1`, [serviceInstanceId]);
      if (!instance.rows[0]) throw error('RESOURCE_NOT_FOUND');
      const discovered = instance.rows[0];
      const scope = await client.query(
        `SELECT t.id AS tenant_id, sc.id AS school_id
         FROM tenant t JOIN school sc ON sc.tenant_id=t.id
         WHERE t.id=$1 AND sc.id=$2 AND t.status='active' AND sc.status='active'
         FOR UPDATE OF t,sc`, [discovered.tenant_id, discovered.school_id]);
      const lockedInstance = await client.query<ServiceRow>(
        `SELECT si.id, si.tenant_id, si.school_id, si.operational_date, si.status AS lifecycle_status, si.execution_status, si.version
         FROM service_instance si
         WHERE si.id=$1 AND si.tenant_id=$2 AND si.school_id=$3 AND si.status='active'
         FOR UPDATE`, [serviceInstanceId, discovered.tenant_id, discovered.school_id]);
      if (!authority.rows.some((entry: { tenant_id: string }) => entry.tenant_id === discovered.tenant_id) || !scope.rows.length || !lockedInstance.rows.length || lockedInstance.rows[0]!.execution_status !== 'in_progress') throw error('RESOURCE_NOT_FOUND');
      const row = lockedInstance.rows[0]!;
      const assignment = await client.query(
        `SELECT da.id FROM driver_service_assignment da JOIN driver_profile dp ON dp.id=da.driver_id AND dp.tenant_id=da.tenant_id AND dp.status='active'
         WHERE da.service_instance_id=$1 AND da.tenant_id=$2 AND da.school_id=$3 AND da.status='active' AND dp.user_id=$4 FOR UPDATE OF da,dp`, [serviceInstanceId, row.tenant_id, row.school_id, actorId]);
      if (!assignment.rows.length) throw error('RESOURCE_NOT_FOUND');
      const studentAssignment = await client.query(
        `SELECT s.id FROM student_service_assignment sa JOIN student s ON s.id=sa.student_id AND s.tenant_id=sa.tenant_id AND s.school_id=sa.school_id AND s.status='active'
         WHERE sa.service_instance_id=$1 AND sa.tenant_id=$2 AND sa.school_id=$3 AND sa.student_id=$4 AND sa.status='active' FOR UPDATE OF sa,s`, [serviceInstanceId, row.tenant_id, row.school_id, studentId]);
      if (!studentAssignment.rows.length) throw error('RESOURCE_NOT_FOUND');
      if (idempotencyKey.toLowerCase() !== input.clientEventId.toLowerCase()) throw error('PICKUP_CONFLICT');
      const current = await client.query<{ pickup_state: string; version: number }>(
        `SELECT pickup_state, version FROM student_transport_current_state WHERE tenant_id=$1 AND service_instance_id=$2 AND student_id=$3 FOR UPDATE`, [row.tenant_id, serviceInstanceId, studentId]);
      const fingerprint = createHash('sha256').update(JSON.stringify({ actorId, tenantId: row.tenant_id, schoolId: row.school_id, serviceInstanceId, studentId, eventType: 'pickup', payload: input, })).digest('hex');
      const existing = await client.query<{ id: string; fingerprint: string; state_version: number; recorded_at: string }>(`SELECT id,fingerprint,state_version,recorded_at FROM transport_event WHERE tenant_id=$1 AND client_event_id=$2 FOR UPDATE`, [row.tenant_id, input.clientEventId]);
      if (existing.rows[0]) {
        if (existing.rows[0].fingerprint !== fingerprint) throw error('PICKUP_CONFLICT');
        await client.query('COMMIT');
        return { disposition: 'REPLAYED', event_id: existing.rows[0].id, service_instance_id: serviceInstanceId, student_id: studentId, state: 'picked_up', state_version: existing.rows[0].state_version, server_time: existing.rows[0].recorded_at, correlation_id: correlationId };
      }
      const currentVersion = current.rows[0]?.version ?? 0;
      if (input.knownStateVersion !== undefined && input.knownStateVersion !== currentVersion) throw error('PICKUP_CONFLICT');
      if (current.rows[0]?.pickup_state === 'picked_up') throw error('PICKUP_CONFLICT');
      const nextVersion = currentVersion + 1;
      const eventId = randomUUID();
      const inserted = await client.query<{ recorded_at: string }>(
        `INSERT INTO transport_event(id,tenant_id,school_id,service_instance_id,student_id,actor_id,actor_role,event_type,client_event_id,fingerprint,occurred_at,recorded_at,state_version)
         VALUES($1,$2,$3,$4,$5,$6,'driver','pickup',$7,$8,$9,NOW(),$10) RETURNING recorded_at`, [eventId, row.tenant_id, row.school_id, serviceInstanceId, studentId, actorId, input.clientEventId, fingerprint, input.occurredAt, nextVersion]);
      await client.query(
        `INSERT INTO student_transport_current_state(tenant_id,school_id,service_instance_id,student_id,pickup_state,last_event_id,version,committed_at)
         VALUES($1,$2,$3,$4,'picked_up',$5,$6,$7)
         ON CONFLICT (tenant_id,service_instance_id,student_id) DO UPDATE SET pickup_state='picked_up',last_event_id=EXCLUDED.last_event_id,version=EXCLUDED.version,committed_at=EXCLUDED.committed_at`, [row.tenant_id, row.school_id, serviceInstanceId, studentId, eventId, nextVersion, inserted.rows[0]!.recorded_at]);
      await client.query(`INSERT INTO audit_record(id,tenant_id,actor_id,actor_type,action,target_type,target_id,outcome,correlation_id) VALUES($1,$2,$3,'human','driver_service.pickup','student',$4,'committed',$5)`, [randomUUID(), row.tenant_id, actorId, studentId, correlationId]);
      await client.query('COMMIT');
      return { disposition: 'COMMITTED', event_id: eventId, service_instance_id: serviceInstanceId, student_id: studentId, state: 'picked_up', state_version: nextVersion, server_time: inserted.rows[0]!.recorded_at, correlation_id: correlationId };
    } catch (cause) { await client.query('ROLLBACK'); throw cause; } finally { client.release(); }
  }

  async onModuleDestroy(): Promise<void> { await this.pool.end(); }
}
