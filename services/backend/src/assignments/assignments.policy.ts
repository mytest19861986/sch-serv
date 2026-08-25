import { Injectable } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/auth.types.js';
export interface AssignmentsAuthorizationContext { readonly principal: AuthenticatedPrincipal; readonly correlationId: string; }
@Injectable()
export class AssignmentsAuthorizationPolicy {
  isSuperAdmin(c: AssignmentsAuthorizationContext): boolean { return c.principal.roles.includes('super-admin'); }
  isSchoolAdmin(c: AssignmentsAuthorizationContext): boolean { return c.principal.roles.includes('school-admin'); }
  isSchoolOperator(c: AssignmentsAuthorizationContext): boolean { return c.principal.roles.includes('school-operator'); }
  isDriver(c: AssignmentsAuthorizationContext): boolean { return c.principal.roles.includes('driver'); }
  canManage(c: AssignmentsAuthorizationContext, tenantId: string): boolean { return this.isSuperAdmin(c) || (this.isSchoolAdmin(c) && c.principal.tenantId === tenantId); }
  canRead(c: AssignmentsAuthorizationContext, tenantId: string): boolean { return this.canManage(c, tenantId) || (this.isSchoolOperator(c) && c.principal.tenantId === tenantId) || this.isDriver(c); }
}
