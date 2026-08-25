import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { StudentsRepository } from './students.repository.js';
import { StudentsAuthorizationPolicy, type StudentsAuthorizationContext } from './students.policy.js';
import { isStudentStatus, isUuid, validateStudentDisplayName, type CreateStudentInput, type UpdateStudentInput } from './students.types.js';

function assertBodyKeys(body: Record<string, unknown>, allowed: readonly string[]): void { if (Object.keys(body).some((key) => !allowed.includes(key))) throw new BadRequestException(); }
function parseCreate(body: unknown): CreateStudentInput { const value = (body ?? {}) as Record<string, unknown>; assertBodyKeys(value, ['school_id', 'display_name']); if (!isUuid(value.school_id)) throw new BadRequestException(); return { schoolId: value.school_id, displayName: validateStudentDisplayName(value.display_name) }; }
function parseUpdate(body: unknown): UpdateStudentInput { const value = (body ?? {}) as Record<string, unknown>; assertBodyKeys(value, ['display_name', 'status', 'version']); if (!Number.isInteger(value.version) || (value.display_name === undefined && value.status === undefined)) throw new BadRequestException(); if (value.status !== undefined && !isStudentStatus(value.status)) throw new BadRequestException(); return { displayName: value.display_name === undefined ? undefined : validateStudentDisplayName(value.display_name), status: value.status as UpdateStudentInput['status'], version: value.version as number }; }
function persist<T>(operation: () => Promise<T>): Promise<T> { return operation().catch((error: unknown) => { const code = (error as { code?: string }).code; if (code === 'AUTHORITY_REVOKED') throw new ConflictException(); if (code === 'SCHOOL_LIFECYCLE_DENIED') throw new NotFoundException(); if (code === '23503' || code === '23514') throw new BadRequestException(); if (code === '23505') throw new ConflictException(); throw error; }); }

@Injectable()
export class StudentsService {
  constructor(private readonly repository: StudentsRepository, private readonly policy: StudentsAuthorizationPolicy) {}

  async create(context: StudentsAuthorizationContext, body: unknown) {
    if (!isUuid(context.principal.subject)) throw new NotFoundException();
    const input = parseCreate(body);
    const school = await this.repository.getSchoolContext(input.schoolId);
    if (!school || school.status !== 'active') throw new NotFoundException();
    if (!this.policy.canManage(context, school.tenantId)) throw new NotFoundException();
    return persist(() => this.repository.create(input, { actorId: context.principal.subject, correlationId: context.correlationId, requiredRoles: ['school-admin', 'super-admin'] }));
  }

  async list(context: StudentsAuthorizationContext, schoolId: string) {
    if (!isUuid(context.principal.subject)) throw new NotFoundException();
    if (!isUuid(schoolId)) throw new NotFoundException();
    const rows = await this.repository.list(schoolId, this.policy.isSuperAdmin(context) ? undefined : context.principal.tenantId);
    if (!rows.length) return [];
    if (!this.policy.canRead(context, rows[0]!.tenantId)) throw new NotFoundException();
    return rows;
  }

  async get(context: StudentsAuthorizationContext, id: string, schoolId: string) {
    if (!isUuid(context.principal.subject)) throw new NotFoundException();
    if (!isUuid(id) || !isUuid(schoolId)) throw new NotFoundException();
    const row = await this.repository.get(id, schoolId, this.policy.isSuperAdmin(context) ? undefined : context.principal.tenantId);
    if (!row || !this.policy.canRead(context, row.tenantId)) throw new NotFoundException();
    return row;
  }

  async update(context: StudentsAuthorizationContext, id: string, schoolId: string, body: unknown) {
    if (!isUuid(context.principal.subject)) throw new NotFoundException();
    if (!isUuid(id) || !isUuid(schoolId)) throw new NotFoundException();
    const current = await this.repository.get(id, schoolId, this.policy.isSuperAdmin(context) ? undefined : context.principal.tenantId);
    if (!current || !this.policy.canManage(context, current.tenantId)) throw new NotFoundException();
    return persist(async () => { const updated = await this.repository.update(id, schoolId, parseUpdate(body), { actorId: context.principal.subject, correlationId: context.correlationId, requiredRoles: ['school-admin', 'super-admin'] }); if (!updated) throw new ConflictException(); return updated; });
  }
}
