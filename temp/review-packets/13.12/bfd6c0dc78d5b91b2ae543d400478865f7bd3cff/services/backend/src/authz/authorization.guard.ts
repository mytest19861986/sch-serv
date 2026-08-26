import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ContextualRequest } from '../common/request-context.js';
import { AUTHORIZATION_POLICY_EVALUATOR, POLICY_KEY, type AuthorizationPolicyEvaluator } from './authorization.js';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTHORIZATION_POLICY_EVALUATOR) private readonly evaluator: AuthorizationPolicyEvaluator
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policy = this.reflector.getAllAndOverride<string>(POLICY_KEY, [context.getHandler(), context.getClass()]);
    const request = context.switchToHttp().getRequest<ContextualRequest>();
    if (!policy || !request.principal || !(await this.evaluator.allows(policy, request.principal))) {
      throw new ForbiddenException();
    }
    return true;
  }
}
