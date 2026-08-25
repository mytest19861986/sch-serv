import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { ContextualRequest } from '../common/request-context.js';
import type { AuthenticatedPrincipal } from '../auth/auth.types.js';
import { TenantSchoolRepository } from './tenant-school.repository.js';
import { isLifecycleStatus, validateName, type CreateTenantInput, type UpdateTenantInput } from './tenant-school.types.js';

function role(principal: AuthenticatedPrincipal): string | undefined { return principal.roles.find((item) => item === 'super-admin' || item === 'school-admin'); }
function requirePrincipal(request: ContextualRequest): AuthenticatedPrincipal { if (!request.principal) throw new UnauthorizedException(); return request.principal; }
function assertBodyKeys(body: Record<string, unknown>, allowed: readonly string[]): void { if (Object.keys(body).some((key) => !allowed.includes(key))) throw new BadRequestException(); }
function parseCreateTenant(body: unknown): CreateTenantInput { const value = (body ?? {}) as Record<string, unknown>; assertBodyKeys(value, ['name']); return { name: validateName(value.name) }; }
function parseUpdate(body: unknown): UpdateTenantInput { const value = (body ?? {}) as Record<string, unknown>; assertBodyKeys(value, ['name', 'status', 'version']); if (!Number.isInteger(value.version) || (value.name === undefined && value.status === undefined)) throw new BadRequestException(); if (value.status !== undefined && !isLifecycleStatus(value.status)) throw new BadRequestException(); return { name: value.name === undefined ? undefined : validateName(value.name), status: value.status as UpdateTenantInput['status'], version: value.version as number }; }

@Injectable()
export class TenantSchoolService {
  constructor(private readonly repository: TenantSchoolRepository) {}

  async createTenant(request: ContextualRequest, body: unknown) {
    const principal = requirePrincipal(request); if (role(principal) !== 'super-admin') throw new ForbiddenException();
    return this.repository.createTenant(parseCreateTenant(body));
  }

  async getTenant(request: ContextualRequest, id: string) {
    const principal = requirePrincipal(request); const record = await this.repository.getTenant(id); if (!record) throw new NotFoundException();
    if (role(principal) !== 'super-admin' && principal.tenantId !== record.id) throw new NotFoundException(); return record;
  }

  async updateTenant(request: ContextualRequest, id: string, body: unknown) {
    const principal = requirePrincipal(request); const current = await this.repository.getTenant(id); if (!current) throw new NotFoundException();
    if (role(principal) !== 'super-admin' && principal.tenantId !== current.id) throw new NotFoundException();
    const updated = await this.repository.updateTenant(id, parseUpdate(body)); if (!updated) throw new ConflictException(); return updated;
  }

  async createSchool(request: ContextualRequest, body: unknown) {
    const principal = requirePrincipal(request); const value = (body ?? {}) as Record<string, unknown>; assertBodyKeys(value, ['tenant_id', 'name']);
    const requestedTenant = value.tenant_id === undefined ? principal.tenantId : value.tenant_id;
    if (typeof requestedTenant !== 'string') throw new BadRequestException();
    if (role(principal) !== 'super-admin' && principal.tenantId !== requestedTenant) throw new NotFoundException();
    if (role(principal) !== 'super-admin' && role(principal) !== 'school-admin') throw new ForbiddenException();
    const tenant = await this.repository.getTenant(requestedTenant); if (!tenant) throw new NotFoundException();
    return this.repository.createSchool({ tenantId: requestedTenant, name: validateName(value.name) });
  }

  async getSchool(request: ContextualRequest, id: string) {
    const principal = requirePrincipal(request); const record = await this.repository.getSchool(id); if (!record) throw new NotFoundException();
    if (role(principal) !== 'super-admin' && principal.tenantId !== record.tenantId) throw new NotFoundException(); return record;
  }

  async updateSchool(request: ContextualRequest, id: string, body: unknown) {
    const principal = requirePrincipal(request); const current = await this.repository.getSchool(id); if (!current) throw new NotFoundException();
    if (role(principal) !== 'super-admin' && (role(principal) !== 'school-admin' || principal.tenantId !== current.tenantId)) throw new NotFoundException();
    const updated = await this.repository.updateSchool(id, parseUpdate(body)); if (!updated) throw new ConflictException(); return updated;
  }
}
