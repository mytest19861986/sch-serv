import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantSchoolRepository } from './tenant-school.repository.js';
import { TenantSchoolAuthorizationPolicy, type TenantSchoolAuthorizationContext } from './tenant-school.policy.js';
import { isLifecycleStatus, validateName, type CreateTenantInput, type UpdateTenantInput } from './tenant-school.types.js';

function assertBodyKeys(body: Record<string, unknown>, allowed: readonly string[]): void { if (Object.keys(body).some((key) => !allowed.includes(key))) throw new BadRequestException(); }
function isUuid(value: string): boolean { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
function parseCreateTenant(body: unknown): CreateTenantInput { const value = (body ?? {}) as Record<string, unknown>; assertBodyKeys(value, ['name']); return { name: validateName(value.name) }; }
function parseUpdate(body: unknown): UpdateTenantInput { const value = (body ?? {}) as Record<string, unknown>; assertBodyKeys(value, ['name', 'status', 'version']); if (!Number.isInteger(value.version) || (value.name === undefined && value.status === undefined)) throw new BadRequestException(); if (value.status !== undefined && !isLifecycleStatus(value.status)) throw new BadRequestException(); return { name: value.name === undefined ? undefined : validateName(value.name), status: value.status as UpdateTenantInput['status'], version: value.version as number }; }
async function persist<T>(operation: () => Promise<T>): Promise<T> { try { return await operation(); } catch (error) { const code = (error as { code?: string }).code; if (code === '23505') throw new ConflictException(); if (code === '23503' || code === '23514') throw new BadRequestException(); throw error; } }

@Injectable()
export class TenantSchoolService {
  constructor(private readonly repository: TenantSchoolRepository, private readonly policy: TenantSchoolAuthorizationPolicy) {}

  async createTenant(context: TenantSchoolAuthorizationContext, body: unknown) {
    if (!this.policy.canManageTenant(context)) throw new ForbiddenException();
    return persist(() => this.repository.createTenant(parseCreateTenant(body), { actorId: context.principal.subject, correlationId: context.correlationId }));
  }

  async getTenant(context: TenantSchoolAuthorizationContext, id: string) {
    if (!isUuid(id)) throw new NotFoundException();
    const scopedTenant = this.policy.isSuperAdmin(context) ? undefined : context.principal.tenantId;
    const record = await this.repository.getTenant(id, scopedTenant); if (!record || !this.policy.canAccessTenant(context, record.id)) throw new NotFoundException(); return record;
  }

  async updateTenant(context: TenantSchoolAuthorizationContext, id: string, body: unknown) {
    if (!isUuid(id)) throw new NotFoundException();
    if (!this.policy.canManageTenant(context)) throw new NotFoundException();
    const current = await this.repository.getTenant(id); if (!current) throw new NotFoundException();
    const updated = await persist(() => this.repository.updateTenant(id, parseUpdate(body), { actorId: context.principal.subject, correlationId: context.correlationId })); if (!updated) throw new ConflictException(); return updated;
  }

  async createSchool(context: TenantSchoolAuthorizationContext, body: unknown) {
    const value = (body ?? {}) as Record<string, unknown>; assertBodyKeys(value, ['tenant_id', 'name']);
    const requestedTenant = value.tenant_id === undefined ? context.principal.tenantId : value.tenant_id;
    if (typeof requestedTenant !== 'string' || !isUuid(requestedTenant)) throw new BadRequestException();
    if (!this.policy.canManageSchool(context, requestedTenant)) throw new NotFoundException();
    const tenant = await this.repository.getTenant(requestedTenant, this.policy.isSuperAdmin(context) ? undefined : requestedTenant); if (!tenant || tenant.status !== 'active') throw new NotFoundException();
    return persist(() => this.repository.createSchool({ tenantId: requestedTenant, name: validateName(value.name) }, { actorId: context.principal.subject, correlationId: context.correlationId }));
  }

  async getSchool(context: TenantSchoolAuthorizationContext, id: string) {
    if (!isUuid(id)) throw new NotFoundException();
    const scopedTenant = this.policy.isSuperAdmin(context) ? undefined : context.principal.tenantId;
    const record = await this.repository.getSchool(id, scopedTenant); if (!record || !this.policy.canManageSchool(context, record.tenantId)) throw new NotFoundException();
    if (!this.policy.isSuperAdmin(context) && record.status !== 'active') throw new NotFoundException(); return record;
  }

  async updateSchool(context: TenantSchoolAuthorizationContext, id: string, body: unknown) {
    if (!isUuid(id)) throw new NotFoundException();
    const scopedTenant = this.policy.isSuperAdmin(context) ? undefined : context.principal.tenantId;
    const current = await this.repository.getSchool(id, scopedTenant); if (!current || !this.policy.canManageSchool(context, current.tenantId)) throw new NotFoundException();
    if (!this.policy.isSuperAdmin(context) && current.status !== 'active') throw new NotFoundException();
    const updated = await persist(() => this.repository.updateSchool(id, parseUpdate(body), { tenantId: scopedTenant, actorId: context.principal.subject, correlationId: context.correlationId })); if (!updated) throw new ConflictException(); return updated;
  }
}
