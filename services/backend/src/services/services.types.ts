import { BadRequestException } from '@nestjs/common';

export type TransportServiceStatus = 'active' | 'archived';
export interface TransportServiceRecord { readonly id: string; readonly tenantId: string; readonly schoolId: string; readonly routeId: string; readonly name: string; readonly status: TransportServiceStatus; readonly version: number; readonly createdAt: string; readonly updatedAt: string; }
export interface CreateTransportServiceInput { readonly schoolId: string; readonly routeId: string; readonly name: string; }
export interface UpdateTransportServiceInput { readonly name?: string; readonly status?: TransportServiceStatus; readonly version: number; }
export function isUuid(value: unknown): value is string { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
export function isTransportServiceStatus(value: unknown): value is TransportServiceStatus { return value === 'active' || value === 'archived'; }
export function validateTransportServiceName(value: unknown): string { if (typeof value !== 'string') throw new BadRequestException(); const name = value.trim(); if (name.length < 1 || name.length > 200) throw new BadRequestException(); return name; }
