import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CREDENTIAL_VERIFIER, SESSION_TOKEN_ISSUER, type AuthenticatedPrincipal, type CredentialVerifier, type SessionTokenIssuer } from './auth.types.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(CREDENTIAL_VERIFIER) private readonly credentialVerifier: CredentialVerifier,
    @Inject(SESSION_TOKEN_ISSUER) private readonly tokenIssuer: SessionTokenIssuer
  ) {}

  async login(username: string, password: string): Promise<{ accessToken: string }> {
    const principal = await this.credentialVerifier.verify(username, password);
    if (!principal) throw new UnauthorizedException();
    return { accessToken: await this.tokenIssuer.issue(principal) };
  }

  async issueForTestOnly(principal: AuthenticatedPrincipal): Promise<string> {
    return this.tokenIssuer.issue(principal);
  }
}
