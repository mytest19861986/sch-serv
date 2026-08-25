import { Injectable } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/auth.types.js';

export interface DriversAuthorizationContext { readonly principal: AuthenticatedPrincipal; readonly correlationId: string; }

@Injectable()
export class DriversAuthorizationPolicy {
  isSuperAdmin(c: DriversAuthorizationContext): boolean { return c.principal.roles.includes('super-admin'); }
  isSchoolAdmin(c: DriversAuthorizationContext): boolean { return c.principal.roles.includes('school-admin'); }
  isSchoolOperator(c: DriversAuthorizationContext): boolean { return c.principal.roles.includes('school-operator'); }
  canManage(c: DriversAuthorizationContext, tenantId: string): boolean { return this.isSuperAdmin(c) || (this.isSchoolAdmin(c) && c.principal.tenantId === tenantId); }
  canRead(c: DriversAuthorizationContext, tenantId: string): boolean { return this.canManage(c, tenantId) || (this.isSchoolOperator(c) && c.principal.tenantId === tenantId); }
}
