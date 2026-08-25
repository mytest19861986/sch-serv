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

describe('Drivers tenant-scoped profile surface', () => {
  let app: INestApplication; let pool: Pool; let auth: AuthService;
  let tenantId: string; let otherTenantId: string; let adminId: string; let otherAdminId: string; let driverId: string; let profileId: string;
  async function token(subject: string, roles: string[], tenant?: string): Promise<string> { return auth.issueForTestOnly({ subject, roles, tenantId: tenant }); }
  async function actor(role: string, tenant: string): Promise<string> {
    const id = randomUUID();
    await pool.query('INSERT INTO "user" (id,email,display_name) VALUES ($1,$2,$3)', [id, `${role}-${id}@drivers.example.test`, role]);
    const membership = await pool.query<{ id: string }>('INSERT INTO tenant_membership(id,user_id,tenant_id) VALUES($1,$2,$3) RETURNING id', [randomUUID(), id, tenant]);
    await pool.query('INSERT INTO role_assignment(id,membership_id,role) VALUES($1,$2,$3)', [randomUUID(), membership.rows[0]!.id, role]);
    return id;
  }
  beforeAll(async () => {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL_REQUIRED_FOR_DRIVERS_TEST');
    process.env.AUTH_PROVISIONAL_SIGNING_SECRET = 'test-secret-that-is-at-least-thirty-two-chars';
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(CREDENTIAL_VERIFIER).useValue({ verify: async () => null }).overrideProvider(IDENTITY_STATUS_VERIFIER).useFactory({ inject: [UsersRepository], factory: (users: UsersRepository) => ({ assertActive: async (principal: { subject: string; tenantId?: string; roles: string[] }) => { if (!/^[0-9a-f-]{36}$/i.test(principal.subject)) return principal; const authorities = await users.getActorAuthorities(principal.subject); if (!authorities.filter((row) => !principal.tenantId || row.tenantId === principal.tenantId || row.role === 'super-admin').length) throw new UnauthorizedException(); return principal; } }) }).compile();
    app = module.createNestApplication(); app.use(correlationMiddleware); app.useGlobalFilters(new ApiExceptionFilter()); await app.init(); auth = app.get(AuthService);
    const bootstrap = await token('drivers-bootstrap', ['super-admin']);
    const tenant = await request(app.getHttpServer()).post('/tenants').set('Authorization', `Bearer ${bootstrap}`).send({ name: `Drivers Tenant ${Date.now()}` }); expect(tenant.status).toBe(201); tenantId = tenant.body.id;
    const other = await request(app.getHttpServer()).post('/tenants').set('Authorization', `Bearer ${bootstrap}`).send({ name: `Other Drivers Tenant ${Date.now()}` }); expect(other.status).toBe(201); otherTenantId = other.body.id;
    adminId = await actor('school-admin', tenantId); otherAdminId = await actor('school-admin', otherTenantId); driverId = await actor('driver', tenantId);
  });
  afterAll(async () => { await app?.close(); if (pool) { await pool.query('DELETE FROM driver_profile WHERE tenant_id = ANY($1::uuid[])', [[tenantId, otherTenantId]]); await pool.query('DELETE FROM role_assignment WHERE membership_id IN (SELECT id FROM tenant_membership WHERE tenant_id = ANY($1::uuid[]))', [[tenantId, otherTenantId]]); await pool.query('DELETE FROM tenant_membership WHERE tenant_id = ANY($1::uuid[])', [[tenantId, otherTenantId]]); await pool.query("DELETE FROM \"user\" WHERE email LIKE '%drivers.example.test'"); await pool.query('DELETE FROM tenant WHERE id = ANY($1::uuid[])', [[tenantId, otherTenantId]]); await pool.end(); } });

  it('creates and reads only an active tenant-scoped Driver profile', async () => {
    const admin = await token(adminId, ['school-admin'], tenantId);
    const created = await request(app.getHttpServer()).post('/drivers').set('Authorization', `Bearer ${admin}`).send({ tenant_id: tenantId, user_id: driverId });
    expect(created.status).toBe(201); expect(created.body.tenantId).toBe(tenantId); expect(created.body.userId).toBe(driverId); expect(created.body.status).toBe('active'); profileId = created.body.id;
    const listed = await request(app.getHttpServer()).get('/drivers').set('Authorization', `Bearer ${admin}`); expect(listed.status).toBe(200); expect(listed.body.map((row: { id: string }) => row.id)).toContain(profileId);
    const fetched = await request(app.getHttpServer()).get(`/drivers/${profileId}`).set('Authorization', `Bearer ${admin}`); expect(fetched.status).toBe(200); expect(fetched.body.id).toBe(profileId);
  });

  it('denies cross-tenant management and rejects stale lifecycle updates', async () => {
    const foreign = await token(otherAdminId, ['school-admin'], otherTenantId);
    expect((await request(app.getHttpServer()).get(`/drivers/${profileId}`).set('Authorization', `Bearer ${foreign}`)).status).toBe(404);
    const admin = await token(adminId, ['school-admin'], tenantId);
    expect((await request(app.getHttpServer()).patch(`/drivers/${profileId}`).set('Authorization', `Bearer ${admin}`).send({ status: 'archived', version: 99 })).status).toBe(409);
    const archived = await request(app.getHttpServer()).patch(`/drivers/${profileId}`).set('Authorization', `Bearer ${admin}`).send({ status: 'archived', version: 1 }); expect(archived.status).toBe(200); expect(archived.body.status).toBe('archived');
    expect((await request(app.getHttpServer()).get(`/drivers/${profileId}`).set('Authorization', `Bearer ${admin}`)).status).toBe(404);
  });

  it('does not allow a Driver to create or mutate profiles', async () => {
    const driver = await token(driverId, ['driver'], tenantId);
    expect((await request(app.getHttpServer()).post('/drivers').set('Authorization', `Bearer ${driver}`).send({ tenant_id: tenantId, user_id: driverId })).status).toBe(404);
    expect((await request(app.getHttpServer()).patch(`/drivers/${profileId}`).set('Authorization', `Bearer ${driver}`).send({ status: 'active', version: 2 })).status).toBe(404);
  });
});
