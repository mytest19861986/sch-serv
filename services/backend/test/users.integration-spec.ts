import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { AuthService } from '../src/auth/auth.service.js';
import { CREDENTIAL_VERIFIER } from '../src/auth/auth.types.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { correlationMiddleware } from '../src/common/correlation.js';

describe('Users vertical slice integration and security negatives', () => {
  let app: INestApplication;
  let pool: Pool;
  let authService: AuthService;
  let tenantId: string;
  let otherTenantId: string;
  let userId: string;
  let membershipId: string;
  let roleAssignmentId: string;
  let platformActorId: string;
  let schoolActorId: string;
  let operatorActorId: string;
  let otherSchoolActorId: string;

  async function token(subject: string, roles: string[], tenant?: string): Promise<string> { return authService.issueForTestOnly({ subject, roles, tenantId: tenant }); }
  async function postTenant(name: string): Promise<string> { const response = await request(app.getHttpServer()).post('/tenants').set('Authorization', `Bearer ${await token('users-platform', ['super-admin'])}`).send({ name }); expect(response.status).toBe(201); return response.body.id as string; }
  async function provisionActor(tenant: string, role: string): Promise<string> {
    const id = randomUUID();
    await pool.query('INSERT INTO "user" (id, email, display_name) VALUES ($1, $2, $3)', [id, `actor-${id}@example.test`, role]);
    const membership = await pool.query<{ id: string }>('INSERT INTO tenant_membership (id, user_id, tenant_id) VALUES ($1, $2, $3) RETURNING id', [randomUUID(), id, tenant]);
    await pool.query('INSERT INTO role_assignment (id, membership_id, role) VALUES ($1, $2, $3)', [randomUUID(), membership.rows[0]!.id, role]);
    return id;
  }

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL_REQUIRED_FOR_USERS_TEST');
    process.env.AUTH_PROVISIONAL_SIGNING_SECRET = 'test-secret-that-is-at-least-thirty-two-chars';
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CREDENTIAL_VERIFIER).useValue({ verify: async () => null })
      .compile();
    app = module.createNestApplication(); app.use(correlationMiddleware); app.useGlobalFilters(new ApiExceptionFilter()); await app.init(); authService = app.get(AuthService);
    tenantId = await postTenant(`Users Tenant ${Date.now()}`);
    otherTenantId = await postTenant(`Users Other Tenant ${Date.now()}`);
    const migration = await pool.query<{ version: string }>("SELECT version FROM _schema_migrations WHERE version = '003_users'");
    expect(migration.rows).toHaveLength(1);
    platformActorId = await provisionActor(tenantId, 'super-admin');
    schoolActorId = await provisionActor(tenantId, 'school-admin');
    operatorActorId = await provisionActor(tenantId, 'school-operator');
    otherSchoolActorId = await provisionActor(otherTenantId, 'school-admin');
  });

  afterAll(async () => {
    if (app) await app.close();
    if (pool) {
      await pool.query('DELETE FROM role_assignment WHERE membership_id IN (SELECT id FROM tenant_membership WHERE tenant_id IN ($1, $2))', [tenantId, otherTenantId]);
      await pool.query('DELETE FROM tenant_membership WHERE tenant_id IN ($1, $2)', [tenantId, otherTenantId]);
      await pool.query('DELETE FROM "user" WHERE email LIKE \'users-%@example.test\' OR email LIKE \'actor-%@example.test\'');
      await pool.query('DELETE FROM tenant WHERE id IN ($1, $2)', [tenantId, otherTenantId]);
      await pool.end();
    }
  });

  it('creates, scopes and updates users, memberships and roles for an authorized school admin', async () => {
    const schoolToken = await token(schoolActorId, ['school-admin'], tenantId);
    const platformToken = await token(platformActorId, ['super-admin'], tenantId);
    const created = await request(app.getHttpServer()).post('/users').set('Authorization', `Bearer ${platformToken}`).send({ email: `users-${Date.now()}@example.test`, display_name: 'User One' });
    expect(created.status).toBe(201); expect(created.body.status).toBe('active'); userId = created.body.id;
    const membership = await request(app.getHttpServer()).post('/tenant-memberships').set('Authorization', `Bearer ${schoolToken}`).send({ user_id: userId, tenant_id: tenantId });
    expect(membership.status).toBe(201); membershipId = membership.body.id;
    const role = await request(app.getHttpServer()).post('/role-assignments').set('Authorization', `Bearer ${schoolToken}`).send({ membership_id: membershipId, role: 'school-operator' });
    expect(role.status).toBe(201); roleAssignmentId = role.body.id;
    const read = await request(app.getHttpServer()).get(`/users/${userId}`).set('Authorization', `Bearer ${schoolToken}`);
    expect(read.status).toBe(200); expect(read.body.tenantId).toBe(tenantId); expect(read.body.email).toContain('@example.test');
    const list = await request(app.getHttpServer()).get('/users').set('Authorization', `Bearer ${schoolToken}`);
    expect(list.status).toBe(200); expect(list.body.some((item: { id: string }) => item.id === userId)).toBe(true);
    const updated = await request(app.getHttpServer()).patch(`/users/${userId}`).set('Authorization', `Bearer ${platformToken}`).send({ display_name: 'Renamed', version: created.body.version });
    expect(updated.status).toBe(200); expect(updated.body.displayName).toBe('Renamed');
    const membershipRead = await request(app.getHttpServer()).get(`/tenant-memberships/${membershipId}`).set('Authorization', `Bearer ${schoolToken}`); expect(membershipRead.status).toBe(200);
    const roleRead = await request(app.getHttpServer()).get(`/role-assignments/${roleAssignmentId}`).set('Authorization', `Bearer ${schoolToken}`); expect(roleRead.status).toBe(200); expect(roleRead.body.role).toBe('school-operator');
    const crossMembership = await request(app.getHttpServer()).post('/tenant-memberships').set('Authorization', `Bearer ${platformToken}`).send({ user_id: userId, tenant_id: otherTenantId });
    expect(crossMembership.status).toBe(201);
    const crossRole = await request(app.getHttpServer()).post('/role-assignments').set('Authorization', `Bearer ${platformToken}`).send({ membership_id: crossMembership.body.id, role: 'school-admin' });
    expect(crossRole.status).toBe(201);
    const selectedTenantPlatformRead = await request(app.getHttpServer()).get(`/tenant-memberships/${crossMembership.body.id}`).set('Authorization', `Bearer ${platformToken}`);
    expect(selectedTenantPlatformRead.status).toBe(200);
  });

  it('rejects authentication, role, tenant, identifier and privilege-substitution attacks safely', async () => {
    const unauthenticated = await request(app.getHttpServer()).post('/users').send({ email: 'users-unauth@example.test', display_name: 'Nope' }); expect(unauthenticated.status).toBe(401);
    const schoolToken = await token(schoolActorId, ['school-admin'], tenantId);
    const operatorToken = await token(operatorActorId, ['school-operator'], tenantId);
    const platformToken = await token(platformActorId, ['super-admin'], tenantId);
    expect((await request(app.getHttpServer()).post('/users').set('Authorization', `Bearer ${operatorToken}`).send({ email: 'users-denied@example.test', display_name: 'Nope' })).status).toBe(403);
    expect((await request(app.getHttpServer()).post('/users').set('Authorization', `Bearer ${platformToken}`).send({ email: 'users-unknown@example.test', display_name: 'Nope', role: 'super-admin' })).status).toBe(400);
    expect((await request(app.getHttpServer()).post('/users').set('Authorization', `Bearer ${platformToken}`).send({ email: 'bad', display_name: 'Nope' })).status).toBe(400);
    expect((await request(app.getHttpServer()).get('/users/not-a-uuid').set('Authorization', `Bearer ${schoolToken}`)).status).toBe(404);
    const foreignToken = await token(otherSchoolActorId, ['school-admin'], otherTenantId);
    const foreignRead = await request(app.getHttpServer()).get(`/users/${userId}`).set('Authorization', `Bearer ${foreignToken}`); expect(foreignRead.status).toBe(200); expect(foreignRead.body.tenantId).toBe(otherTenantId);
    const foreignPatch = await request(app.getHttpServer()).patch(`/users/${userId}`).set('Authorization', `Bearer ${foreignToken}`).send({ display_name: 'Leaked', version: 1 }); expect(foreignPatch.status).toBe(403);
    const membershipSubstitution = await request(app.getHttpServer()).post('/tenant-memberships').set('Authorization', `Bearer ${schoolToken}`).send({ user_id: userId, tenant_id: otherTenantId }); expect([403, 404]).toContain(membershipSubstitution.status);
    const roleEscalation = await request(app.getHttpServer()).post('/role-assignments').set('Authorization', `Bearer ${schoolToken}`).send({ membership_id: membershipId, role: 'super-admin' }); expect([403, 404]).toContain(roleEscalation.status);
    const fieldOverride = await request(app.getHttpServer()).post('/tenant-memberships').set('Authorization', `Bearer ${schoolToken}`).send({ user_id: userId, tenant_id: tenantId, role: 'super-admin' }); expect(fieldOverride.status).toBe(400);
  });

  it('maps duplicate, stale, disabled and audit outcomes without cross-tenant leakage', async () => {
    const schoolToken = await token(schoolActorId, ['school-admin'], tenantId);
    const platformToken = await token(platformActorId, ['super-admin'], tenantId);
    const existing = await pool.query<{ email: string; version: number }>('SELECT email, version FROM "user" WHERE id = $1', [userId]);
    const duplicate = await request(app.getHttpServer()).post('/users').set('Authorization', `Bearer ${platformToken}`).send({ email: existing.rows[0]!.email, display_name: 'Duplicate' }); expect(duplicate.status).toBe(409);
    const stale = await request(app.getHttpServer()).patch(`/users/${userId}`).set('Authorization', `Bearer ${platformToken}`).send({ display_name: 'Stale', version: existing.rows[0]!.version - 1 }); expect(stale.status).toBe(409);
    const current = await pool.query<{ version: number }>('SELECT version FROM "user" WHERE id = $1', [userId]);
    const disabled = await request(app.getHttpServer()).patch(`/users/${userId}`).set('Authorization', `Bearer ${platformToken}`).send({ status: 'disabled', version: current.rows[0]!.version }); expect(disabled.status).toBe(200);
    expect((await request(app.getHttpServer()).get(`/users/${userId}`).set('Authorization', `Bearer ${schoolToken}`)).status).toBe(404);
    const audit = await pool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM audit_record WHERE action LIKE 'user.%' OR action LIKE 'membership.%' OR action LIKE 'role.%'"); expect(Number(audit.rows[0]!.count)).toBeGreaterThanOrEqual(5);
  });

  it('rejects reuse of a token after the actor membership is revoked', async () => {
    const schoolToken = await token(schoolActorId, ['school-admin'], tenantId);
    await pool.query("UPDATE tenant_membership SET status = 'revoked', version = version + 1 WHERE user_id = $1 AND tenant_id = $2", [schoolActorId, tenantId]);
    expect((await request(app.getHttpServer()).get('/users').set('Authorization', `Bearer ${schoolToken}`)).status).toBe(401);
    expect((await request(app.getHttpServer()).get(`/tenants/${tenantId}`).set('Authorization', `Bearer ${schoolToken}`)).status).toBe(401);
  });
});
