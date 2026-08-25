import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';

describe('AuthGuard identity status boundary', () => {
  it('rejects a token when the identity status verifier reports it inactive', async () => {
    const guard = new AuthGuard(
      { issue: async () => 'unused', verify: async () => ({ subject: 'user-1', roles: [] }) },
      { assertActive: async () => { throw new UnauthorizedException(); } }
    );
    const request = {
      header: () => 'Bearer valid-token'
    } as never;
    const context = { switchToHttp: () => ({ getRequest: () => request }) } as never;
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('fails closed when the identity status verifier returns no authoritative principal', async () => {
    const guard = new AuthGuard(
      { issue: async () => 'unused', verify: async () => ({ subject: 'user-1', roles: [] }) },
      { assertActive: async () => undefined as never }
    );
    const request = { header: () => 'Bearer valid-token' } as never;
    const context = { switchToHttp: () => ({ getRequest: () => request }) } as never;
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(NotFoundException);
  });
});
