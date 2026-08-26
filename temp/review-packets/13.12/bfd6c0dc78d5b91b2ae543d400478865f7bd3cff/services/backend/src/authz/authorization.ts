import { SetMetadata } from '@nestjs/common';

export const POLICY_KEY = 'authorization-policy';
export const RequirePolicy = (policy: string) => SetMetadata(POLICY_KEY, policy);

export interface AuthorizationPolicyEvaluator {
  allows(policy: string, principal: { readonly roles: readonly string[] }): Promise<boolean>;
}

export const AUTHORIZATION_POLICY_EVALUATOR = Symbol('AUTHORIZATION_POLICY_EVALUATOR');

export class DefaultDenyAuthorizationPolicyEvaluator implements AuthorizationPolicyEvaluator {
  async allows(policy: string, principal: { readonly roles: readonly string[] }): Promise<boolean> {
    return policy === 'authenticated' && principal.roles.includes('foundation-user');
  }
}
