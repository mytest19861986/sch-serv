import { BadRequestException } from '@nestjs/common';

export type RouteStatus = 'active' | 'archived';

export interface RouteRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly schoolId: string;
  readonly name: string;
  readonly status: RouteStatus;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateRouteInput { readonly schoolId: string; readonly name: string; }
export interface UpdateRouteInput { readonly status?: RouteStatus; readonly name?: string; readonly version: number; }

export function isUuid(value: unknown): value is string { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
export function isRouteStatus(value: unknown): value is RouteStatus { return value === 'active' || value === 'archived'; }
export function validateRouteName(value: unknown): string {
  if (typeof value !== 'string') throw new BadRequestException();
  const name = value.trim();
  if (name.length < 1 || name.length > 200) throw new BadRequestException();
  return name;
}
