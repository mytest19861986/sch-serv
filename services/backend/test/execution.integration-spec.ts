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
import { runMigrations } from '../src/db/migrate.js';

describe('Slice 13.11 Driver Service Execution security boundary', () => {
  let app: INestApplication; let pool: Pool; let auth: AuthService;
  let tenantId: string; let otherTenantId: string; let schoolId: string; let otherSchoolId: string;
  let driverUserId: string; let otherDriverUserId: string; let driverProfileId: string; let otherDriverProfileId: string;
  let serviceInstanceId: string; let pendingInstanceId: string; let otherInstanceId: string; let studentId: string; let archivedStudentId: string; let serviceId: string; let routeId: string; let bootstrapTenantId: string; let bootstrapId: string;

  async function token(subject: string, roles: string[], tenant?: string): Promise<string> { return auth.issueForTestOnly({ subject, roles, tenantId: tenant }); }
  async function actor(role: string, tenant: string, marker = 'execution'): Promise<string> {
    const id = randomUUID();
    await pool.query('INSERT INTO "user" (id,email,display_name) VALUES ($1,$2,$3)', [id, `${role}-${id}@${marker}.example.test`, role]);
    const membership = await pool.query<{ id: string }>('INSERT INTO tenant_membership(id,user_id,tenant_id) VALUES($1,$2,$3) RETURNING id', [randomUUID(), id, tenant]);
    await pool.query('INSERT INTO role_assignment(id,membership_id,role) VALUES($1,$2,$3)', [randomUUID(), membership.rows[0]!.id, role]);
    return id;
  }
  async function fixture(instanceId: string, tenant: string, school: string, service: string, driverProfile: string, dayOffset = 0): Promise<void> {
    await pool.query('INSERT INTO service_instance(id,tenant_id,school_id,service_id,operational_date) VALUES($1,$2,$3,$4,CURRENT_DATE + $5::int)', [instanceId, tenant, school, service, dayOffset]);
    await pool.query('INSERT INTO driver_service_assignment(id,tenant_id,school_id,service_instance_id,driver_id) VALUES($1,$2,$3,$4,$5)', [randomUUID(), tenant, school, instanceId, driverProfile]);
  }

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL_REQUIRED_FOR_EXECUTION_TEST');
    process.env.AUTH_PROVISIONAL_SIGNING_SECRET = 'test-secret-that-is-at-least-thirty-two-chars';
    pool = new Pool({ connectionString: process.env.DATABASE_URL }); await runMigrations(pool);
    bootstrapTenantId = randomUUID(); bootstrapId = randomUUID();
    await pool.query('INSERT INTO tenant (id,name) VALUES ($1,$2)', [bootstrapTenantId, `Execution Bootstrap ${Date.now()}`]);
    await pool.query('INSERT INTO "user" (id,email,display_name) VALUES ($1,$2,$3)', [bootstrapId, `bootstrap-${bootstrapId}@execution.example.test`, 'Execution Bootstrap']);
    const membership = await pool.query<{ id: string }>('INSERT INTO tenant_membership(id,user_id,tenant_id) VALUES($1,$2,$3) RETURNING id', [randomUUID(), bootstrapId, bootstrapTenantId]);
    await pool.query('INSERT INTO role_assignment(id,membership_id,role) VALUES($1,$2,$3)', [randomUUID(), membership.rows[0]!.id, 'super-admin']);
    const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(CREDENTIAL_VERIFIER).useValue({ verify: async () => null }).compile();
    app = module.createNestApplication(); app.use(correlationMiddleware); app.useGlobalFilters(new ApiExceptionFilter()); await app.init(); auth = app.get(AuthService);
    const bootstrap = await token(bootstrapId, ['super-admin'], bootstrapTenantId);
    tenantId = (await request(app.getHttpServer()).post('/tenants').set('Authorization', `Bearer ${bootstrap}`).send({ name: `Execution Tenant ${Date.now()}` })).body.id;
    otherTenantId = (await request(app.getHttpServer()).post('/tenants').set('Authorization', `Bearer ${bootstrap}`).send({ name: `Other Execution Tenant ${Date.now()}` })).body.id;
    schoolId = randomUUID(); otherSchoolId = randomUUID(); await pool.query('INSERT INTO school (id,tenant_id,name) VALUES ($1,$2,$3),($4,$5,$6)', [schoolId, tenantId, 'Execution School', otherSchoolId, otherTenantId, 'Other Execution School']);
    driverUserId = await actor('driver', tenantId); otherDriverUserId = await actor('driver', otherTenantId);
    driverProfileId = randomUUID(); otherDriverProfileId = randomUUID(); await pool.query('INSERT INTO driver_profile(id,tenant_id,user_id) VALUES($1,$2,$3),($4,$5,$6)', [driverProfileId, tenantId, driverUserId, otherDriverProfileId, otherTenantId, otherDriverUserId]);
    routeId = randomUUID(); serviceId = randomUUID(); await pool.query('INSERT INTO route(id,tenant_id,school_id,name) VALUES($1,$2,$3,$4)', [routeId, tenantId, schoolId, 'Execution Route']); await pool.query('INSERT INTO transport_service(id,tenant_id,school_id,route_id,name) VALUES($1,$2,$3,$4,$5)', [serviceId, tenantId, schoolId, routeId, 'Execution Service']);
    serviceInstanceId = randomUUID(); await fixture(serviceInstanceId, tenantId, schoolId, serviceId, driverProfileId);
    pendingInstanceId = randomUUID(); await fixture(pendingInstanceId, tenantId, schoolId, serviceId, driverProfileId, 1);
    otherInstanceId = randomUUID(); const otherRoute = randomUUID(); const otherService = randomUUID(); await pool.query('INSERT INTO route(id,tenant_id,school_id,name) VALUES($1,$2,$3,$4)', [otherRoute, otherTenantId, otherSchoolId, 'Other Route']); await pool.query('INSERT INTO transport_service(id,tenant_id,school_id,route_id,name) VALUES($1,$2,$3,$4,$5)', [otherService, otherTenantId, otherSchoolId, otherRoute, 'Other Service']); await fixture(otherInstanceId, otherTenantId, otherSchoolId, otherService, otherDriverProfileId);
    studentId = randomUUID(); archivedStudentId = randomUUID(); await pool.query('INSERT INTO student(id,tenant_id,school_id,display_name) VALUES($1,$2,$3,$4),($5,$6,$7,$8)', [studentId, tenantId, schoolId, 'Active Student', archivedStudentId, tenantId, schoolId, 'Archived Student']); await pool.query("UPDATE student SET status='archived' WHERE id=$1", [archivedStudentId]); await pool.query('INSERT INTO student_service_assignment(id,tenant_id,school_id,service_instance_id,student_id) VALUES($1,$2,$3,$4,$5),($6,$2,$3,$4,$7)', [randomUUID(), tenantId, schoolId, serviceInstanceId, studentId, randomUUID(), archivedStudentId]);
  });

  afterAll(async () => { await app?.close(); if (pool) { const tenants = [tenantId, otherTenantId, bootstrapTenantId]; await pool.query('DELETE FROM student_service_assignment WHERE tenant_id = ANY($1::uuid[])', [tenants]); await pool.query('DELETE FROM driver_service_assignment WHERE tenant_id = ANY($1::uuid[])', [tenants]); await pool.query('DELETE FROM service_instance WHERE tenant_id = ANY($1::uuid[])', [tenants]); await pool.query('DELETE FROM transport_service WHERE tenant_id = ANY($1::uuid[])', [tenants]); await pool.query('DELETE FROM route WHERE tenant_id = ANY($1::uuid[])', [tenants]); await pool.query('DELETE FROM student WHERE tenant_id = ANY($1::uuid[])', [tenants]); await pool.query('DELETE FROM driver_profile WHERE tenant_id = ANY($1::uuid[])', [tenants]); await pool.query('DELETE FROM role_assignment WHERE membership_id IN (SELECT id FROM tenant_membership WHERE tenant_id = ANY($1::uuid[]))', [tenants]); await pool.query('DELETE FROM tenant_membership WHERE tenant_id = ANY($1::uuid[])', [tenants]); await pool.query('DELETE FROM "user" WHERE email LIKE ANY($1::text[])', [['%execution.example.test', `bootstrap-${bootstrapId}@execution.example.test`]]); await pool.query('DELETE FROM school WHERE tenant_id = ANY($1::uuid[])', [tenants]); await pool.query('DELETE FROM tenant WHERE id = ANY($1::uuid[])', [tenants]); await pool.end(); } });

  it('lists only assigned active services, starts with OCC, and is idempotent', async () => {
    const driver = await token(driverUserId, ['driver'], tenantId); const active = await request(app.getHttpServer()).get('/driver/active-services').set('Authorization', `Bearer ${driver}`); expect(active.status).toBe(200); expect(active.body.map((row: { id: string }) => row.id)).toContain(serviceInstanceId);
    const started = await request(app.getHttpServer()).post(`/driver/services/${serviceInstanceId}/start`).set('Authorization', `Bearer ${driver}`).send({ expectedVersion: 1 }); expect(started.status).toBe(201); expect(started.body.executionStatus).toBe('in_progress'); expect(started.body.version).toBe(2);
    const auditBefore = await pool.query('SELECT count(*)::int AS count FROM audit_record WHERE target_id=$1 AND action=\'driver_service.start\'', [serviceInstanceId]); const replay = await request(app.getHttpServer()).post(`/driver/services/${serviceInstanceId}/start`).set('Authorization', `Bearer ${driver}`).send({ expectedVersion: 1 }); expect(replay.status).toBe(201); expect(replay.body.version).toBe(2); const auditAfter = await pool.query('SELECT count(*)::int AS count FROM audit_record WHERE target_id=$1 AND action=\'driver_service.start\'', [serviceInstanceId]); expect(auditAfter.rows[0].count).toBe(auditBefore.rows[0].count);
  });

  it('enforces enumeration-safe scope, lifecycle and stale authority denial', async () => {
    const foreign = await token(otherDriverUserId, ['driver'], otherTenantId); expect((await request(app.getHttpServer()).post(`/driver/services/${serviceInstanceId}/start`).set('Authorization', `Bearer ${foreign}`).send({ expectedVersion: 1 })).status).toBe(404); expect((await request(app.getHttpServer()).get(`/driver/services/${serviceInstanceId}/transport-state`).set('Authorization', 'Bearer invalid')).status).toBe(401);
    const assignment = await pool.query<{ id: string }>('SELECT id FROM driver_service_assignment WHERE service_instance_id=$1', [serviceInstanceId]); await pool.query("UPDATE driver_service_assignment SET status='revoked' WHERE id=$1", [assignment.rows[0]!.id]); const driver = await token(driverUserId, ['driver'], tenantId); expect((await request(app.getHttpServer()).get(`/driver/services/${serviceInstanceId}/transport-state`).set('Authorization', `Bearer ${driver}`)).status).toBe(404); await pool.query("UPDATE driver_service_assignment SET status='active' WHERE id=$1", [assignment.rows[0]!.id]);
  });

  it('rejects stale OCC and denies roster until start, then minimizes active student data', async () => {
    const driver = await token(driverUserId, ['driver'], tenantId); const foreign = await token(otherDriverUserId, ['driver'], otherTenantId); const fresh = await request(app.getHttpServer()).post(`/driver/services/${otherInstanceId}/start`).set('Authorization', `Bearer ${foreign}`).send({ expectedVersion: 1 }); expect(fresh.status).toBe(201);
    const rosterBefore = await request(app.getHttpServer()).get(`/driver/services/${pendingInstanceId}/roster`).set('Authorization', `Bearer ${driver}`); expect(rosterBefore.status).toBe(404);
    const start = await request(app.getHttpServer()).post(`/driver/services/${pendingInstanceId}/start`).set('Authorization', `Bearer ${driver}`).send({ expectedVersion: 99 }); expect(start.status).toBe(409);
    await pool.query('INSERT INTO student_service_assignment(id,tenant_id,school_id,service_instance_id,student_id) VALUES($1,$2,$3,$4,$5)', [randomUUID(), tenantId, schoolId, pendingInstanceId, studentId]);
    const rosterStillBefore = await request(app.getHttpServer()).get(`/driver/services/${pendingInstanceId}/roster`).set('Authorization', `Bearer ${driver}`); expect(rosterStillBefore.status).toBe(404);
    const started = await request(app.getHttpServer()).post(`/driver/services/${pendingInstanceId}/start`).set('Authorization', `Bearer ${driver}`).send({ expectedVersion: 1 }); expect(started.status).toBe(201);
    const roster = await request(app.getHttpServer()).get(`/driver/services/${pendingInstanceId}/roster`).set('Authorization', `Bearer ${driver}`); expect(roster.status).toBe(200); expect(roster.body).toEqual([{ id: studentId, displayName: 'Active Student' }]);
  });
});
