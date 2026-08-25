import { Injectable } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/auth.types.js';
export interface ServicesAuthorizationContext { readonly principal: AuthenticatedPrincipal; readonly correlationId: string; }
@Injectable()
export class ServicesAuthorizationPolicy {
  isSuperAdmin(context: ServicesAuthorizationContext): boolean { return context.principal.roles.includes('super-admin'); }
  isSchoolAdmin(context: ServicesAuthorizationContext): boolean { return context.principal.roles.includes('school-admin'); }
  isSchoolOperator(context: ServicesAuthorizationContext): boolean { return context.principal.roles.includes('school-operator'); }
  canManage(context: ServicesAuthorizationContext, tenantId: string): boolean { return this.isSuperAdmin(context) || (this.isSchoolAdmin(context) && context.principal.tenantId === tenantId); }
  canRead(context: ServicesAuthorizationContext, tenantId: string): boolean { return this.canManage(context, tenantId) || (this.isSchoolOperator(context) && context.principal.tenantId === tenantId); }
}
