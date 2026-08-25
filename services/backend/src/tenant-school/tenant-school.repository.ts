import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient, QueryResult } from 'pg';
import type { CreateSchoolInput, CreateTenantInput, LifecycleStatus, SchoolRecord, TenantRecord, UpdateSchoolInput, UpdateTenantInput } from './tenant-school.types.js';

export const TENANT_SCHOOL_DB = Symbol('TENANT_SCHOOL_DB');

type TenantRow = { id: string; name: string; status: LifecycleStatus; version: number; created_at: Date; updated_at: Date };
type SchoolRow = TenantRow & { tenant_id: string };
export interface AuditContext { readonly actorId: string; readonly correlationId: string; }
export interface SchoolUpdateAuditContext extends AuditContext { readonly tenantId?: string; }
function lifecycleDenied(): Error { const error = new Error('TENANT_LIFECYCLE_DENIED'); Object.assign(error, { code: 'TENANT_LIFECYCLE_DENIED' }); return error; }

function tenantFromRow(row: TenantRow): TenantRecord { return { id: row.id, name: row.name, status: row.status, version: row.version, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() }; }
function schoolFromRow(row: SchoolRow): SchoolRecord { return { ...tenantFromRow(row), tenantId: row.tenant_id }; }

@Injectable()
export class TenantSchoolRepository implements OnModuleDestroy {
  constructor(@Inject(TENANT_SCHOOL_DB) private readonly pool: Pool) {}

  private async audit(client: PoolClient, context: AuditContext, tenantId: string | null, targetType: string, targetId: string, action: string): Promise<void> {
    await client.query('INSERT INTO audit_record (id, tenant_id, actor_id, actor_type, action, target_type, target_id, outcome, correlation_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [randomUUID(), tenantId, context.actorId, 'human', action, targetType, targetId, 'committed', context.correlationId]);
  }

  async createTenant(input: CreateTenantInput, context: AuditContext): Promise<TenantRecord> {
    const client = await this.pool.connect(); const id = randomUUID();
    try { await client.query('BEGIN'); const result = await client.query<TenantRow>('INSERT INTO tenant (id, name) VALUES ($1, $2) RETURNING id, name, status, version, created_at, updated_at', [id, input.name]); await this.audit(client, context, id, 'tenant', id, 'tenant.create'); await client.query('COMMIT'); return tenantFromRow(result.rows[0]!); }
    catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async getTenant(id: string, tenantScope?: string): Promise<TenantRecord | null> {
    const result = await this.pool.query<TenantRow>('SELECT id, name, status, version, created_at, updated_at FROM tenant WHERE id = $1 AND ($2::uuid IS NULL OR id = $2)', [id, tenantScope ?? null]);
    return result.rows[0] ? tenantFromRow(result.rows[0]) : null;
  }

  async updateTenant(id: string, input: UpdateTenantInput, context: AuditContext): Promise<TenantRecord | null> {
    const client = await this.pool.connect();
    try { await client.query('BEGIN'); const result = await client.query<TenantRow>(
      'UPDATE tenant SET name = COALESCE($2, name), status = COALESCE($3, status), version = version + 1, updated_at = NOW() WHERE id = $1 AND version = $4 RETURNING id, name, status, version, created_at, updated_at',
      [id, input.name ?? null, input.status ?? null, input.version]
    ); if (!result.rows[0]) { await client.query('ROLLBACK'); return null; } await this.audit(client, context, id, 'tenant', id, 'tenant.update'); await client.query('COMMIT'); return tenantFromRow(result.rows[0]); }
    catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async createSchool(input: CreateSchoolInput, context: AuditContext): Promise<SchoolRecord> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const tenant = await client.query<{ id: string; status: LifecycleStatus }>('SELECT id, status FROM tenant WHERE id = $1 FOR UPDATE', [input.tenantId]);
      if (!tenant.rows[0] || tenant.rows[0].status !== 'active') throw lifecycleDenied();
      const result = await client.query<SchoolRow>('INSERT INTO school (id, tenant_id, name) VALUES ($1, $2, $3) RETURNING id, tenant_id, name, status, version, created_at, updated_at', [randomUUID(), input.tenantId, input.name]);
      await this.audit(client, context, input.tenantId ?? null, 'school', result.rows[0]!.id, 'school.create'); await client.query('COMMIT');
      return schoolFromRow(result.rows[0]!);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }

  async getSchool(id: string, tenantScope?: string): Promise<SchoolRecord | null> {
    const result = await this.pool.query<SchoolRow>('SELECT id, tenant_id, name, status, version, created_at, updated_at FROM school WHERE id = $1 AND ($2::uuid IS NULL OR tenant_id = $2)', [id, tenantScope ?? null]);
    return result.rows[0] ? schoolFromRow(result.rows[0]) : null;
  }

  async updateSchool(id: string, input: UpdateSchoolInput, context: SchoolUpdateAuditContext): Promise<SchoolRecord | null> {
    const client = await this.pool.connect();
    try { await client.query('BEGIN'); const tenant = await client.query<{ id: string; status: LifecycleStatus }>('SELECT id, status FROM tenant WHERE id = (SELECT tenant_id FROM school WHERE id = $1) FOR UPDATE', [id]); if (!tenant.rows[0] || tenant.rows[0].status !== 'active') throw lifecycleDenied(); const result = await client.query<SchoolRow>(
      'UPDATE school SET name = COALESCE($2, name), status = COALESCE($3, status), version = version + 1, updated_at = NOW() WHERE id = $1 AND ($5::uuid IS NULL OR tenant_id = $5) AND version = $4 RETURNING id, tenant_id, name, status, version, created_at, updated_at',
      [id, input.name ?? null, input.status ?? null, input.version, context.tenantId ?? null]
    ); if (!result.rows[0]) { await client.query('ROLLBACK'); return null; } await this.audit(client, context, result.rows[0].tenant_id, 'school', id, 'school.update'); await client.query('COMMIT'); return schoolFromRow(result.rows[0]); }
    catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async onModuleDestroy(): Promise<void> { await this.pool.end(); }
}

export type DbClient = Pool | PoolClient;
export type TenantSchoolQueryResult = QueryResult;
