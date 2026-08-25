import { Injectable } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/auth.types.js';

export interface TenantSchoolAuthorizationContext { readonly principal: AuthenticatedPrincipal; readonly correlationId: string; }

@Injectable()
export class TenantSchoolAuthorizationPolicy {
  isSuperAdmin(context: TenantSchoolAuthorizationContext): boolean { return context.principal.roles.includes('super-admin'); }
  isSchoolAdmin(context: TenantSchoolAuthorizationContext): boolean { return context.principal.roles.includes('school-admin'); }
  canManageTenant(context: TenantSchoolAuthorizationContext): boolean { return this.isSuperAdmin(context); }
  canAccessTenant(context: TenantSchoolAuthorizationContext, tenantId: string): boolean { return this.isSuperAdmin(context) || (this.isSchoolAdmin(context) && context.principal.tenantId === tenantId); }
  canManageSchool(context: TenantSchoolAuthorizationContext, tenantId: string): boolean { return this.isSuperAdmin(context) || (this.isSchoolAdmin(context) && context.principal.tenantId === tenantId); }
}
