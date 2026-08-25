import { randomUUID } from 'node:crypto';
import { AssignmentsAuthorizationPolicy, type AssignmentsAuthorizationContext } from './assignments.policy.js';

function context(tenantId: string, roles: string[]): AssignmentsAuthorizationContext {
  return { principal: { subject: randomUUID(), tenantId, roles }, correlationId: 'policy-test' };
}

describe('AssignmentsAuthorizationPolicy', () => {
  it('requires tenant equality for Driver reads', () => {
    const policy = new AssignmentsAuthorizationPolicy();
    const ownTenant = randomUUID();
    expect(policy.canRead(context(ownTenant, ['driver']), ownTenant)).toBe(true);
    expect(policy.canRead(context(ownTenant, ['driver']), randomUUID())).toBe(false);
  });
});
