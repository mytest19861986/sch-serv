import { Injectable } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/auth.types.js';
import type { UserRole } from './users.types.js';

export interface UsersAuthorizationContext { readonly principal: AuthenticatedPrincipal; readonly correlationId: string; readonly authoritativeRoles?: readonly string[]; }

@Injectable()
export class UsersAuthorizationPolicy {
  private roles(context: UsersAuthorizationContext): readonly string[] { return context.authoritativeRoles ?? []; }
  isSuperAdmin(context: UsersAuthorizationContext): boolean { return this.roles(context).includes('super-admin'); }
  isSchoolAdmin(context: UsersAuthorizationContext): boolean { return this.roles(context).includes('school-admin'); }
  canManageIdentity(context: UsersAuthorizationContext): boolean { return this.isSuperAdmin(context); }
  canManageUsers(context: UsersAuthorizationContext, tenantId?: string): boolean { return this.isSuperAdmin(context) || (this.isSchoolAdmin(context) && !!context.principal.tenantId && (!tenantId || context.principal.tenantId === tenantId)); }
  canReadUser(context: UsersAuthorizationContext, tenantId: string): boolean { return this.canManageUsers(context, tenantId); }
  canManageRole(context: UsersAuthorizationContext, tenantId: string, role: UserRole): boolean { return this.isSuperAdmin(context) || (this.isSchoolAdmin(context) && role !== 'super-admin' && context.principal.tenantId === tenantId); }
  tenantScope(context: UsersAuthorizationContext): string | undefined { return this.isSuperAdmin(context) ? undefined : context.principal.tenantId; }
}
