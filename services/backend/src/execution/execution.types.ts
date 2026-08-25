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
