import { BadRequestException } from '@nestjs/common';

export const USER_STATUSES = ['active', 'disabled'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];
export const MEMBERSHIP_STATUSES = ['active', 'revoked'] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];
export const USER_ROLES = ['super-admin', 'school-admin', 'school-operator', 'driver', 'parent'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface UserRecord {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly status: UserStatus;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TenantMembershipRecord {
  readonly id: string;
  readonly userId: string;
  readonly tenantId: string;
  readonly status: MembershipStatus;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface RoleAssignmentRecord {
  readonly id: string;
  readonly membershipId: string;
  readonly role: UserRole;
  readonly status: MembershipStatus;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateUserInput { readonly email: string; readonly displayName: string; }
export interface UpdateUserInput { readonly displayName?: string; readonly status?: UserStatus; readonly version: number; }
export interface CreateMembershipInput { readonly userId: string; readonly tenantId: string; }
export interface UpdateMembershipInput { readonly status?: MembershipStatus; readonly version: number; }
export interface CreateRoleAssignmentInput { readonly membershipId: string; readonly role: UserRole; }
export interface UpdateRoleAssignmentInput { readonly role?: UserRole; readonly status?: MembershipStatus; readonly version: number; }

export function isUuid(value: unknown): value is string { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
export function isUserStatus(value: unknown): value is UserStatus { return value === 'active' || value === 'disabled'; }
export function isMembershipStatus(value: unknown): value is MembershipStatus { return value === 'active' || value === 'revoked'; }
export function isUserRole(value: unknown): value is UserRole { return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value); }
export function validateEmail(value: unknown): string { if (typeof value !== 'string' || value.length < 3 || value.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new BadRequestException(); return value.trim().toLowerCase(); }
export function validateDisplayName(value: unknown): string { if (typeof value !== 'string' || value.trim().length < 1 || value.trim().length > 200) throw new BadRequestException(); return value.trim(); }
