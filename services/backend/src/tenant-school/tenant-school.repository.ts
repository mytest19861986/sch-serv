import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient, QueryResult } from 'pg';
import type { CreateSchoolInput, CreateTenantInput, LifecycleStatus, SchoolRecord, TenantRecord, UpdateSchoolInput, UpdateTenantInput } from './tenant-school.types.js';

export const TENANT_SCHOOL_DB = Symbol('TENANT_SCHOOL_DB');

type TenantRow = { id: string; name: string; status: LifecycleStatus; version: number; created_at: Date; updated_at: Date };
type SchoolRow = TenantRow & { tenant_id: string };

function tenantFromRow(row: TenantRow): TenantRecord { return { id: row.id, name: row.name, status: row.status, version: row.version, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() }; }
function schoolFromRow(row: SchoolRow): SchoolRecord { return { ...tenantFromRow(row), tenantId: row.tenant_id }; }

@Injectable()
export class TenantSchoolRepository implements OnModuleDestroy {
  constructor(@Inject(TENANT_SCHOOL_DB) private readonly pool: Pool) {}

  async createTenant(input: CreateTenantInput): Promise<TenantRecord> {
    const result = await this.pool.query<TenantRow>('INSERT INTO tenant (id, name) VALUES ($1, $2) RETURNING id, name, status, version, created_at, updated_at', [randomUUID(), input.name]);
    return tenantFromRow(result.rows[0]!);
  }

  async getTenant(id: string): Promise<TenantRecord | null> {
    const result = await this.pool.query<TenantRow>('SELECT id, name, status, version, created_at, updated_at FROM tenant WHERE id = $1', [id]);
    return result.rows[0] ? tenantFromRow(result.rows[0]) : null;
  }

  async updateTenant(id: string, input: UpdateTenantInput): Promise<TenantRecord | null> {
    const result = await this.pool.query<TenantRow>(
      'UPDATE tenant SET name = COALESCE($2, name), status = COALESCE($3, status), version = version + 1, updated_at = NOW() WHERE id = $1 AND version = $4 RETURNING id, name, status, version, created_at, updated_at',
      [id, input.name ?? null, input.status ?? null, input.version]
    );
    return result.rows[0] ? tenantFromRow(result.rows[0]) : null;
  }

  async createSchool(input: CreateSchoolInput): Promise<SchoolRecord> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<SchoolRow>('INSERT INTO school (id, tenant_id, name) VALUES ($1, $2, $3) RETURNING id, tenant_id, name, status, version, created_at, updated_at', [randomUUID(), input.tenantId, input.name]);
      await client.query('COMMIT');
      return schoolFromRow(result.rows[0]!);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }

  async getSchool(id: string): Promise<SchoolRecord | null> {
    const result = await this.pool.query<SchoolRow>('SELECT id, tenant_id, name, status, version, created_at, updated_at FROM school WHERE id = $1', [id]);
    return result.rows[0] ? schoolFromRow(result.rows[0]) : null;
  }

  async updateSchool(id: string, input: UpdateSchoolInput): Promise<SchoolRecord | null> {
    const result = await this.pool.query<SchoolRow>(
      'UPDATE school SET name = COALESCE($2, name), status = COALESCE($3, status), version = version + 1, updated_at = NOW() WHERE id = $1 AND version = $4 RETURNING id, tenant_id, name, status, version, created_at, updated_at',
      [id, input.name ?? null, input.status ?? null, input.version]
    );
    return result.rows[0] ? schoolFromRow(result.rows[0]) : null;
  }

  async onModuleDestroy(): Promise<void> { await this.pool.end(); }
}

export type DbClient = Pool | PoolClient;
export type TenantSchoolQueryResult = QueryResult;
