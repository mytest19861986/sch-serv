import { BadRequestException } from '@nestjs/common';

export const STUDENT_STATUSES = ['active', 'archived'] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export interface StudentRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly schoolId: string;
  readonly displayName: string;
  readonly status: StudentStatus;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateStudentInput { readonly schoolId: string; readonly displayName: string; }
export interface UpdateStudentInput { readonly displayName?: string; readonly status?: StudentStatus; readonly version: number; }

export function isUuid(value: unknown): value is string { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
export function isStudentStatus(value: unknown): value is StudentStatus { return value === 'active' || value === 'archived'; }
export function validateStudentDisplayName(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length < 1 || value.trim().length > 200) throw new BadRequestException();
  return value.trim();
}
