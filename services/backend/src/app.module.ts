import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller.js';
import { AuthGuard } from './auth/auth.guard.js';
import { AuthService } from './auth/auth.service.js';
import { ActiveIdentityStatusVerifier, DenyByDefaultCredentialVerifier, ProvisionalHmacSessionTokenIssuer } from './auth/provisional-auth.providers.js';
import { CREDENTIAL_VERIFIER, IDENTITY_STATUS_VERIFIER, SESSION_TOKEN_ISSUER } from './auth/auth.types.js';
import { AuthorizationController } from './authz/authz.controller.js';
import { AuthorizationGuard } from './authz/authorization.guard.js';
import { AUTHORIZATION_POLICY_EVALUATOR, DefaultDenyAuthorizationPolicyEvaluator } from './authz/authorization.js';
import { HealthController } from './health/health.controller.js';
import { TenantSchoolController } from './tenant-school/tenant-school.controller.js';
import { TenantSchoolRepository, TENANT_SCHOOL_DB } from './tenant-school/tenant-school.repository.js';
import { TenantSchoolService } from './tenant-school/tenant-school.service.js';
import { TenantSchoolAuthorizationPolicy } from './tenant-school/tenant-school.policy.js';
import { Pool } from 'pg';

@Module({
  controllers: [HealthController, AuthController, AuthorizationController, TenantSchoolController],
  providers: [
    AuthService,
    AuthGuard,
    AuthorizationGuard,
    { provide: CREDENTIAL_VERIFIER, useClass: DenyByDefaultCredentialVerifier },
    { provide: SESSION_TOKEN_ISSUER, useClass: ProvisionalHmacSessionTokenIssuer },
    { provide: IDENTITY_STATUS_VERIFIER, useClass: ActiveIdentityStatusVerifier },
    { provide: AUTHORIZATION_POLICY_EVALUATOR, useClass: DefaultDenyAuthorizationPolicyEvaluator },
    { provide: TENANT_SCHOOL_DB, useFactory: () => { const connectionString = process.env.DATABASE_URL; if (!connectionString) throw new Error('CONFIGURATION_INVALID'); return new Pool({ connectionString }); } },
    TenantSchoolRepository,
    TenantSchoolService,
    TenantSchoolAuthorizationPolicy
  ]
})
export class AppModule {}
