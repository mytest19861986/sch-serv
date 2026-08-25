import { BadRequestException } from '@nestjs/common';

export const ASSIGNMENT_KINDS = ['driver', 'vehicle', 'student'] as const;
export type AssignmentKind = (typeof ASSIGNMENT_KINDS)[number];
export type AssignmentStatus = 'active' | 'revoked';
export interface AssignmentRecord { readonly id: string; readonly kind: AssignmentKind; readonly tenantId: string; readonly schoolId: string; readonly serviceInstanceId: string; readonly targetId: string; readonly status: AssignmentStatus; readonly version: number; readonly createdAt: string; readonly updatedAt: string; }
export interface CreateAssignmentInput { readonly kind: AssignmentKind; readonly schoolId: string; readonly serviceInstanceId: string; readonly targetId: string; }
export interface UpdateAssignmentInput { readonly status: AssignmentStatus; readonly version: number; }
export function isUuid(value: unknown): value is string { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
export function parseUuid(value: unknown): string { if (!isUuid(value)) throw new BadRequestException(); return value; }
export function isKind(value: unknown): value is AssignmentKind { return value === 'driver' || value === 'vehicle' || value === 'student'; }
export function isStatus(value: unknown): value is AssignmentStatus { return value === 'active' || value === 'revoked'; }
