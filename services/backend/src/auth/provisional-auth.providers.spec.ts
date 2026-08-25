import { UnauthorizedException } from '@nestjs/common';
import { ProvisionalHmacSessionTokenIssuer } from './provisional-auth.providers.js';

describe('ProvisionalHmacSessionTokenIssuer', () => {
  beforeEach(() => { process.env.AUTH_PROVISIONAL_SIGNING_SECRET = 'test-secret-that-is-at-least-thirty-two-chars'; });

  it('round-trips only server-issued principal context', async () => {
    const issuer = new ProvisionalHmacSessionTokenIssuer();
    const token = await issuer.issue({ subject: 'user-1', tenantId: 'tenant-a', roles: ['foundation-user'] });
    await expect(issuer.verify(token)).resolves.toEqual({ subject: 'user-1', tenantId: 'tenant-a', roles: ['foundation-user'] });
  });

  it('rejects a manipulated token', async () => {
    const issuer = new ProvisionalHmacSessionTokenIssuer();
    await expect(issuer.verify('not-a-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
