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
import { SignJWT } from 'jose';

describe('Slice 13.11 Driver Service Execution security boundary', () => {
  let app: INestApplication; let pool: Pool; let auth: AuthService;
  let tenantId: string; let otherTenantId: string; let schoolId: string; let otherSchoolId: string;
  let driverUserId: string; let otherDriverUserId: string; let driverProfileId: string; let otherDriverProfileId: string;
  let serviceInstanceId: string; let pendingInstanceId: string; let parityPreStartInstanceId: string; let otherInstanceId: string; let sameTenantForeignSchoolInstanceId: string; let revokedAssignmentInstanceId: string; let inactiveLifecycleInstanceId: string; let sameTenantOtherDriverProfileId: string; let sameTenantForeignSchoolId: string; let studentId: string; let archivedStudentId: string; let serviceId: string; let routeId: string; let bootstrapTenantId: string; let bootstrapId: string;

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
    driverProfileId = randomUUID(); otherDriverProfileId = randomUUID(); const sameTenantOtherDriverUserId = await actor('driver', tenantId, 'execution-other-school'); sameTenantOtherDriverProfileId = randomUUID(); await pool.query('INSERT INTO driver_profile(id,tenant_id,user_id) VALUES($1,$2,$3),($4,$5,$6),($7,$8,$9)', [driverProfileId, tenantId, driverUserId, otherDriverProfileId, otherTenantId, otherDriverUserId, sameTenantOtherDriverProfileId, tenantId, sameTenantOtherDriverUserId]);
    routeId = randomUUID(); serviceId = randomUUID(); await pool.query('INSERT INTO route(id,tenant_id,school_id,name) VALUES($1,$2,$3,$4)', [routeId, tenantId, schoolId, 'Execution Route']); await pool.query('INSERT INTO transport_service(id,tenant_id,school_id,route_id,name) VALUES($1,$2,$3,$4,$5)', [serviceId, tenantId, schoolId, routeId, 'Execution Service']);
    serviceInstanceId = randomUUID(); await fixture(serviceInstanceId, tenantId, schoolId, serviceId, driverProfileId);
    pendingInstanceId = randomUUID(); await fixture(pendingInstanceId, tenantId, schoolId, serviceId, driverProfileId, 1);
    parityPreStartInstanceId = randomUUID(); await fixture(parityPreStartInstanceId, tenantId, schoolId, serviceId, driverProfileId, 4);
    otherInstanceId = randomUUID(); const otherRoute = randomUUID(); const otherService = randomUUID(); await pool.query('INSERT INTO route(id,tenant_id,school_id,name) VALUES($1,$2,$3,$4)', [otherRoute, otherTenantId, otherSchoolId, 'Other Route']); await pool.query('INSERT INTO transport_service(id,tenant_id,school_id,route_id,name) VALUES($1,$2,$3,$4,$5)', [otherService, otherTenantId, otherSchoolId, otherRoute, 'Other Service']); await fixture(otherInstanceId, otherTenantId, otherSchoolId, otherService, otherDriverProfileId);
    sameTenantForeignSchoolId = randomUUID(); const sameTenantForeignRoute = randomUUID(); const sameTenantForeignService = randomUUID(); await pool.query('INSERT INTO school (id,tenant_id,name) VALUES ($1,$2,$3)', [sameTenantForeignSchoolId, tenantId, 'Execution Foreign School']); await pool.query('INSERT INTO route(id,tenant_id,school_id,name) VALUES($1,$2,$3,$4)', [sameTenantForeignRoute, tenantId, sameTenantForeignSchoolId, 'Foreign School Route']); await pool.query('INSERT INTO transport_service(id,tenant_id,school_id,route_id,name) VALUES($1,$2,$3,$4,$5)', [sameTenantForeignService, tenantId, sameTenantForeignSchoolId, sameTenantForeignRoute, 'Foreign School Service']); sameTenantForeignSchoolInstanceId = randomUUID(); await fixture(sameTenantForeignSchoolInstanceId, tenantId, sameTenantForeignSchoolId, sameTenantForeignService, sameTenantOtherDriverProfileId);
    revokedAssignmentInstanceId = randomUUID(); await fixture(revokedAssignmentInstanceId, tenantId, schoolId, serviceId, driverProfileId, 2); const revoked = await pool.query<{ id: string }>('SELECT id FROM driver_service_assignment WHERE service_instance_id=$1', [revokedAssignmentInstanceId]); await pool.query("UPDATE driver_service_assignment SET status='revoked' WHERE id=$1", [revoked.rows[0]!.id]);
    inactiveLifecycleInstanceId = randomUUID(); await fixture(inactiveLifecycleInstanceId, tenantId, schoolId, serviceId, driverProfileId, 3); await pool.query("UPDATE service_instance SET status='archived' WHERE id=$1", [inactiveLifecycleInstanceId]);
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

  it('keeps non-disclosable roster denials parity-safe across lifecycle and scope states', async () => {
    const driver = await token(driverUserId, ['driver'], tenantId);
    const cases = [
      ['pre-start', parityPreStartInstanceId, driver],
      ['missing-id', randomUUID(), driver],
      ['cross-tenant', otherInstanceId, driver],
      ['cross-school', sameTenantForeignSchoolInstanceId, driver],
      ['revoked-assignment', revokedAssignmentInstanceId, driver],
      ['inactive-lifecycle', inactiveLifecycleInstanceId, driver],
    ] as const;
    const responses = await Promise.all(cases.map(([, id, authorization]) => request(app.getHttpServer()).get(`/driver/services/${id}/roster`).set('Authorization', `Bearer ${authorization}`)));
    const comparable = responses.map((response) => ({ status: response.status, code: response.body?.error?.code, message: response.body?.error?.message }));
    expect(comparable).toHaveLength(cases.length);
    for (const value of comparable) expect(value).toEqual({ status: 404, code: 'SAFE_NOT_FOUND', message: 'The requested resource was not found.' });
    for (const response of responses) {
      expect(response.body.error).toEqual(expect.objectContaining({ code: 'SAFE_NOT_FOUND', message: 'The requested resource was not found.' }));
      expect(Object.keys(response.body.error).sort()).toEqual(['code', 'correlation_id', 'message']);
      expect(response.body.error).not.toHaveProperty('timestamp');
      expect(response.body.error).not.toHaveProperty('tenant_id');
      expect(response.body.error).not.toHaveProperty('school_id');
      expect(response.body.error).not.toHaveProperty('service_instance_id');
    }
    expect((await request(app.getHttpServer()).get(`/driver/services/${pendingInstanceId}/roster`).set('Authorization', 'Bearer invalid')).status).toBe(401);
    const expired = await new SignJWT({ roles: ['driver'], tenantId }).setProtectedHeader({ alg: 'HS256', typ: 'JWT' }).setSubject(driverUserId).setIssuedAt().setExpirationTime('0s').sign(new TextEncoder().encode(process.env.AUTH_PROVISIONAL_SIGNING_SECRET!));
    expect((await request(app.getHttpServer()).get(`/driver/services/${pendingInstanceId}/roster`).set('Authorization', `Bearer ${expired}`)).status).toBe(401);
    await request(app.getHttpServer()).post(`/driver/services/${pendingInstanceId}/start`).set('Authorization', `Bearer ${driver}`).send({ expectedVersion: 1 });
    expect((await request(app.getHttpServer()).get(`/driver/services/${pendingInstanceId}/roster`).set('Authorization', `Bearer ${driver}`)).status).toBe(200);
  });

  it('keeps online pickup denials enumeration-safe across target and authority states', async () => {
    const driver = await token(driverUserId, ['driver'], tenantId);
    const preStartId = randomUUID(); const unassignedId = randomUUID(); const revokedId = randomUUID();
    const unassignedStudentId = randomUUID(); const foreignStudentId = randomUUID();
    await fixture(preStartId, tenantId, schoolId, serviceId, driverProfileId, 5);
    await pool.query('INSERT INTO service_instance(id,tenant_id,school_id,service_id,operational_date) VALUES($1,$2,$3,$4,CURRENT_DATE + 6)', [unassignedId, tenantId, schoolId, serviceId]);
    await fixture(revokedId, tenantId, schoolId, serviceId, driverProfileId, 7);
    const revoked = await pool.query<{ id: string }>('SELECT id FROM driver_service_assignment WHERE service_instance_id=$1', [revokedId]);
    await pool.query("UPDATE driver_service_assignment SET status='revoked' WHERE id=$1", [revoked.rows[0]!.id]);
    await pool.query('INSERT INTO student(id,tenant_id,school_id,display_name) VALUES($1,$2,$3,$4),($5,$6,$7,$8)', [unassignedStudentId, tenantId, schoolId, 'Unassigned Pickup Student', foreignStudentId, otherTenantId, otherSchoolId, 'Foreign Pickup Student']);
    const cases = [
      ['missing-service', randomUUID(), studentId],
      ['cross-tenant-service', otherInstanceId, studentId],
      ['cross-school-service', sameTenantForeignSchoolInstanceId, studentId],
      ['revoked-driver-assignment', revokedId, studentId],
      ['pre-start-service', preStartId, studentId],
      ['missing-student', serviceInstanceId, randomUUID()],
      ['foreign-student', serviceInstanceId, foreignStudentId],
      ['unassigned-student', serviceInstanceId, unassignedStudentId],
    ] as const;
    const responses = await Promise.all(cases.map(([label, instance, student]) => request(app.getHttpServer()).post(`/driver/services/${instance}/students/${student}/pickup`).set('Authorization', `Bearer ${driver}`).set('Idempotency-Key', randomUUID()).send({ client_event_id: randomUUID(), occurred_at: new Date().toISOString() }).then((response) => ({ label, response }))));
    const comparable = responses.map(({ response }) => ({ status: response.status, code: response.body?.error?.code, message: response.body?.error?.message, keys: Object.keys(response.body?.error ?? {}).sort() }));
    for (const value of comparable) expect(value).toEqual({ status: 404, code: 'SAFE_NOT_FOUND', message: 'The requested resource was not found.', keys: ['code', 'correlation_id', 'message'] });
    for (const { response } of responses) {
      expect(response.body.error).not.toHaveProperty('tenant_id');
      expect(response.body.error).not.toHaveProperty('school_id');
      expect(response.body.error).not.toHaveProperty('service_instance_id');
      expect(response.body.error).not.toHaveProperty('student_id');
      expect(response.body.error).not.toHaveProperty('lifecycle_status');
    }
    expect((await request(app.getHttpServer()).post(`/driver/services/${serviceInstanceId}/students/${studentId}/pickup`).set('Authorization', 'Bearer invalid').set('Idempotency-Key', randomUUID()).send({ client_event_id: randomUUID(), occurred_at: new Date().toISOString() })).status).toBe(401);
    const expired = await new SignJWT({ roles: ['driver'], tenantId }).setProtectedHeader({ alg: 'HS256', typ: 'JWT' }).setSubject(driverUserId).setIssuedAt().setExpirationTime('0s').sign(new TextEncoder().encode(process.env.AUTH_PROVISIONAL_SIGNING_SECRET!));
    expect((await request(app.getHttpServer()).post(`/driver/services/${serviceInstanceId}/students/${studentId}/pickup`).set('Authorization', `Bearer ${expired}`).set('Idempotency-Key', randomUUID()).send({ client_event_id: randomUUID(), occurred_at: new Date().toISOString() })).status).toBe(401);
    await pool.query('DELETE FROM student WHERE id = ANY($1::uuid[])', [[unassignedStudentId, foreignStudentId]]);
    await pool.query('DELETE FROM driver_service_assignment WHERE service_instance_id = ANY($1::uuid[])', [[preStartId, unassignedId, revokedId]]);
    await pool.query('DELETE FROM service_instance WHERE id = ANY($1::uuid[])', [[preStartId, unassignedId, revokedId]]);
  });

  it('records online pickup atomically and protects replay and scope', async () => {
    const driver = await token(driverUserId, ['driver'], tenantId);
    const clientEventId = randomUUID();
    const body = { client_event_id: clientEventId, occurred_at: new Date().toISOString() };
    const first = await request(app.getHttpServer()).post(`/driver/services/${serviceInstanceId}/students/${studentId}/pickup`).set('Authorization', `Bearer ${driver}`).set('Idempotency-Key', clientEventId).send(body);
    expect(first.status).toBe(201);
    expect(first.body.disposition).toBe('COMMITTED');
    const replay = await request(app.getHttpServer()).post(`/driver/services/${serviceInstanceId}/students/${studentId}/pickup`).set('Authorization', `Bearer ${driver}`).set('Idempotency-Key', clientEventId).send(body);
    expect(replay.status).toBe(201);
    expect(replay.body.disposition).toBe('REPLAYED');
    const changedIntent = await request(app.getHttpServer()).post(`/driver/services/${serviceInstanceId}/students/${studentId}/pickup`).set('Authorization', `Bearer ${driver}`).set('Idempotency-Key', clientEventId).send({ ...body, known_state_version: 0 });
    expect(changedIntent.status).toBe(409);
    expect(changedIntent.body.error).toEqual(expect.objectContaining({ code: 'STATE_CONFLICT', message: 'The request conflicts with the current state.' }));
    expect(Object.keys(changedIntent.body.error).sort()).toEqual(['code', 'correlation_id', 'message']);
    const metadataVariant = await request(app.getHttpServer()).post(`/driver/services/${serviceInstanceId}/students/${studentId}/pickup`).set('Authorization', `Bearer ${driver}`).set('Idempotency-Key', clientEventId).send({ ...body, occurred_at: new Date(Date.now() + 86400000).toISOString(), device_context: { network: 'changed' } });
    expect(metadataVariant.status).toBe(201);
    expect(metadataVariant.body.disposition).toBe('REPLAYED');
    const canonicalEquivalent = await request(app.getHttpServer()).post(`/driver/services/${serviceInstanceId}/students/${studentId}/pickup`).set('Authorization', `Bearer ${driver}`).set('Idempotency-Key', clientEventId.toUpperCase()).send({ ...body, client_event_id: clientEventId.toUpperCase() });
    expect(canonicalEquivalent.status).toBe(201);
    expect(canonicalEquivalent.body.disposition).toBe('REPLAYED');
    expect((await pool.query('SELECT count(*)::int AS count FROM transport_event WHERE tenant_id=$1 AND client_event_id=$2', [tenantId, clientEventId])).rows[0].count).toBe(1);
    const foreign = await token(otherDriverUserId, ['driver'], otherTenantId);
    const denied = await request(app.getHttpServer()).post(`/driver/services/${serviceInstanceId}/students/${studentId}/pickup`).set('Authorization', `Bearer ${foreign}`).set('Idempotency-Key', randomUUID()).send({ ...body, client_event_id: randomUUID() });
    expect(denied.status).toBe(404);
    const mismatch = await request(app.getHttpServer()).post(`/driver/services/${serviceInstanceId}/students/${studentId}/pickup`).set('Authorization', `Bearer ${driver}`).set('Idempotency-Key', randomUUID()).send(body);
    expect(mismatch.status).toBe(400);
    const malformedKey = await request(app.getHttpServer()).post(`/driver/services/${serviceInstanceId}/students/${studentId}/pickup`).set('Authorization', `Bearer ${driver}`).set('Idempotency-Key', 'not-a-uuid').send(body);
    expect(malformedKey.status).toBe(400);
    const missingKey = await request(app.getHttpServer()).post(`/driver/services/${serviceInstanceId}/students/${studentId}/pickup`).set('Authorization', `Bearer ${driver}`).send(body);
    expect(missingKey.status).toBe(400);
    const assignment = await pool.query<{ id: string }>('SELECT id FROM driver_service_assignment WHERE service_instance_id=$1 AND driver_id=$2', [serviceInstanceId, driverProfileId]);
    await pool.query("UPDATE driver_service_assignment SET status='revoked' WHERE id=$1", [assignment.rows[0]!.id]);
    const revokedReplay = await request(app.getHttpServer()).post(`/driver/services/${serviceInstanceId}/students/${studentId}/pickup`).set('Authorization', `Bearer ${driver}`).set('Idempotency-Key', clientEventId).send(body);
    expect(revokedReplay.status).toBe(404);
    await pool.query("UPDATE driver_service_assignment SET status='active' WHERE id=$1", [assignment.rows[0]!.id]);
    await pool.query('DELETE FROM student_transport_current_state WHERE tenant_id = $1 AND service_instance_id = $2 AND student_id = $3', [tenantId, serviceInstanceId, studentId]);
    await pool.query('DELETE FROM transport_event WHERE tenant_id = $1 AND client_event_id = $2', [tenantId, clientEventId]);
  });

  it('converges concurrent duplicate keys to one committed event and one replay', async () => {
    const driver = await token(driverUserId, ['driver'], tenantId);
    const concurrentStudentId = randomUUID(); const concurrentKey = randomUUID();
    await pool.query('INSERT INTO student(id,tenant_id,school_id,display_name) VALUES($1,$2,$3,$4)', [concurrentStudentId, tenantId, schoolId, 'Concurrent Student']);
    await pool.query('INSERT INTO student_service_assignment(id,tenant_id,school_id,service_instance_id,student_id) VALUES($1,$2,$3,$4,$5)', [randomUUID(), tenantId, schoolId, serviceInstanceId, concurrentStudentId]);
    const body = { client_event_id: concurrentKey, occurred_at: new Date().toISOString(), device_context: { attempt: 'one' } };
    const responses = await Promise.all([1, 2].map(() => request(app.getHttpServer()).post(`/driver/services/${serviceInstanceId}/students/${concurrentStudentId}/pickup`).set('Authorization', `Bearer ${driver}`).set('Idempotency-Key', concurrentKey).send(body)));
    expect(responses.map((response) => response.status).sort()).toEqual([201, 201]);
    expect(responses.map((response) => response.body.disposition).sort()).toEqual(['COMMITTED', 'REPLAYED']);
    expect((await pool.query('SELECT count(*)::int AS count FROM transport_event WHERE tenant_id=$1 AND client_event_id=$2', [tenantId, concurrentKey])).rows[0].count).toBe(1);
    expect((await pool.query("SELECT count(*)::int AS count FROM audit_record WHERE tenant_id=$1 AND target_id=$2 AND action='driver_service.pickup'", [tenantId, concurrentStudentId])).rows[0].count).toBe(1);
    await pool.query('DELETE FROM student_transport_current_state WHERE tenant_id=$1 AND service_instance_id=$2 AND student_id=$3', [tenantId, serviceInstanceId, concurrentStudentId]);
    await pool.query('DELETE FROM transport_event WHERE tenant_id=$1 AND client_event_id=$2', [tenantId, concurrentKey]);
    await pool.query('DELETE FROM student_service_assignment WHERE tenant_id=$1 AND service_instance_id=$2 AND student_id=$3', [tenantId, serviceInstanceId, concurrentStudentId]);
    await pool.query('DELETE FROM student WHERE id=$1', [concurrentStudentId]);
  });

  it('returns conflict for concurrent same-key requests with different intent', async () => {
    const driver = await token(driverUserId, ['driver'], tenantId);
    const concurrentStudentId = randomUUID(); const concurrentKey = randomUUID();
    await pool.query('INSERT INTO student(id,tenant_id,school_id,display_name) VALUES($1,$2,$3,$4)', [concurrentStudentId, tenantId, schoolId, 'Conflict Student']);
    await pool.query('INSERT INTO student_service_assignment(id,tenant_id,school_id,service_instance_id,student_id) VALUES($1,$2,$3,$4,$5)', [randomUUID(), tenantId, schoolId, serviceInstanceId, concurrentStudentId]);
    const base = { client_event_id: concurrentKey, occurred_at: new Date().toISOString() };
    const responses = await Promise.all([
      request(app.getHttpServer()).post(`/driver/services/${serviceInstanceId}/students/${concurrentStudentId}/pickup`).set('Authorization', `Bearer ${driver}`).set('Idempotency-Key', concurrentKey).send(base),
      request(app.getHttpServer()).post(`/driver/services/${serviceInstanceId}/students/${concurrentStudentId}/pickup`).set('Authorization', `Bearer ${driver}`).set('Idempotency-Key', concurrentKey).send({ ...base, known_state_version: 0 }),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(responses.find((response) => response.status === 201)?.body.disposition).toBe('COMMITTED');
    const conflict = responses.find((response) => response.status === 409)!;
    expect(conflict.body.error.code).toBe('STATE_CONFLICT');
    expect(Object.keys(conflict.body.error).sort()).toEqual(['code', 'correlation_id', 'message']);
    expect((await pool.query('SELECT count(*)::int AS count FROM transport_event WHERE tenant_id=$1 AND client_event_id=$2', [tenantId, concurrentKey])).rows[0].count).toBe(1);
    await pool.query('DELETE FROM student_transport_current_state WHERE tenant_id=$1 AND service_instance_id=$2 AND student_id=$3', [tenantId, serviceInstanceId, concurrentStudentId]);
    await pool.query('DELETE FROM transport_event WHERE tenant_id=$1 AND client_event_id=$2', [tenantId, concurrentKey]);
    await pool.query('DELETE FROM student_service_assignment WHERE tenant_id=$1 AND service_instance_id=$2 AND student_id=$3', [tenantId, serviceInstanceId, concurrentStudentId]);
    await pool.query('DELETE FROM student WHERE id=$1', [concurrentStudentId]);
  });

  it('rejects a stale known state version before creating any pickup effect', async () => {
    const driver = await token(driverUserId, ['driver'], tenantId);
    const staleStudentId = randomUUID(); const staleKey = randomUUID();
    await pool.query('INSERT INTO student(id,tenant_id,school_id,display_name) VALUES($1,$2,$3,$4)', [staleStudentId, tenantId, schoolId, 'Stale Version Student']);
    await pool.query('INSERT INTO student_service_assignment(id,tenant_id,school_id,service_instance_id,student_id) VALUES($1,$2,$3,$4,$5)', [randomUUID(), tenantId, schoolId, serviceInstanceId, staleStudentId]);
    const response = await request(app.getHttpServer()).post(`/driver/services/${serviceInstanceId}/students/${staleStudentId}/pickup`).set('Authorization', `Bearer ${driver}`).set('Idempotency-Key', staleKey).send({ client_event_id: staleKey, occurred_at: new Date().toISOString(), known_state_version: 9 });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('STATE_CONFLICT');
    expect(Object.keys(response.body.error).sort()).toEqual(['code', 'correlation_id', 'message']);
    expect((await pool.query('SELECT count(*)::int AS count FROM transport_event WHERE tenant_id=$1 AND client_event_id=$2', [tenantId, staleKey])).rows[0].count).toBe(0);
    expect((await pool.query('SELECT count(*)::int AS count FROM student_transport_current_state WHERE tenant_id=$1 AND service_instance_id=$2 AND student_id=$3', [tenantId, serviceInstanceId, staleStudentId])).rows[0].count).toBe(0);
    await pool.query('DELETE FROM student_service_assignment WHERE tenant_id=$1 AND service_instance_id=$2 AND student_id=$3', [tenantId, serviceInstanceId, staleStudentId]);
    await pool.query('DELETE FROM student WHERE id=$1', [staleStudentId]);
  });

  it('rolls back event, current state and audit when audit insertion fails', async () => {
    const driver = await token(driverUserId, ['driver'], tenantId);
    const rollbackStudentId = randomUUID(); const rollbackKey = randomUUID();
    await pool.query('INSERT INTO student(id,tenant_id,school_id,display_name) VALUES($1,$2,$3,$4)', [rollbackStudentId, tenantId, schoolId, 'Rollback Student']);
    await pool.query('INSERT INTO student_service_assignment(id,tenant_id,school_id,service_instance_id,student_id) VALUES($1,$2,$3,$4,$5)', [randomUUID(), tenantId, schoolId, serviceInstanceId, rollbackStudentId]);
    await pool.query(`CREATE OR REPLACE FUNCTION reject_pickup_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'TEST_AUDIT_FAILURE'; END; $$`);
    await pool.query("CREATE TRIGGER reject_pickup_audit_trigger BEFORE INSERT ON audit_record FOR EACH ROW WHEN (NEW.action = 'driver_service.pickup') EXECUTE FUNCTION reject_pickup_audit()");
    try {
      const response = await request(app.getHttpServer()).post(`/driver/services/${serviceInstanceId}/students/${rollbackStudentId}/pickup`).set('Authorization', `Bearer ${driver}`).set('Idempotency-Key', rollbackKey).send({ client_event_id: rollbackKey, occurred_at: new Date().toISOString() });
      expect(response.status).toBe(500);
      expect((await pool.query('SELECT count(*)::int AS count FROM transport_event WHERE tenant_id=$1 AND client_event_id=$2', [tenantId, rollbackKey])).rows[0].count).toBe(0);
      expect((await pool.query('SELECT count(*)::int AS count FROM student_transport_current_state WHERE tenant_id=$1 AND service_instance_id=$2 AND student_id=$3', [tenantId, serviceInstanceId, rollbackStudentId])).rows[0].count).toBe(0);
      expect((await pool.query("SELECT count(*)::int AS count FROM audit_record WHERE tenant_id=$1 AND target_id=$2 AND action='driver_service.pickup'", [tenantId, rollbackStudentId])).rows[0].count).toBe(0);
    } finally {
      await pool.query('DROP TRIGGER IF EXISTS reject_pickup_audit_trigger ON audit_record');
      await pool.query('DROP FUNCTION IF EXISTS reject_pickup_audit()');
      await pool.query('DELETE FROM student_service_assignment WHERE tenant_id=$1 AND service_instance_id=$2 AND student_id=$3', [tenantId, serviceInstanceId, rollbackStudentId]);
      await pool.query('DELETE FROM student WHERE id=$1', [rollbackStudentId]);
    }
  });
});
