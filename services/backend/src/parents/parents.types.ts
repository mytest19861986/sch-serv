import { BadRequestException } from '@nestjs/common';

export const PARENT_STATUSES = ['active', 'archived'] as const;
export type ParentStatus = (typeof PARENT_STATUSES)[number];
export interface ParentRecord { readonly id: string; readonly tenantId: string; readonly userId: string; readonly status: ParentStatus; readonly version: number; readonly createdAt: string; readonly updatedAt: string; }
export interface RelationshipRecord { readonly id: string; readonly tenantId: string; readonly schoolId: string; readonly studentId: string; readonly guardianId: string; readonly status: 'active' | 'revoked'; readonly version: number; }
export interface CreateParentInput { readonly tenantId: string; readonly userId: string; }
export interface UpdateParentInput { readonly status?: ParentStatus; readonly version: number; }
export interface CreateRelationshipInput { readonly studentId: string; readonly guardianId: string; }
export function isUuid(value: unknown): value is string { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
export function isParentStatus(value: unknown): value is ParentStatus { return value === 'active' || value === 'archived'; }
export function parseUuid(value: unknown): string { if (!isUuid(value)) throw new BadRequestException(); return value; }
