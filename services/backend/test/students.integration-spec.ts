import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { AuthService } from '../src/auth/auth.service.js';
import { CREDENTIAL_VERIFIER, IDENTITY_STATUS_VERIFIER } from '../src/auth/auth.types.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { correlationMiddleware } from '../src/common/correlation.js';
import { UsersRepository } from '../src/users/users.repository.js';

describe('Students vertical slice integration and security negatives', () => {
  let app: INestApplication;
  let pool: Pool;
  let authService: AuthService;
  let tenantId: string;
  let otherTenantId: string;
  let schoolId: string;
  let otherSchoolId: string;
  let adminId: string;
  let platformId: string;
  let operatorId: string;
  let otherAdminId: string;

  async function token(subject: string, roles: string[], tenant?: string): Promise<string> { return authService.issueForTestOnly({ subject, roles, tenantId: tenant }); }
  async function provisionActor(tenant: string, role: string): Promise<string> {
    const id = randomUUID();
    await pool.query('INSERT INTO "user" (id, email, display_name) VALUES ($1, $2, $3)', [id, `student-${id}@example.test`, role]);
    const membership = await pool.query<{ id: string }>('INSERT INTO tenant_membership (id, user_id, tenant_id) VALUES ($1, $2, $3) RETURNING id', [randomUUID(), id, tenant]);
    await pool.query('INSERT INTO role_assignment (id, membership_id, role) VALUES ($1, $2, $3)', [randomUUID(), membership.rows[0]!.id, role]);
    return id;
  }

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL_REQUIRED_FOR_STUDENTS_TEST');
    process.env.AUTH_PROVISIONAL_SIGNING_SECRET = 'test-secret-that-is-at-least-thirty-two-chars';
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CREDENTIAL_VERIFIER).useValue({ verify: async () => null })
      // Domain integration fixtures use synthetic bootstrap subjects; the production
      // ActiveIdentityStatusVerifier is covered by its focused unit tests.
      .overrideProvider(IDENTITY_STATUS_VERIFIER).useFactory({
        inject: [UsersRepository],
        factory: (users: UsersRepository) => ({ assertActive: async (principal: { subject: string; tenantId?: string; roles: string[] }) => {
          if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(principal.subject)) return principal;
          const authorities = await users.getActorAuthorities(principal.subject);
          const effective = authorities.filter((a) => !principal.tenantId || a.tenantId === principal.tenantId || a.role === 'super-admin');
          if (!effective.length) throw new UnauthorizedException();
          return { ...principal, roles: [...new Set(effective.map((a) => a.role))] };
        } })
      })
      .compile();
    app = module.createNestApplication(); app.use(correlationMiddleware); app.useGlobalFilters(new ApiExceptionFilter()); await app.init(); authService = app.get(AuthService);
    const platformToken = await token('students-bootstrap', ['super-admin']);
    const tenant = await request(app.getHttpServer()).post('/tenants').set('Authorization', `Bearer ${platformToken}`).send({ name: `Students Tenant ${Date.now()}` }); expect(tenant.status).toBe(201); tenantId = tenant.body.id;
    const otherTenant = await request(app.getHttpServer()).post('/tenants').set('Authorization', `Bearer ${platformToken}`).send({ name: `Students Other Tenant ${Date.now()}` }); expect(otherTenant.status).toBe(201); otherTenantId = otherTenant.body.id;
    const schoolToken = await token('students-school-bootstrap', ['school-admin'], tenantId);
    const school = await request(app.getHttpServer()).post('/schools').set('Authorization', `Bearer ${schoolToken}`).send({ tenant_id: tenantId, name: 'Students School' }); expect(school.status).toBe(201); schoolId = school.body.id;
    const otherSchool = await request(app.getHttpServer()).post('/schools').set('Authorization', `Bearer ${platformToken}`).send({ tenant_id: otherTenantId, name: 'Other Students School' }); expect(otherSchool.status).toBe(201); otherSchoolId = otherSchool.body.id;
    platformId = await provisionActor(tenantId, 'super-admin');
    // Keep the platform actor authoritative through the target tenant's archived
    // lifecycle window by giving it an independent active platform membership.
    const platformOtherMembership = await pool.query<{ id: string }>('INSERT INTO tenant_membership (id, user_id, tenant_id) VALUES ($1, $2, $3) RETURNING id', [randomUUID(), platformId, otherTenantId]);
    await pool.query('INSERT INTO role_assignment (id, membership_id, role) VALUES ($1, $2, $3)', [randomUUID(), platformOtherMembership.rows[0]!.id, 'super-admin']);
    adminId = await provisionActor(tenantId, 'school-admin'); operatorId = await provisionActor(tenantId, 'school-operator'); otherAdminId = await provisionActor(otherTenantId, 'school-admin');
    const migration = await pool.query<{ version: string }>("SELECT version FROM _schema_migrations WHERE version = '004_students'"); expect(migration.rows).toHaveLength(1);
  });

  afterAll(async () => {
    if (app) await app.close();
    if (pool) {
      await pool.query('DELETE FROM student WHERE tenant_id IN ($1, $2)', [tenantId, otherTenantId]);
      await pool.query('DELETE FROM role_assignment WHERE membership_id IN (SELECT id FROM tenant_membership WHERE tenant_id IN ($1, $2))', [tenantId, otherTenantId]);
      await pool.query('DELETE FROM tenant_membership WHERE tenant_id IN ($1, $2)', [tenantId, otherTenantId]);
      await pool.query('DELETE FROM "user" WHERE email LIKE \'student-%@example.test\'');
      await pool.query('DELETE FROM school WHERE id IN ($1, $2)', [schoolId, otherSchoolId]);
      await pool.query('DELETE FROM tenant WHERE id IN ($1, $2)', [tenantId, otherTenantId]);
      await pool.end();
    }
  });

  it('creates and reads a minimum student record within explicit school scope', async () => {
    const adminToken = await token(adminId, ['school-admin'], tenantId);
    const created = await request(app.getHttpServer()).post('/students').set('Authorization', `Bearer ${adminToken}`).send({ school_id: schoolId, display_name: 'Student One' });
    expect(created.status).toBe(201); expect(created.body.schoolId).toBe(schoolId); expect(created.body.tenantId).toBe(tenantId); expect(created.body.status).toBe('active');
    const operatorToken = await token(operatorId, ['school-operator'], tenantId);
    const list = await request(app.getHttpServer()).get(`/students?school_id=${schoolId}`).set('Authorization', `Bearer ${operatorToken}`); expect(list.status).toBe(200); expect(list.body).toHaveLength(1);
    const read = await request(app.getHttpServer()).get(`/students/${created.body.id}?school_id=${schoolId}`).set('Authorization', `Bearer ${operatorToken}`); expect(read.status).toBe(200); expect(read.body.displayName).toBe('Student One');
  });

  it('denies missing scope, foreign school, unknown fields and unauthorized mutation safely', async () => {
    const adminToken = await token(adminId, ['school-admin'], tenantId); const foreignToken = await token(otherAdminId, ['school-admin'], otherTenantId);
    const provisionalToken = await token('students-provisional', ['super-admin'], tenantId);
    expect((await request(app.getHttpServer()).get(`/students?school_id=${schoolId}`).set('Authorization', `Bearer ${provisionalToken}`)).status).toBe(404);
    expect((await request(app.getHttpServer()).post('/students').set('Authorization', `Bearer ${provisionalToken}`).send({ school_id: schoolId, display_name: 'Provisional Denied' })).status).toBe(404);
    expect((await request(app.getHttpServer()).get('/students').set('Authorization', `Bearer ${adminToken}`)).status).toBe(400);
    expect((await request(app.getHttpServer()).post('/students').set('Authorization', `Bearer ${adminToken}`).send({ school_id: otherSchoolId, display_name: 'Foreign' })).status).toBe(404);
    expect((await request(app.getHttpServer()).post('/students').set('Authorization', `Bearer ${adminToken}`).send({ school_id: schoolId, display_name: 'Nope', tenant_id: tenantId })).status).toBe(400);
    const foreignList = await request(app.getHttpServer()).get(`/students?school_id=${schoolId}`).set('Authorization', `Bearer ${foreignToken}`); expect(foreignList.status).toBe(200); expect(foreignList.body).toHaveLength(0);
    const operatorToken = await token(operatorId, ['school-operator'], tenantId);
    expect((await request(app.getHttpServer()).post('/students').set('Authorization', `Bearer ${operatorToken}`).send({ school_id: schoolId, display_name: 'Denied' })).status).toBe(404);
  });

  it('enforces optimistic versioning, lifecycle visibility, audit and revocation', async () => {
    const adminToken = await token(adminId, ['school-admin'], tenantId);
    const created = await request(app.getHttpServer()).post('/students').set('Authorization', `Bearer ${adminToken}`).send({ school_id: schoolId, display_name: 'Student Two' }); expect(created.status).toBe(201);
    const stale = await request(app.getHttpServer()).patch(`/students/${created.body.id}?school_id=${schoolId}`).set('Authorization', `Bearer ${adminToken}`).send({ display_name: 'Stale', version: created.body.version - 1 }); expect(stale.status).toBe(409);
    const updated = await request(app.getHttpServer()).patch(`/students/${created.body.id}?school_id=${schoolId}`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'archived', version: created.body.version }); expect(updated.status).toBe(200);
    expect((await request(app.getHttpServer()).get(`/students/${created.body.id}?school_id=${schoolId}`).set('Authorization', `Bearer ${adminToken}`)).status).toBe(404);
    const audit = await pool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM audit_record WHERE action LIKE 'student.%' AND target_id = $1", [created.body.id]); expect(Number(audit.rows[0]!.count)).toBe(2);
    await pool.query("UPDATE school SET status = 'archived', version = version + 1 WHERE id = $1", [schoolId]);
    expect((await request(app.getHttpServer()).get(`/students?school_id=${schoolId}`).set('Authorization', `Bearer ${adminToken}`)).body).toHaveLength(0);
    await pool.query("UPDATE school SET status = 'active', version = version + 1 WHERE id = $1", [schoolId]);
    const platformToken = await token(platformId, ['super-admin'], tenantId);
    const tenantLifecycleStudent = await request(app.getHttpServer()).post('/students').set('Authorization', `Bearer ${platformToken}`).send({ school_id: schoolId, display_name: 'Tenant Lifecycle Student' }); expect(tenantLifecycleStudent.status).toBe(201);
    await pool.query("UPDATE tenant SET status = 'archived', version = version + 1 WHERE id = $1", [tenantId]);
    expect((await request(app.getHttpServer()).get(`/students?school_id=${schoolId}`).set('Authorization', `Bearer ${platformToken}`)).body).toHaveLength(0);
    expect((await request(app.getHttpServer()).patch(`/students/${tenantLifecycleStudent.body.id}?school_id=${schoolId}`).set('Authorization', `Bearer ${platformToken}`).send({ display_name: 'Denied', version: tenantLifecycleStudent.body.version })).status).toBe(404);
    await pool.query("UPDATE tenant SET status = 'active', version = version + 1 WHERE id = $1", [tenantId]);
    await pool.query("UPDATE tenant_membership SET status = 'revoked', version = version + 1 WHERE user_id = $1 AND tenant_id = $2", [adminId, tenantId]);
    expect((await request(app.getHttpServer()).get(`/students?school_id=${schoolId}`).set('Authorization', `Bearer ${adminToken}`)).status).toBe(401);
  });

  it('permits an authoritative platform Super Admin to target another tenant explicitly', async () => {
    const platformToken = await token(platformId, ['super-admin'], tenantId);
    const created = await request(app.getHttpServer()).post('/students').set('Authorization', `Bearer ${platformToken}`).send({ school_id: otherSchoolId, display_name: 'Platform Managed Student' });
    expect(created.status).toBe(201); expect(created.body.tenantId).toBe(otherTenantId); expect(created.body.schoolId).toBe(otherSchoolId);
  });
});
