import { Injectable } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/auth.types.js';
export interface ParentsAuthorizationContext { readonly principal: AuthenticatedPrincipal; readonly correlationId: string; }
@Injectable()
export class ParentsAuthorizationPolicy {
  isSuperAdmin(c: ParentsAuthorizationContext): boolean { return c.principal.roles.includes('super-admin'); }
  isSchoolAdmin(c: ParentsAuthorizationContext): boolean { return c.principal.roles.includes('school-admin'); }
  isParent(c: ParentsAuthorizationContext): boolean { return c.principal.roles.includes('parent'); }
  canManage(c: ParentsAuthorizationContext, tenantId: string): boolean { return this.isSuperAdmin(c) || (this.isSchoolAdmin(c) && c.principal.tenantId === tenantId); }
  canReadManaged(c: ParentsAuthorizationContext, tenantId: string): boolean { return this.canManage(c, tenantId); }
}
