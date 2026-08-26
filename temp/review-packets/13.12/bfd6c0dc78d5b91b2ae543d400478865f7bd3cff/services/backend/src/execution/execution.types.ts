import { BadRequestException } from '@nestjs/common';

export type ExecutionStatus = 'not_started' | 'in_progress';

export interface ServiceExecutionSummary {
  readonly id: string;
  readonly tenantId: string;
  readonly schoolId: string;
  readonly operationalDate: string;
  readonly lifecycleStatus: string;
  readonly executionStatus: ExecutionStatus;
  readonly version: number;
}

export interface DriverRosterEntry {
  readonly id: string;
  readonly displayName: string;
}

export interface StartServiceInput { readonly expectedVersion: number; }
export interface PickupInput {
  readonly clientEventId: string;
  readonly occurredAt: string;
  readonly knownStateVersion?: number;
  readonly deviceContext?: Record<string, string>;
}

export interface PickupResult {
  readonly disposition: 'COMMITTED' | 'REPLAYED';
  readonly event_id: string;
  readonly service_instance_id: string;
  readonly student_id: string;
  readonly state: 'picked_up';
  readonly state_version: number;
  readonly server_time: string;
  readonly correlation_id: string;
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function parseStartInput(body: unknown): StartServiceInput {
  const value = (body ?? {}) as Record<string, unknown>;
  if (Object.keys(value).some((key) => key !== 'expectedVersion') || !Number.isInteger(value.expectedVersion) || Number(value.expectedVersion) < 1) {
    throw new BadRequestException();
  }
  return { expectedVersion: Number(value.expectedVersion) };
}

export function parsePickupInput(body: unknown): PickupInput {
  const value = (body ?? {}) as Record<string, unknown>;
  const allowed = new Set(['client_event_id', 'occurred_at', 'known_state_version', 'device_context']);
  if (Object.keys(value).some((key) => !allowed.has(key)) || !isUuid(value.client_event_id) || typeof value.occurred_at !== 'string' || Number.isNaN(Date.parse(value.occurred_at))) {
    throw new BadRequestException();
  }
  if (value.known_state_version !== undefined && (!Number.isInteger(value.known_state_version) || Number(value.known_state_version) < 0)) throw new BadRequestException();
  if (value.device_context !== undefined) {
    const context = value.device_context as Record<string, unknown>;
    if (!context || typeof context !== 'object' || Array.isArray(context) || Object.keys(context).length > 8 || Object.keys(context).some((key) => key.length > 40 || typeof context[key] !== 'string' || String(context[key]).length > 200)) throw new BadRequestException();
  }
  return { clientEventId: value.client_event_id.toLowerCase(), occurredAt: value.occurred_at, knownStateVersion: value.known_state_version === undefined ? undefined : Number(value.known_state_version), deviceContext: value.device_context as Record<string, string> | undefined };
}
