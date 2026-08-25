import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import type { CreateStudentInput, StudentRecord, StudentStatus, UpdateStudentInput } from './students.types.js';

export const STUDENTS_DB = Symbol('STUDENTS_DB');
type StudentRow = { id: string; tenant_id: string; school_id: string; display_name: string; status: StudentStatus; version: number; created_at: Date; updated_at: Date };
export interface StudentsAuditContext { readonly actorId: string; readonly correlationId: string; readonly requiredRoles?: readonly string[]; }
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function studentFromRow(row: StudentRow): StudentRecord { return { id: row.id, tenantId: row.tenant_id, schoolId: row.school_id, displayName: row.display_name, status: row.status, version: row.version, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString() }; }
function authorityRevoked(): Error { const error = new Error('AUTHORITY_REVOKED'); Object.assign(error, { code: 'AUTHORITY_REVOKED' }); return error; }
function schoolLifecycleDenied(): Error { const error = new Error('SCHOOL_LIFECYCLE_DENIED'); Object.assign(error, { code: 'SCHOOL_LIFECYCLE_DENIED' }); return error; }

@Injectable()
export class StudentsRepository implements OnModuleDestroy {
  constructor(@Inject(STUDENTS_DB) private readonly pool: Pool) {}

  private async lockActorAuthority(client: PoolClient, actorId: string, tenantId: string, requiredRoles: readonly string[]): Promise<void> {
    if (!UUID_PATTERN.test(actorId)) throw authorityRevoked();
    const result = await client.query<{ role: string }>(`SELECT r.role FROM "user" u JOIN tenant_membership m ON m.user_id = u.id AND m.status = 'active' JOIN role_assignment r ON r.membership_id = m.id AND r.status = 'active' JOIN tenant t ON t.id = m.tenant_id AND t.status = 'active' WHERE u.id = $1 AND u.status = 'active' AND (m.tenant_id = $2 OR r.role = 'super-admin') AND r.role = ANY($3::text[]) FOR UPDATE OF u, m, r, t`, [actorId, tenantId, requiredRoles]);
    if (!result.rows.length) throw authorityRevoked();
  }

  private async audit(client: PoolClient, context: StudentsAuditContext, tenantId: string, targetId: string, action: string): Promise<void> {
    await client.query('INSERT INTO audit_record (id, tenant_id, actor_id, actor_type, action, target_type, target_id, outcome, correlation_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [randomUUID(), tenantId, context.actorId, 'human', action, 'student', targetId, 'committed', context.correlationId]);
  }

  async create(input: CreateStudentInput, context: StudentsAuditContext): Promise<StudentRecord> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const school = await client.query<{ tenant_id: string; status: string }>('SELECT tenant_id, status FROM school WHERE id = $1 FOR UPDATE', [input.schoolId]);
      if (!school.rows[0] || school.rows[0].status !== 'active') throw schoolLifecycleDenied();
      await this.lockActorAuthority(client, context.actorId, school.rows[0].tenant_id, context.requiredRoles ?? ['school-admin', 'super-admin']);
      const result = await client.query<StudentRow>('INSERT INTO student (id, tenant_id, school_id, display_name) VALUES ($1, $2, $3, $4) RETURNING id, tenant_id, school_id, display_name, status, version, created_at, updated_at', [randomUUID(), school.rows[0].tenant_id, input.schoolId, input.displayName]);
      await this.audit(client, context, school.rows[0].tenant_id, result.rows[0]!.id, 'student.create');
      await client.query('COMMIT');
      return studentFromRow(result.rows[0]!);
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async list(schoolId: string, tenantId?: string): Promise<StudentRecord[]> {
    const result = await this.pool.query<StudentRow>('SELECT s.id, s.tenant_id, s.school_id, s.display_name, s.status, s.version, s.created_at, s.updated_at FROM student s JOIN school sc ON sc.id = s.school_id AND sc.tenant_id = s.tenant_id AND sc.status = \'active\' WHERE s.school_id = $1 AND ($2::uuid IS NULL OR s.tenant_id = $2) AND s.status = \'active\' ORDER BY s.id', [schoolId, tenantId ?? null]);
    return result.rows.map(studentFromRow);
  }

  async getSchoolContext(schoolId: string): Promise<{ tenantId: string; status: string } | null> {
    const result = await this.pool.query<{ tenant_id: string; status: string }>('SELECT tenant_id, status FROM school WHERE id = $1', [schoolId]);
    return result.rows[0] ? { tenantId: result.rows[0].tenant_id, status: result.rows[0].status } : null;
  }

  async get(id: string, schoolId: string, tenantId?: string): Promise<StudentRecord | null> {
    const result = await this.pool.query<StudentRow>('SELECT s.id, s.tenant_id, s.school_id, s.display_name, s.status, s.version, s.created_at, s.updated_at FROM student s JOIN school sc ON sc.id = s.school_id AND sc.tenant_id = s.tenant_id AND sc.status = \'active\' WHERE s.id = $1 AND s.school_id = $2 AND ($3::uuid IS NULL OR s.tenant_id = $3) AND s.status = \'active\'', [id, schoolId, tenantId ?? null]);
    return result.rows[0] ? studentFromRow(result.rows[0]) : null;
  }

  async update(id: string, schoolId: string, input: UpdateStudentInput, context: StudentsAuditContext): Promise<StudentRecord | null> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const current = await client.query<{ tenant_id: string; status: StudentStatus }>('SELECT tenant_id, status FROM student WHERE id = $1 AND school_id = $2 FOR UPDATE', [id, schoolId]);
      if (!current.rows[0]) { await client.query('ROLLBACK'); return null; }
      const school = await client.query<{ status: string }>('SELECT status FROM school WHERE id = $1 FOR UPDATE', [schoolId]);
      if (!school.rows[0] || school.rows[0].status !== 'active') throw schoolLifecycleDenied();
      await this.lockActorAuthority(client, context.actorId, current.rows[0].tenant_id, context.requiredRoles ?? ['school-admin', 'super-admin']);
      const result = await client.query<StudentRow>('UPDATE student SET display_name = COALESCE($3, display_name), status = COALESCE($4, status), version = version + 1, updated_at = NOW() WHERE id = $1 AND school_id = $2 AND version = $5 RETURNING id, tenant_id, school_id, display_name, status, version, created_at, updated_at', [id, schoolId, input.displayName ?? null, input.status ?? null, input.version]);
      if (!result.rows[0]) { await client.query('ROLLBACK'); return null; }
      await this.audit(client, context, result.rows[0].tenant_id, id, 'student.update');
      await client.query('COMMIT');
      return studentFromRow(result.rows[0]);
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async onModuleDestroy(): Promise<void> { await this.pool.end(); }
}
