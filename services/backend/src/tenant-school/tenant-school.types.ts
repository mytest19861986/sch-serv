export type LifecycleStatus = 'active' | 'suspended' | 'archived';

export interface TenantRecord {
  readonly id: string;
  readonly name: string;
  readonly status: LifecycleStatus;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SchoolRecord extends TenantRecord {
  readonly tenantId: string;
}

export interface CreateTenantInput { readonly name: string; }
export interface UpdateTenantInput { readonly name?: string; readonly status?: LifecycleStatus; readonly version: number; }
export interface CreateSchoolInput { readonly tenantId?: string; readonly name: string; }
export interface UpdateSchoolInput { readonly name?: string; readonly status?: LifecycleStatus; readonly version: number; }

export const TENANT_ROLES = ['super-admin', 'school-admin'] as const;
export type TenantRole = (typeof TENANT_ROLES)[number];

export function isLifecycleStatus(value: unknown): value is LifecycleStatus {
  return value === 'active' || value === 'suspended' || value === 'archived';
}

export function validateName(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length < 1 || value.trim().length > 200) throw new Error('VALIDATION_ERROR');
  return value.trim();
}
