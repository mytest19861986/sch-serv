import { Injectable } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/auth.types.js';

export interface StudentsAuthorizationContext { readonly principal: AuthenticatedPrincipal; readonly correlationId: string; }

@Injectable()
export class StudentsAuthorizationPolicy {
  isSuperAdmin(context: StudentsAuthorizationContext): boolean { return context.principal.roles.includes('super-admin'); }
  isSchoolAdmin(context: StudentsAuthorizationContext): boolean { return context.principal.roles.includes('school-admin'); }
  isSchoolOperator(context: StudentsAuthorizationContext): boolean { return context.principal.roles.includes('school-operator'); }
  canManage(context: StudentsAuthorizationContext, tenantId: string): boolean { return this.isSuperAdmin(context) || (this.isSchoolAdmin(context) && context.principal.tenantId === tenantId); }
  canRead(context: StudentsAuthorizationContext, tenantId: string): boolean { return this.canManage(context, tenantId) || (this.isSchoolOperator(context) && context.principal.tenantId === tenantId); }
}
