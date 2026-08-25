import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Pool } from 'pg';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { AuthService } from '../src/auth/auth.service.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { correlationMiddleware } from '../src/common/correlation.js';
import { CREDENTIAL_VERIFIER, IDENTITY_STATUS_VERIFIER } from '../src/auth/auth.types.js';
import { runMigrations } from '../src/db/migrate.js';

describe('Tenant/School vertical slice integration and security negatives', () => {
  let app: INestApplication;
  let pool: Pool;
  let authService: AuthService;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL_REQUIRED_FOR_TENANT_SCHOOL_TEST');
    process.env.AUTH_PROVISIONAL_SIGNING_SECRET = 'test-secret-that-is-at-least-thirty-two-chars';
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await Promise.all([runMigrations(pool), runMigrations(pool)]);
    await pool.query('DELETE FROM audit_record');
    await pool.query('DELETE FROM school');
    await pool.query('DELETE FROM tenant');
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CREDENTIAL_VERIFIER).useValue({ verify: async () => null })
      .overrideProvider(IDENTITY_STATUS_VERIFIER).useValue({ assertActive: async () => undefined })
      .compile();
    app = module.createNestApplication();
    app.use(correlationMiddleware);
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    authService = app.get(AuthService);
  });

  afterAll(async () => { if (app) await app.close(); if (pool) await pool.end(); });

  it('applies the migration and permits an authorized tenant/school flow', async () => {
    const migration = await pool.query<{ version: string }>('SELECT version FROM _schema_migrations WHERE version = $1', ['001_tenant_school']);
    expect(migration.rowCount).toBe(1);
    const superToken = await authService.issueForTestOnly({ subject: 'platform-admin', roles: ['super-admin'] });
    const tenantResponse = await request(app.getHttpServer()).post('/tenants').set('Authorization', `Bearer ${superToken}`).send({ name: 'Tenant Alpha' });
    expect(tenantResponse.status).toBe(201);
    const tenant = tenantResponse.body as { id: string; version: number };
    const schoolToken = await authService.issueForTestOnly({ subject: 'school-admin', tenantId: tenant.id, roles: ['school-admin'] });
    const schoolResponse = await request(app.getHttpServer()).post('/schools').set('Authorization', `Bearer ${schoolToken}`).send({ tenant_id: tenant.id, name: 'School One' });
    expect(schoolResponse.status).toBe(201);
    expect(schoolResponse.body.tenantId).toBe(tenant.id);
    const audit = await pool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM audit_record WHERE action IN ('tenant.create', 'school.create')");
    expect(Number(audit.rows[0]!.count)).toBe(2);
  });

  it('denies unauthenticated, wrong-tenant, substituted-tenant and unknown-field requests safely', async () => {
    const unauthenticated = await request(app.getHttpServer()).post('/tenants').send({ name: 'Nope' });
    expect(unauthenticated.status).toBe(401);
    const superToken = await authService.issueForTestOnly({ subject: 'platform-admin-2', roles: ['super-admin'] });
    const secondTenant = await request(app.getHttpServer()).post('/tenants').set('Authorization', `Bearer ${superToken}`).send({ name: 'Tenant Beta' });
    const firstTenantId = (await pool.query<{ id: string }>('SELECT id FROM tenant WHERE name = $1', ['Tenant Alpha'])).rows[0]!.id;
    const schoolToken = await authService.issueForTestOnly({ subject: 'school-admin-2', tenantId: secondTenant.body.id, roles: ['school-admin'] });
    const sameNameOtherTenant = await request(app.getHttpServer()).post('/schools').set('Authorization', `Bearer ${schoolToken}`).send({ tenant_id: secondTenant.body.id, name: 'School One' });
    expect(sameNameOtherTenant.status).toBe(201);
    const substitution = await request(app.getHttpServer()).post('/schools').set('Authorization', `Bearer ${schoolToken}`).send({ tenant_id: firstTenantId, name: 'Cross Tenant' });
    expect(substitution.status).toBe(404);
    const unknownField = await request(app.getHttpServer()).post('/schools').set('Authorization', `Bearer ${schoolToken}`).send({ name: 'Bad', role: 'super-admin' });
    expect(unknownField.status).toBe(400);
    const foreignRead = await request(app.getHttpServer()).get(`/tenants/${firstTenantId}`).set('Authorization', `Bearer ${schoolToken}`);
    expect(foreignRead.status).toBe(404);
    expect(foreignRead.body.error.code).toBe('SAFE_NOT_FOUND');
    const invalidName = await request(app.getHttpServer()).post('/tenants').set('Authorization', `Bearer ${superToken}`).send({ name: '' });
    expect(invalidName.status).toBe(400);
    const invalidType = await request(app.getHttpServer()).post('/tenants').set('Authorization', `Bearer ${superToken}`).send({ name: 42 });
    expect(invalidType.status).toBe(400);
    const tooLong = await request(app.getHttpServer()).post('/tenants').set('Authorization', `Bearer ${superToken}`).send({ name: 'x'.repeat(201) });
    expect(tooLong.status).toBe(400);
  });

  it('denies an unauthorized role and rejects stale writes', async () => {
    const tenant = (await pool.query<{ id: string; version: number }>('SELECT id, version FROM tenant WHERE name = $1', ['Tenant Alpha'])).rows[0]!;
    const operatorToken = await authService.issueForTestOnly({ subject: 'operator', tenantId: tenant.id, roles: ['school-operator'] });
    const denied = await request(app.getHttpServer()).patch(`/tenants/${tenant.id}`).set('Authorization', `Bearer ${operatorToken}`).send({ name: 'Nope', version: tenant.version });
    expect(denied.status).toBe(404);
    const superToken = await authService.issueForTestOnly({ subject: 'platform-admin-3', roles: ['super-admin'] });
    const updated = await request(app.getHttpServer()).patch(`/tenants/${tenant.id}`).set('Authorization', `Bearer ${superToken}`).send({ name: 'Tenant Alpha Updated', version: tenant.version });
    expect(updated.status).toBe(200);
    const stale = await request(app.getHttpServer()).patch(`/tenants/${tenant.id}`).set('Authorization', `Bearer ${superToken}`).send({ name: 'Stale', version: tenant.version });
    expect(stale.status).toBe(409);
  });

  it('enforces active lifecycle and tenant-scoped uniqueness while preserving audit evidence', async () => {
    const tenant = (await pool.query<{ id: string; version: number }>('SELECT id, version FROM tenant WHERE name = $1', ['Tenant Alpha Updated'])).rows[0]!;
    const school = (await pool.query<{ id: string; version: number }>('SELECT id, version FROM school WHERE tenant_id = $1', [tenant.id])).rows[0]!;
    const schoolToken = await authService.issueForTestOnly({ subject: 'school-admin-lifecycle', tenantId: tenant.id, roles: ['school-admin'] });
    const duplicate = await request(app.getHttpServer()).post('/schools').set('Authorization', `Bearer ${schoolToken}`).send({ tenant_id: tenant.id, name: 'School One' });
    expect(duplicate.status).toBe(409);
    const superToken = await authService.issueForTestOnly({ subject: 'platform-lifecycle', roles: ['super-admin'] });
    const suspended = await request(app.getHttpServer()).patch(`/tenants/${tenant.id}`).set('Authorization', `Bearer ${superToken}`).send({ status: 'suspended', version: tenant.version });
    expect(suspended.status).toBe(200);
    expect((await request(app.getHttpServer()).get(`/schools/${school.id}`).set('Authorization', `Bearer ${schoolToken}`)).status).toBe(404);
    expect((await request(app.getHttpServer()).post('/schools').set('Authorization', `Bearer ${schoolToken}`).send({ name: 'Blocked' })).status).toBe(404);
    const reactivated = await request(app.getHttpServer()).patch(`/tenants/${tenant.id}`).set('Authorization', `Bearer ${superToken}`).send({ status: 'active', version: suspended.body.version });
    expect(reactivated.status).toBe(200);
    const archivedSchool = await request(app.getHttpServer()).patch(`/schools/${school.id}`).set('Authorization', `Bearer ${schoolToken}`).send({ status: 'archived', version: school.version });
    expect(archivedSchool.status).toBe(200);
    expect((await request(app.getHttpServer()).get(`/schools/${school.id}`).set('Authorization', `Bearer ${schoolToken}`)).status).toBe(404);
    const audit = await pool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM audit_record WHERE action IN ('tenant.update', 'school.update')");
    expect(Number(audit.rows[0]!.count)).toBeGreaterThanOrEqual(3);
    const auditId = (await pool.query<{ id: string }>('SELECT id FROM audit_record LIMIT 1')).rows[0]!.id;
    await expect(pool.query('UPDATE audit_record SET outcome = $1 WHERE id = $2', ['tampered', auditId])).rejects.toThrow('AUDIT_APPEND_ONLY');
    await expect(pool.query('DELETE FROM audit_record WHERE id = $1', [auditId])).rejects.toThrow('AUDIT_APPEND_ONLY');
  });
});
