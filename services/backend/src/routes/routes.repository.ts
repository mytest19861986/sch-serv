import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import type { CreateRouteInput, RouteRecord, RouteStatus, UpdateRouteInput } from './routes.types.js';

export const ROUTES_DB = Symbol('ROUTES_DB');
export interface RoutesAuditContext { readonly actorId: string; readonly correlationId: string; readonly requiredRoles?: readonly string[]; }
type RouteRow = { id: string; tenant_id: string; school_id: string; name: string; status: RouteStatus; version: number; created_at: Date; updated_at: Date };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function error(code: string): Error { const e = new Error(code); Object.assign(e, { code }); return e; }
function fromRow(row: RouteRow): RouteRecord { return { id: row.id, tenantId: row.tenant_id, schoolId: row.school_id, name: row.name, status: row.status, version: row.version, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() }; }

@Injectable()
export class RoutesRepository implements OnModuleDestroy {
  constructor(@Inject(ROUTES_DB) private readonly pool: Pool) {}

  private async lockAuthority(client: PoolClient, actorId: string, tenantId: string, roles: readonly string[]): Promise<void> {
    if (!UUID.test(actorId)) throw error('AUTHORITY_REVOKED');
    const result = await client.query(`SELECT r.role FROM "user" u JOIN tenant_membership m ON m.user_id = u.id AND m.status = 'active' JOIN role_assignment r ON r.membership_id = m.id AND r.status = 'active' JOIN tenant t ON t.id = m.tenant_id AND t.status = 'active' WHERE u.id = $1 AND u.status = 'active' AND (m.tenant_id = $2 OR r.role = 'super-admin') AND r.role = ANY($3::text[]) FOR UPDATE OF u, m, r, t`, [actorId, tenantId, roles]);
    if (!result.rows.length) throw error('AUTHORITY_REVOKED');
  }

  private async audit(client: PoolClient, context: RoutesAuditContext, tenantId: string, targetId: string, action: string): Promise<void> {
    await client.query('INSERT INTO audit_record (id, tenant_id, actor_id, actor_type, action, target_type, target_id, outcome, correlation_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [randomUUID(), tenantId, context.actorId, 'human', action, 'route', targetId, 'committed', context.correlationId]);
  }

  async getSchoolContext(schoolId: string): Promise<{ tenantId: string; status: string; tenantStatus: string } | null> {
    const result = await this.pool.query<{ tenant_id: string; status: string; tenant_status: string }>('SELECT sc.tenant_id, sc.status, t.status AS tenant_status FROM school sc JOIN tenant t ON t.id = sc.tenant_id WHERE sc.id = $1', [schoolId]);
    return result.rows[0] ? { tenantId: result.rows[0].tenant_id, status: result.rows[0].status, tenantStatus: result.rows[0].tenant_status } : null;
  }

  async create(input: CreateRouteInput, context: RoutesAuditContext): Promise<RouteRecord> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const school = await client.query<{ tenant_id: string; status: string; tenant_status: string }>('SELECT sc.tenant_id, sc.status, t.status AS tenant_status FROM school sc JOIN tenant t ON t.id = sc.tenant_id WHERE sc.id = $1 FOR UPDATE OF sc, t', [input.schoolId]);
      if (!school.rows[0] || school.rows[0].status !== 'active') throw error('SCHOOL_LIFECYCLE_DENIED');
      if (school.rows[0].tenant_status !== 'active') throw error('TENANT_LIFECYCLE_DENIED');
      await this.lockAuthority(client, context.actorId, school.rows[0].tenant_id, context.requiredRoles ?? ['school-admin', 'super-admin']);
      const result = await client.query<RouteRow>('INSERT INTO route (id, tenant_id, school_id, name) VALUES ($1, $2, $3, $4) RETURNING id, tenant_id, school_id, name, status, version, created_at, updated_at', [randomUUID(), school.rows[0].tenant_id, input.schoolId, input.name]);
      await this.audit(client, context, school.rows[0].tenant_id, result.rows[0]!.id, 'route.create');
      await client.query('COMMIT');
      return fromRow(result.rows[0]!);
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }

  async list(schoolId: string, tenantId?: string): Promise<RouteRecord[]> {
    const result = await this.pool.query<RouteRow>(`SELECT r.id, r.tenant_id, r.school_id, r.name, r.status, r.version, r.created_at, r.updated_at FROM route r JOIN school sc ON sc.id = r.school_id AND sc.tenant_id = r.tenant_id AND sc.status = 'active' JOIN tenant t ON t.id = r.tenant_id AND t.status = 'active' WHERE r.school_id = $1 AND r.status = 'active' AND ($2::uuid IS NULL OR r.tenant_id = $2) ORDER BY r.id`, [schoolId, tenantId ?? null]);
    return result.rows.map(fromRow);
  }

  async get(id: string, schoolId: string, tenantId?: string): Promise<RouteRecord | null> {
    const result = await this.pool.query<RouteRow>(`SELECT r.id, r.tenant_id, r.school_id, r.name, r.status, r.version, r.created_at, r.updated_at FROM route r JOIN school sc ON sc.id = r.school_id AND sc.tenant_id = r.tenant_id AND sc.status = 'active' JOIN tenant t ON t.id = r.tenant_id AND t.status = 'active' WHERE r.id = $1 AND r.school_id = $2 AND r.status = 'active' AND ($3::uuid IS NULL OR r.tenant_id = $3)`, [id, schoolId, tenantId ?? null]);
    return result.rows[0] ? fromRow(result.rows[0]) : null;
  }

  async update(id: string, schoolId: string, input: UpdateRouteInput, context: RoutesAuditContext): Promise<RouteRecord | null> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const current = await client.query<{ tenant_id: string; school_status: string; tenant_status: string }>('SELECT r.tenant_id, sc.status AS school_status, t.status AS tenant_status FROM route r JOIN school sc ON sc.id = r.school_id AND sc.tenant_id = r.tenant_id JOIN tenant t ON t.id = r.tenant_id WHERE r.id = $1 AND r.school_id = $2 FOR UPDATE OF r, sc, t', [id, schoolId]);
      if (!current.rows[0]) { await client.query('ROLLBACK'); return null; }
      if (current.rows[0].school_status !== 'active') throw error('SCHOOL_LIFECYCLE_DENIED');
      if (current.rows[0].tenant_status !== 'active') throw error('TENANT_LIFECYCLE_DENIED');
      await this.lockAuthority(client, context.actorId, current.rows[0].tenant_id, context.requiredRoles ?? ['school-admin', 'super-admin']);
      const result = await client.query<RouteRow>('UPDATE route SET name = COALESCE($3, name), status = COALESCE($4, status), version = version + 1, updated_at = NOW() WHERE id = $1 AND school_id = $2 AND version = $5 RETURNING id, tenant_id, school_id, name, status, version, created_at, updated_at', [id, schoolId, input.name ?? null, input.status ?? null, input.version]);
      if (!result.rows[0]) { await client.query('ROLLBACK'); return null; }
      await this.audit(client, context, current.rows[0].tenant_id, id, 'route.update');
      await client.query('COMMIT');
      return fromRow(result.rows[0]);
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }

  async onModuleDestroy(): Promise<void> { await this.pool.end(); }
}
