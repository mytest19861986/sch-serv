import { Injectable } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/auth.types.js';

export interface RoutesAuthorizationContext { readonly principal: AuthenticatedPrincipal; readonly correlationId: string; }

@Injectable()
export class RoutesAuthorizationPolicy {
  isSuperAdmin(context: RoutesAuthorizationContext): boolean { return context.principal.roles.includes('super-admin'); }
  isSchoolAdmin(context: RoutesAuthorizationContext): boolean { return context.principal.roles.includes('school-admin'); }
  isSchoolOperator(context: RoutesAuthorizationContext): boolean { return context.principal.roles.includes('school-operator'); }
  canManage(context: RoutesAuthorizationContext, tenantId: string): boolean { return this.isSuperAdmin(context) || (this.isSchoolAdmin(context) && context.principal.tenantId === tenantId); }
  canRead(context: RoutesAuthorizationContext, tenantId: string): boolean { return this.canManage(context, tenantId) || (this.isSchoolOperator(context) && context.principal.tenantId === tenantId); }
}
