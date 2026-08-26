import { Injectable } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/auth.types.js';

export interface ExecutionAuthorizationContext {
  readonly principal: AuthenticatedPrincipal;
  readonly correlationId: string;
}

@Injectable()
export class ExecutionAuthorizationPolicy {
  isDriver(context: ExecutionAuthorizationContext): boolean {
    return context.principal.roles.includes('driver');
  }
}
