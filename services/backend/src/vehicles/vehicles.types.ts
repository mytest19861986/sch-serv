import { BadRequestException } from '@nestjs/common';

export const VEHICLE_STATUSES = ['active', 'archived'] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export interface VehicleRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly identifier: string;
  readonly status: VehicleStatus;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateVehicleInput { readonly tenantId: string; readonly identifier: string; }
export interface UpdateVehicleInput { readonly status: VehicleStatus; readonly version: number; }

export function isUuid(value: unknown): value is string { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
export function isVehicleStatus(value: unknown): value is VehicleStatus { return value === 'active' || value === 'archived'; }
export function parseIdentifier(value: unknown): string { if (typeof value !== 'string' || value.trim().length < 1 || value.trim().length > 120) throw new BadRequestException(); return value.trim(); }
