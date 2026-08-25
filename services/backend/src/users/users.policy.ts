import { Injectable } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/auth.types.js';
import type { UserRole } from './users.types.js';

export interface UsersAuthorizationContext { readonly principal: AuthenticatedPrincipal; readonly correlationId: string; }

@Injectable()
export class UsersAuthorizationPolicy {
  isSuperAdmin(context: UsersAuthorizationContext): boolean { return context.principal.roles.includes('super-admin'); }
  isSchoolAdmin(context: UsersAuthorizationContext): boolean { return context.principal.roles.includes('school-admin'); }
  canManageUsers(context: UsersAuthorizationContext, tenantId?: string): boolean { return this.isSuperAdmin(context) || (this.isSchoolAdmin(context) && !!context.principal.tenantId && (!tenantId || context.principal.tenantId === tenantId)); }
  canReadUser(context: UsersAuthorizationContext, tenantId: string): boolean { return this.canManageUsers(context, tenantId); }
  canManageRole(context: UsersAuthorizationContext, tenantId: string, role: UserRole): boolean { return this.isSuperAdmin(context) || (this.isSchoolAdmin(context) && role !== 'super-admin' && context.principal.tenantId === tenantId); }
  tenantScope(context: UsersAuthorizationContext): string | undefined { return this.isSuperAdmin(context) ? undefined : context.principal.tenantId; }
}
