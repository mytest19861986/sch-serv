import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
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
    await this.identityStatusVerifier.assertActive(principal);
    request.principal = principal;
    return true;
  }
}
