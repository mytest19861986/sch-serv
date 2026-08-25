import { Injectable } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/auth.types.js';

export interface VehiclesAuthorizationContext { readonly principal: AuthenticatedPrincipal; readonly correlationId: string; }

@Injectable()
export class VehiclesAuthorizationPolicy {
  isSuperAdmin(c: VehiclesAuthorizationContext): boolean { return c.principal.roles.includes('super-admin'); }
  isSchoolAdmin(c: VehiclesAuthorizationContext): boolean { return c.principal.roles.includes('school-admin'); }
  isSchoolOperator(c: VehiclesAuthorizationContext): boolean { return c.principal.roles.includes('school-operator'); }
  canManage(c: VehiclesAuthorizationContext, tenantId: string): boolean { return this.isSuperAdmin(c) || (this.isSchoolAdmin(c) && c.principal.tenantId === tenantId); }
  canRead(c: VehiclesAuthorizationContext, tenantId: string): boolean { return this.canManage(c, tenantId) || (this.isSchoolOperator(c) && c.principal.tenantId === tenantId); }
}
