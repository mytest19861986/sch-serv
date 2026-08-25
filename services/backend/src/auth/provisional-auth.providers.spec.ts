import { UnauthorizedException } from '@nestjs/common';
import { ActiveIdentityStatusVerifier } from './provisional-auth.providers.js';

describe('ActiveIdentityStatusVerifier', () => {
  it('fails closed for non-UUID subjects before trusting JWT claims', async () => {
    const verifier = new ActiveIdentityStatusVerifier({ getActorAuthorities: async () => [] } as never);
    await expect(verifier.assertActive({ subject: 'synthetic-bootstrap', roles: ['super-admin'], tenantId: 'forged' }))
      .rejects.toBeInstanceOf(UnauthorizedException);
  });
});
