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
import { UsersController } from './users/users.controller.js';
import { UsersRepository, USERS_DB } from './users/users.repository.js';
import { UsersService } from './users/users.service.js';
import { UsersAuthorizationPolicy } from './users/users.policy.js';
import { StudentsController } from './students/students.controller.js';
import { StudentsRepository, STUDENTS_DB } from './students/students.repository.js';
import { StudentsService } from './students/students.service.js';
import { StudentsAuthorizationPolicy } from './students/students.policy.js';
import { ParentsController } from './parents/parents.controller.js';
import { ParentsRepository, PARENTS_DB } from './parents/parents.repository.js';
import { ParentsService } from './parents/parents.service.js';
import { ParentsAuthorizationPolicy } from './parents/parents.policy.js';

@Module({
  controllers: [HealthController, AuthController, AuthorizationController, TenantSchoolController, UsersController, StudentsController, ParentsController],
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
    TenantSchoolAuthorizationPolicy,
    { provide: USERS_DB, useFactory: () => { const connectionString = process.env.DATABASE_URL; if (!connectionString) throw new Error('CONFIGURATION_INVALID'); return new Pool({ connectionString }); } },
    UsersRepository,
    UsersService,
    UsersAuthorizationPolicy,
    { provide: STUDENTS_DB, useFactory: () => { const connectionString = process.env.DATABASE_URL; if (!connectionString) throw new Error('CONFIGURATION_INVALID'); return new Pool({ connectionString }); } },
    StudentsRepository,
    StudentsService,
    StudentsAuthorizationPolicy,
    { provide: PARENTS_DB, useFactory: () => { const connectionString = process.env.DATABASE_URL; if (!connectionString) throw new Error('CONFIGURATION_INVALID'); return new Pool({ connectionString }); } },
    ParentsRepository,
    ParentsService,
    ParentsAuthorizationPolicy
  ]
})
export class AppModule {}
