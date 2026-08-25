import { BadRequestException } from '@nestjs/common';

export const DRIVER_STATUSES = ['active', 'archived'] as const;
export type DriverStatus = (typeof DRIVER_STATUSES)[number];

export interface DriverRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly status: DriverStatus;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateDriverInput { readonly tenantId: string; readonly userId: string; }
export interface UpdateDriverInput { readonly status: DriverStatus; readonly version: number; }

export function isUuid(value: unknown): value is string { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
export function isDriverStatus(value: unknown): value is DriverStatus { return value === 'active' || value === 'archived'; }
export function parseUuid(value: unknown): string { if (!isUuid(value)) throw new BadRequestException(); return value; }
