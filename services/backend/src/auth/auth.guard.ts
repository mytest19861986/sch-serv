import { CanActivate, ExecutionContext, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { ContextualRequest } from '../common/request-context.js';
import { IDENTITY_STATUS_VERIFIER, SESSION_TOKEN_ISSUER, type IdentityStatusVerifier, type SessionTokenIssuer } from './auth.types.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(SESSION_TOKEN_ISSUER) private readonly tokenIssuer: SessionTokenIssuer,
    @Inject(IDENTITY_STATUS_VERIFIER) private readonly identityStatusVerifier: IdentityStatusVerifier
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ContextualRequest>();
    const authorization = request.header('authorization');
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException();
    const token = authorization.slice('Bearer '.length).trim();
    if (!token) throw new UnauthorizedException();
    const principal = await this.tokenIssuer.verify(token);
    let authoritativePrincipal;
    try {
      authoritativePrincipal = await this.identityStatusVerifier.assertActive(principal);
    } catch (error) {
      // The token is cryptographically valid, but current DB authority is no longer valid.
      // Hide identity/resource standing consistently; malformed/expired tokens fail above with 401.
      if (error instanceof UnauthorizedException) throw new NotFoundException();
      throw error;
    }
    if (!authoritativePrincipal) throw new NotFoundException();
    request.principal = authoritativePrincipal;
    return true;
  }
}
