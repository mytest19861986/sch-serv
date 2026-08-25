import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SignJWT, jwtVerify } from 'jose';
import type { AuthenticatedPrincipal, CredentialVerifier, IdentityStatusVerifier, SessionTokenIssuer } from './auth.types.js';
import { UsersRepository } from '../users/users.repository.js';

@Injectable()
export class DenyByDefaultCredentialVerifier implements CredentialVerifier {
  async verify(username: string, password: string): Promise<AuthenticatedPrincipal | null> {
    void username;
    void password;
    return null;
  }
}

@Injectable()
export class ActiveIdentityStatusVerifier implements IdentityStatusVerifier {
  constructor(private readonly usersRepository: UsersRepository) {}

  async assertActive(principal: AuthenticatedPrincipal): Promise<AuthenticatedPrincipal | void> {
    // Provisional non-UUID subjects are retained for bootstrap/test-only flows.
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(principal.subject)) return;
    const authorities = await this.usersRepository.getActorAuthorities(principal.subject);
    if (!authorities.length) throw new UnauthorizedException();
    const isPlatformAdmin = authorities.some((authority) => authority.role === 'super-admin');
    const effectiveAuthorities = isPlatformAdmin
      ? authorities
      : authorities.filter((authority) => !principal.tenantId || authority.tenantId === principal.tenantId);
    if (!effectiveAuthorities.length) throw new UnauthorizedException();
    return { ...principal, roles: [...new Set(effectiveAuthorities.map((authority) => authority.role))] };
  }
}

@Injectable()
export class ProvisionalHmacSessionTokenIssuer implements SessionTokenIssuer {
  private readonly secret: Uint8Array;

  constructor() {
    const raw = process.env.AUTH_PROVISIONAL_SIGNING_SECRET;
    if (!raw || raw.length < 32) throw new Error('CONFIGURATION_INVALID');
    this.secret = new TextEncoder().encode(raw);
  }

  async issue(principal: AuthenticatedPrincipal): Promise<string> {
    return new SignJWT({ tenantId: principal.tenantId, roles: [...principal.roles] })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(principal.subject)
      .setIssuedAt()
      .sign(this.secret);
  }

  async verify(token: string): Promise<AuthenticatedPrincipal> {
    try {
      const { payload } = await jwtVerify(token, this.secret, { algorithms: ['HS256'] });
      if (!payload.sub || !Array.isArray(payload.roles) || payload.roles.some((role) => typeof role !== 'string')) {
        throw new UnauthorizedException();
      }
      const tenantId = typeof payload.tenantId === 'string' ? payload.tenantId : undefined;
      return { subject: payload.sub, tenantId, roles: payload.roles as string[] };
    } catch {
      throw new UnauthorizedException();
    }
  }
}
