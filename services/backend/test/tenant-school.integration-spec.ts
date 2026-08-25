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
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await runMigrations(pool);
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
  });

  it('denies unauthenticated, wrong-tenant, substituted-tenant and unknown-field requests safely', async () => {
    const unauthenticated = await request(app.getHttpServer()).post('/tenants').send({ name: 'Nope' });
    expect(unauthenticated.status).toBe(401);
    const superToken = await authService.issueForTestOnly({ subject: 'platform-admin-2', roles: ['super-admin'] });
    const secondTenant = await request(app.getHttpServer()).post('/tenants').set('Authorization', `Bearer ${superToken}`).send({ name: 'Tenant Beta' });
    const firstTenantId = (await pool.query<{ id: string }>('SELECT id FROM tenant WHERE name = $1', ['Tenant Alpha'])).rows[0]!.id;
    const schoolToken = await authService.issueForTestOnly({ subject: 'school-admin-2', tenantId: secondTenant.body.id, roles: ['school-admin'] });
    const substitution = await request(app.getHttpServer()).post('/schools').set('Authorization', `Bearer ${schoolToken}`).send({ tenant_id: firstTenantId, name: 'Cross Tenant' });
    expect(substitution.status).toBe(404);
    const unknownField = await request(app.getHttpServer()).post('/schools').set('Authorization', `Bearer ${schoolToken}`).send({ name: 'Bad', role: 'super-admin' });
    expect(unknownField.status).toBe(400);
    const foreignRead = await request(app.getHttpServer()).get(`/tenants/${firstTenantId}`).set('Authorization', `Bearer ${schoolToken}`);
    expect(foreignRead.status).toBe(404);
    expect(foreignRead.body.error.code).toBe('SAFE_NOT_FOUND');
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
});
