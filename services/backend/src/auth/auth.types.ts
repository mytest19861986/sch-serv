export interface AuthenticatedPrincipal {
  readonly subject: string;
  readonly tenantId?: string;
  readonly roles: readonly string[];
}

export interface CredentialVerifier {
  verify(username: string, password: string): Promise<AuthenticatedPrincipal | null>;
}

export interface SessionTokenIssuer {
  issue(principal: AuthenticatedPrincipal): Promise<string>;
  verify(token: string): Promise<AuthenticatedPrincipal>;
}

export interface IdentityStatusVerifier {
  assertActive(principal: AuthenticatedPrincipal): Promise<AuthenticatedPrincipal | void>;
}

export const CREDENTIAL_VERIFIER = Symbol('CREDENTIAL_VERIFIER');
export const SESSION_TOKEN_ISSUER = Symbol('SESSION_TOKEN_ISSUER');
export const IDENTITY_STATUS_VERIFIER = Symbol('IDENTITY_STATUS_VERIFIER');
