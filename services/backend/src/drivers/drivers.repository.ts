import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import type { CreateDriverInput, DriverRecord, DriverStatus, UpdateDriverInput } from './drivers.types.js';

export const DRIVERS_DB = Symbol('DRIVERS_DB');
export interface DriversAuditContext { readonly actorId: string; readonly correlationId: string; readonly requiredRoles?: readonly string[]; }
type DriverRow = { id: string; tenant_id: string; user_id: string; status: DriverStatus; version: number; created_at: Date; updated_at: Date };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function error(code: string): Error { const e = new Error(code); Object.assign(e, { code }); return e; }
function fromRow(row: DriverRow): DriverRecord { return { id: row.id, tenantId: row.tenant_id, userId: row.user_id, status: row.status, version: row.version, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() }; }

@Injectable()
export class DriversRepository implements OnModuleDestroy {
  constructor(@Inject(DRIVERS_DB) private readonly pool: Pool) {}

  private async lockAuthority(client: PoolClient, actorId: string, tenantId: string, roles: readonly string[]): Promise<void> {
    if (!UUID.test(actorId)) throw error('AUTHORITY_REVOKED');
    const result = await client.query(`SELECT r.role FROM "user" u JOIN tenant_membership m ON m.user_id = u.id AND m.status = 'active' JOIN role_assignment r ON r.membership_id = m.id AND r.status = 'active' JOIN tenant t ON t.id = m.tenant_id AND t.status = 'active' WHERE u.id = $1 AND u.status = 'active' AND (m.tenant_id = $2 OR r.role = 'super-admin') AND r.role = ANY($3::text[]) FOR UPDATE OF u, m, r, t`, [actorId, tenantId, roles]);
    if (!result.rows.length) throw error('AUTHORITY_REVOKED');
  }

  private async audit(client: PoolClient, context: DriversAuditContext, tenantId: string, targetId: string, action: string): Promise<void> {
    await client.query('INSERT INTO audit_record (id, tenant_id, actor_id, actor_type, action, target_type, target_id, outcome, correlation_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [randomUUID(), tenantId, context.actorId, 'human', action, 'driver_profile', targetId, 'committed', context.correlationId]);
  }

  async create(input: CreateDriverInput, context: DriversAuditContext): Promise<DriverRecord> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const tenant = await client.query<{ status: string }>('SELECT status FROM tenant WHERE id = $1 FOR UPDATE', [input.tenantId]);
      if (!tenant.rows[0] || tenant.rows[0].status !== 'active') throw error('TENANT_LIFECYCLE_DENIED');
      await this.lockAuthority(client, context.actorId, input.tenantId, context.requiredRoles ?? ['school-admin', 'super-admin']);
      const user = await client.query<{ id: string }>(`SELECT u.id FROM "user" u JOIN tenant_membership m ON m.user_id = u.id AND m.tenant_id = $2 AND m.status = 'active' JOIN role_assignment r ON r.membership_id = m.id AND r.role = 'driver' AND r.status = 'active' WHERE u.id = $1 AND u.status = 'active'`, [input.userId, input.tenantId]);
      if (!user.rows[0]) throw error('USER_NOT_ACTIVE_DRIVER');
      const result = await client.query<DriverRow>('INSERT INTO driver_profile (id, tenant_id, user_id) VALUES ($1, $2, $3) RETURNING id, tenant_id, user_id, status, version, created_at, updated_at', [randomUUID(), input.tenantId, input.userId]);
      await this.audit(client, context, input.tenantId, result.rows[0]!.id, 'driver.create');
      await client.query('COMMIT');
      return fromRow(result.rows[0]!);
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }

  async list(tenantId?: string): Promise<DriverRecord[]> {
    const result = await this.pool.query<DriverRow>(`SELECT d.id, d.tenant_id, d.user_id, d.status, d.version, d.created_at, d.updated_at FROM driver_profile d JOIN tenant t ON t.id = d.tenant_id AND t.status = 'active' WHERE d.status = 'active' AND ($1::uuid IS NULL OR d.tenant_id = $1) ORDER BY d.id`, [tenantId ?? null]);
    return result.rows.map(fromRow);
  }

  async get(id: string, tenantId?: string): Promise<DriverRecord | null> {
    const result = await this.pool.query<DriverRow>(`SELECT d.id, d.tenant_id, d.user_id, d.status, d.version, d.created_at, d.updated_at FROM driver_profile d JOIN tenant t ON t.id = d.tenant_id AND t.status = 'active' WHERE d.id = $1 AND d.status = 'active' AND ($2::uuid IS NULL OR d.tenant_id = $2)`, [id, tenantId ?? null]);
    return result.rows[0] ? fromRow(result.rows[0]) : null;
  }

  async update(id: string, input: UpdateDriverInput, context: DriversAuditContext): Promise<DriverRecord | null> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const current = await client.query<{ tenant_id: string; tenant_status: string }>('SELECT d.tenant_id, t.status AS tenant_status FROM driver_profile d JOIN tenant t ON t.id = d.tenant_id WHERE d.id = $1 FOR UPDATE OF d, t', [id]);
      if (!current.rows[0] || current.rows[0].tenant_status !== 'active') { await client.query('ROLLBACK'); return null; }
      await this.lockAuthority(client, context.actorId, current.rows[0].tenant_id, context.requiredRoles ?? ['school-admin', 'super-admin']);
      const result = await client.query<DriverRow>('UPDATE driver_profile SET status = $2, version = version + 1, updated_at = NOW() WHERE id = $1 AND version = $3 RETURNING id, tenant_id, user_id, status, version, created_at, updated_at', [id, input.status, input.version]);
      if (!result.rows[0]) { await client.query('ROLLBACK'); return null; }
      await this.audit(client, context, current.rows[0].tenant_id, id, 'driver.update');
      await client.query('COMMIT');
      return fromRow(result.rows[0]);
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }

  async onModuleDestroy(): Promise<void> { await this.pool.end(); }
}
