import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import type { CreateVehicleInput, UpdateVehicleInput, VehicleRecord, VehicleStatus } from './vehicles.types.js';

export const VEHICLES_DB = Symbol('VEHICLES_DB');
export interface VehiclesAuditContext { readonly actorId: string; readonly correlationId: string; readonly requiredRoles?: readonly string[]; }
type VehicleRow = { id: string; tenant_id: string; identifier: string; status: VehicleStatus; version: number; created_at: Date; updated_at: Date };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function error(code: string): Error { const e = new Error(code); Object.assign(e, { code }); return e; }
function fromRow(row: VehicleRow): VehicleRecord { return { id: row.id, tenantId: row.tenant_id, identifier: row.identifier, status: row.status, version: row.version, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() }; }

@Injectable()
export class VehiclesRepository implements OnModuleDestroy {
  constructor(@Inject(VEHICLES_DB) private readonly pool: Pool) {}

  private async lockAuthority(client: PoolClient, actorId: string, tenantId: string, roles: readonly string[]): Promise<void> {
    if (!UUID.test(actorId)) throw error('AUTHORITY_REVOKED');
    const result = await client.query(`SELECT r.role FROM "user" u JOIN tenant_membership m ON m.user_id = u.id AND m.status = 'active' JOIN role_assignment r ON r.membership_id = m.id AND r.status = 'active' JOIN tenant t ON t.id = m.tenant_id AND t.status = 'active' WHERE u.id = $1 AND u.status = 'active' AND (m.tenant_id = $2 OR r.role = 'super-admin') AND r.role = ANY($3::text[]) FOR UPDATE OF u, m, r, t`, [actorId, tenantId, roles]);
    if (!result.rows.length) throw error('AUTHORITY_REVOKED');
  }

  private async audit(client: PoolClient, context: VehiclesAuditContext, tenantId: string, targetId: string, action: string): Promise<void> {
    await client.query('INSERT INTO audit_record (id, tenant_id, actor_id, actor_type, action, target_type, target_id, outcome, correlation_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [randomUUID(), tenantId, context.actorId, 'human', action, 'vehicle', targetId, 'committed', context.correlationId]);
  }

  async create(input: CreateVehicleInput, context: VehiclesAuditContext): Promise<VehicleRecord> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const tenant = await client.query<{ status: string }>('SELECT status FROM tenant WHERE id = $1 FOR UPDATE', [input.tenantId]);
      if (!tenant.rows[0] || tenant.rows[0].status !== 'active') throw error('TENANT_LIFECYCLE_DENIED');
      await this.lockAuthority(client, context.actorId, input.tenantId, context.requiredRoles ?? ['school-admin', 'super-admin']);
      const result = await client.query<VehicleRow>('INSERT INTO vehicle (id, tenant_id, identifier) VALUES ($1, $2, $3) RETURNING id, tenant_id, identifier, status, version, created_at, updated_at', [randomUUID(), input.tenantId, input.identifier]);
      await this.audit(client, context, input.tenantId, result.rows[0]!.id, 'vehicle.create');
      await client.query('COMMIT');
      return fromRow(result.rows[0]!);
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }

  async list(tenantId?: string): Promise<VehicleRecord[]> {
    const result = await this.pool.query<VehicleRow>(`SELECT v.id, v.tenant_id, v.identifier, v.status, v.version, v.created_at, v.updated_at FROM vehicle v JOIN tenant t ON t.id = v.tenant_id AND t.status = 'active' WHERE v.status = 'active' AND ($1::uuid IS NULL OR v.tenant_id = $1) ORDER BY v.id`, [tenantId ?? null]);
    return result.rows.map(fromRow);
  }

  async get(id: string, tenantId?: string): Promise<VehicleRecord | null> {
    const result = await this.pool.query<VehicleRow>(`SELECT v.id, v.tenant_id, v.identifier, v.status, v.version, v.created_at, v.updated_at FROM vehicle v JOIN tenant t ON t.id = v.tenant_id AND t.status = 'active' WHERE v.id = $1 AND v.status = 'active' AND ($2::uuid IS NULL OR v.tenant_id = $2)`, [id, tenantId ?? null]);
    return result.rows[0] ? fromRow(result.rows[0]) : null;
  }

  async update(id: string, input: UpdateVehicleInput, context: VehiclesAuditContext): Promise<VehicleRecord | null> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const current = await client.query<{ tenant_id: string; tenant_status: string }>('SELECT v.tenant_id, t.status AS tenant_status FROM vehicle v JOIN tenant t ON t.id = v.tenant_id WHERE v.id = $1 FOR UPDATE OF v, t', [id]);
      if (!current.rows[0] || current.rows[0].tenant_status !== 'active') { await client.query('ROLLBACK'); return null; }
      await this.lockAuthority(client, context.actorId, current.rows[0].tenant_id, context.requiredRoles ?? ['school-admin', 'super-admin']);
      const result = await client.query<VehicleRow>('UPDATE vehicle SET status = $2, version = version + 1, updated_at = NOW() WHERE id = $1 AND version = $3 RETURNING id, tenant_id, identifier, status, version, created_at, updated_at', [id, input.status, input.version]);
      if (!result.rows[0]) { await client.query('ROLLBACK'); return null; }
      await this.audit(client, context, current.rows[0].tenant_id, id, 'vehicle.update');
      await client.query('COMMIT');
      return fromRow(result.rows[0]);
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }

  async onModuleDestroy(): Promise<void> { await this.pool.end(); }
}
