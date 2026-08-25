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
import { DriversController } from './drivers/drivers.controller.js';
import { DriversRepository, DRIVERS_DB } from './drivers/drivers.repository.js';
import { DriversService } from './drivers/drivers.service.js';
import { DriversAuthorizationPolicy } from './drivers/drivers.policy.js';
import { VehiclesController } from './vehicles/vehicles.controller.js';
import { VehiclesRepository, VEHICLES_DB } from './vehicles/vehicles.repository.js';
import { VehiclesService } from './vehicles/vehicles.service.js';
import { VehiclesAuthorizationPolicy } from './vehicles/vehicles.policy.js';
import { RoutesController } from './routes/routes.controller.js';
import { RoutesRepository, ROUTES_DB } from './routes/routes.repository.js';
import { RoutesService } from './routes/routes.service.js';
import { RoutesAuthorizationPolicy } from './routes/routes.policy.js';
import { ServicesController } from './services/services.controller.js';
import { ServicesRepository, SERVICES_DB } from './services/services.repository.js';
import { ServicesService } from './services/services.service.js';
import { ServicesAuthorizationPolicy } from './services/services.policy.js';
import { AssignmentsController } from './assignments/assignments.controller.js';
import { AssignmentsRepository, ASSIGNMENTS_DB } from './assignments/assignments.repository.js';
import { AssignmentsService } from './assignments/assignments.service.js';
import { AssignmentsAuthorizationPolicy } from './assignments/assignments.policy.js';

@Module({
  controllers: [HealthController, AuthController, AuthorizationController, TenantSchoolController, UsersController, StudentsController, ParentsController, DriversController, VehiclesController, RoutesController, ServicesController, AssignmentsController],
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
    ParentsAuthorizationPolicy,
    { provide: DRIVERS_DB, useFactory: () => { const connectionString = process.env.DATABASE_URL; if (!connectionString) throw new Error('CONFIGURATION_INVALID'); return new Pool({ connectionString }); } },
    DriversRepository,
    DriversService,
    DriversAuthorizationPolicy,
    { provide: VEHICLES_DB, useFactory: () => { const connectionString = process.env.DATABASE_URL; if (!connectionString) throw new Error('CONFIGURATION_INVALID'); return new Pool({ connectionString }); } },
    VehiclesRepository,
    VehiclesService,
    VehiclesAuthorizationPolicy,
    { provide: ROUTES_DB, useFactory: () => { const connectionString = process.env.DATABASE_URL; if (!connectionString) throw new Error('CONFIGURATION_INVALID'); return new Pool({ connectionString }); } },
    RoutesRepository,
    RoutesService,
    RoutesAuthorizationPolicy,
    { provide: SERVICES_DB, useFactory: () => { const connectionString = process.env.DATABASE_URL; if (!connectionString) throw new Error('CONFIGURATION_INVALID'); return new Pool({ connectionString }); } },
    ServicesRepository,
    ServicesService,
    ServicesAuthorizationPolicy,
    { provide: ASSIGNMENTS_DB, useFactory: () => { const connectionString = process.env.DATABASE_URL; if (!connectionString) throw new Error('CONFIGURATION_INVALID'); return new Pool({ connectionString }); } },
    AssignmentsRepository,
    AssignmentsService,
    AssignmentsAuthorizationPolicy
  ]
})
export class AppModule {}
