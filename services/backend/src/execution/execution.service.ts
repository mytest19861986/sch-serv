import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ExecutionAuthorizationPolicy, type ExecutionAuthorizationContext } from './execution.policy.js';
import { ExecutionRepository } from './execution.repository.js';
import { isUuid, parsePickupInput, parseStartInput } from './execution.types.js';

function persist<T>(operation: () => Promise<T>): Promise<T> {
  return operation().catch((cause: unknown) => {
    const code = (cause as { code?: string }).code;
    if (code === 'VERSION_CONFLICT') throw new ConflictException();
    if (code === 'PICKUP_CONFLICT') throw new ConflictException();
    if (code === 'RESOURCE_NOT_FOUND' || code === 'AUTHORITY_REVOKED') throw new NotFoundException();
    throw cause;
  });
}

@Injectable()
export class ExecutionService {
  constructor(private readonly repository: ExecutionRepository, private readonly policy: ExecutionAuthorizationPolicy) {}
  private assertDriver(context: ExecutionAuthorizationContext): void { if (!isUuid(context.principal.subject) || !this.policy.isDriver(context)) throw new NotFoundException(); }
  activeServices(context: ExecutionAuthorizationContext) { this.assertDriver(context); return persist(() => this.repository.activeServices(context.principal.subject)); }
  transportState(context: ExecutionAuthorizationContext, id: string) { this.assertDriver(context); if (!isUuid(id)) throw new NotFoundException(); return persist(() => this.repository.transportState(context.principal.subject, id)); }
  roster(context: ExecutionAuthorizationContext, id: string) { this.assertDriver(context); if (!isUuid(id)) throw new NotFoundException(); return persist(() => this.repository.roster(context.principal.subject, id)); }
  start(context: ExecutionAuthorizationContext, id: string, body: unknown) { this.assertDriver(context); if (!isUuid(id)) throw new NotFoundException(); const input = parseStartInput(body); return persist(() => this.repository.start(context.principal.subject, id, input, context.correlationId)); }
  pickup(context: ExecutionAuthorizationContext, serviceInstanceId: string, studentId: string, body: unknown, idempotencyKey?: string) {
    this.assertDriver(context);
    if (!isUuid(serviceInstanceId) || !isUuid(studentId)) throw new NotFoundException();
    const input = parsePickupInput(body);
    if (!isUuid(idempotencyKey)) throw new BadRequestException();
    return persist(() => this.repository.pickup(context.principal.subject, serviceInstanceId, studentId, input, context.correlationId, idempotencyKey));
  }
}
