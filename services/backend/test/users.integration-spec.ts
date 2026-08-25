import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Pool } from 'pg';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { AuthService } from '../src/auth/auth.service.js';
import { CREDENTIAL_VERIFIER, IDENTITY_STATUS_VERIFIER } from '../src/auth/auth.types.js';
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

  async function token(subject: string, roles: string[], tenant?: string): Promise<string> { return authService.issueForTestOnly({ subject, roles, tenantId: tenant }); }
  async function postTenant(name: string): Promise<string> { const response = await request(app.getHttpServer()).post('/tenants').set('Authorization', `Bearer ${await token('users-platform', ['super-admin'])}`).send({ name }); expect(response.status).toBe(201); return response.body.id as string; }

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL_REQUIRED_FOR_USERS_TEST');
    process.env.AUTH_PROVISIONAL_SIGNING_SECRET = 'test-secret-that-is-at-least-thirty-two-chars';
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CREDENTIAL_VERIFIER).useValue({ verify: async () => null })
      .overrideProvider(IDENTITY_STATUS_VERIFIER).useValue({ assertActive: async () => undefined })
      .compile();
    app = module.createNestApplication(); app.use(correlationMiddleware); app.useGlobalFilters(new ApiExceptionFilter()); await app.init(); authService = app.get(AuthService);
    tenantId = await postTenant(`Users Tenant ${Date.now()}`);
    otherTenantId = await postTenant(`Users Other Tenant ${Date.now()}`);
  });

  afterAll(async () => {
    if (app) await app.close();
    if (pool) {
      await pool.query('DELETE FROM role_assignment WHERE membership_id IN (SELECT id FROM tenant_membership WHERE tenant_id IN ($1, $2))', [tenantId, otherTenantId]);
      await pool.query('DELETE FROM tenant_membership WHERE tenant_id IN ($1, $2)', [tenantId, otherTenantId]);
      await pool.query('DELETE FROM "user" WHERE email LIKE \'users-%@example.test\'');
      await pool.query('DELETE FROM tenant WHERE id IN ($1, $2)', [tenantId, otherTenantId]);
      await pool.end();
    }
  });

  it('creates, scopes and updates users, memberships and roles for an authorized school admin', async () => {
    const schoolToken = await token('school-admin-users', ['school-admin'], tenantId);
    const created = await request(app.getHttpServer()).post('/users').set('Authorization', `Bearer ${schoolToken}`).send({ email: `users-${Date.now()}@example.test`, display_name: 'User One' });
    expect(created.status).toBe(201); expect(created.body.status).toBe('active'); userId = created.body.id;
    const membership = await request(app.getHttpServer()).post('/tenant-memberships').set('Authorization', `Bearer ${schoolToken}`).send({ user_id: userId, tenant_id: tenantId });
    expect(membership.status).toBe(201); membershipId = membership.body.id;
    const role = await request(app.getHttpServer()).post('/role-assignments').set('Authorization', `Bearer ${schoolToken}`).send({ membership_id: membershipId, role: 'school-operator' });
    expect(role.status).toBe(201); roleAssignmentId = role.body.id;
    const read = await request(app.getHttpServer()).get(`/users/${userId}`).set('Authorization', `Bearer ${schoolToken}`);
    expect(read.status).toBe(200); expect(read.body.tenantId).toBe(tenantId); expect(read.body.email).toContain('@example.test');
    const list = await request(app.getHttpServer()).get('/users').set('Authorization', `Bearer ${schoolToken}`);
    expect(list.status).toBe(200); expect(list.body.some((item: { id: string }) => item.id === userId)).toBe(true);
    const updated = await request(app.getHttpServer()).patch(`/users/${userId}`).set('Authorization', `Bearer ${schoolToken}`).send({ display_name: 'Renamed', version: created.body.version });
    expect(updated.status).toBe(200); expect(updated.body.displayName).toBe('Renamed');
    const membershipRead = await request(app.getHttpServer()).get(`/tenant-memberships/${membershipId}`).set('Authorization', `Bearer ${schoolToken}`); expect(membershipRead.status).toBe(200);
    const roleRead = await request(app.getHttpServer()).get(`/role-assignments/${roleAssignmentId}`).set('Authorization', `Bearer ${schoolToken}`); expect(roleRead.status).toBe(200); expect(roleRead.body.role).toBe('school-operator');
  });

  it('rejects authentication, role, tenant, identifier and privilege-substitution attacks safely', async () => {
    const unauthenticated = await request(app.getHttpServer()).post('/users').send({ email: 'users-unauth@example.test', display_name: 'Nope' }); expect(unauthenticated.status).toBe(401);
    const schoolToken = await token('school-admin-users-2', ['school-admin'], tenantId);
    const operatorToken = await token('operator-users', ['school-operator'], tenantId);
    expect((await request(app.getHttpServer()).post('/users').set('Authorization', `Bearer ${operatorToken}`).send({ email: 'users-denied@example.test', display_name: 'Nope' })).status).toBe(403);
    expect((await request(app.getHttpServer()).post('/users').set('Authorization', `Bearer ${schoolToken}`).send({ email: 'users-unknown@example.test', display_name: 'Nope', role: 'super-admin' })).status).toBe(400);
    expect((await request(app.getHttpServer()).post('/users').set('Authorization', `Bearer ${schoolToken}`).send({ email: 'bad', display_name: 'Nope' })).status).toBe(400);
    expect((await request(app.getHttpServer()).get('/users/not-a-uuid').set('Authorization', `Bearer ${schoolToken}`)).status).toBe(404);
    const foreignRead = await request(app.getHttpServer()).get(`/users/${userId}`).set('Authorization', `Bearer ${await token('other-school-admin', ['school-admin'], otherTenantId)}`); expect(foreignRead.status).toBe(404);
    const foreignPatch = await request(app.getHttpServer()).patch(`/users/${userId}`).set('Authorization', `Bearer ${await token('other-school-admin-2', ['school-admin'], otherTenantId)}`).send({ display_name: 'Leaked', version: 1 }); expect(foreignPatch.status).toBe(404);
    const membershipSubstitution = await request(app.getHttpServer()).post('/tenant-memberships').set('Authorization', `Bearer ${schoolToken}`).send({ user_id: userId, tenant_id: otherTenantId }); expect(membershipSubstitution.status).toBe(404);
    const roleEscalation = await request(app.getHttpServer()).post('/role-assignments').set('Authorization', `Bearer ${schoolToken}`).send({ membership_id: membershipId, role: 'super-admin' }); expect(roleEscalation.status).toBe(404);
    const fieldOverride = await request(app.getHttpServer()).post('/tenant-memberships').set('Authorization', `Bearer ${schoolToken}`).send({ user_id: userId, tenant_id: tenantId, role: 'super-admin' }); expect(fieldOverride.status).toBe(400);
  });

  it('maps duplicate, stale, disabled and audit outcomes without cross-tenant leakage', async () => {
    const schoolToken = await token('school-admin-users-3', ['school-admin'], tenantId);
    const existing = await pool.query<{ email: string; version: number }>('SELECT email, version FROM "user" WHERE id = $1', [userId]);
    const duplicate = await request(app.getHttpServer()).post('/users').set('Authorization', `Bearer ${schoolToken}`).send({ email: existing.rows[0]!.email, display_name: 'Duplicate' }); expect(duplicate.status).toBe(409);
    const stale = await request(app.getHttpServer()).patch(`/users/${userId}`).set('Authorization', `Bearer ${schoolToken}`).send({ display_name: 'Stale', version: existing.rows[0]!.version - 1 }); expect(stale.status).toBe(409);
    const current = await pool.query<{ version: number }>('SELECT version FROM "user" WHERE id = $1', [userId]);
    const disabled = await request(app.getHttpServer()).patch(`/users/${userId}`).set('Authorization', `Bearer ${schoolToken}`).send({ status: 'disabled', version: current.rows[0]!.version }); expect(disabled.status).toBe(200);
    expect((await request(app.getHttpServer()).get(`/users/${userId}`).set('Authorization', `Bearer ${schoolToken}`)).status).toBe(404);
    const audit = await pool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM audit_record WHERE action LIKE 'user.%' OR action LIKE 'membership.%' OR action LIKE 'role.%'"); expect(Number(audit.rows[0]!.count)).toBeGreaterThanOrEqual(5);
  });
});
