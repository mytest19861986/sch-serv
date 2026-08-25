import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { correlationMiddleware } from '../src/common/correlation.js';
import { AuthService } from '../src/auth/auth.service.js';
import { CREDENTIAL_VERIFIER, IDENTITY_STATUS_VERIFIER } from '../src/auth/auth.types.js';

describe('authentication foundation integration', () => {
  let app: INestApplication;
  let authService: AuthService;

  beforeAll(async () => {
    process.env.AUTH_PROVISIONAL_SIGNING_SECRET = 'test-secret-that-is-at-least-thirty-two-chars';
    process.env.DATABASE_URL = 'postgres://localhost/test';
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CREDENTIAL_VERIFIER)
      .useValue({ verify: async () => null })
      .overrideProvider(IDENTITY_STATUS_VERIFIER)
      .useValue({ assertActive: async () => undefined })
      .compile();
    app = module.createNestApplication();
    app.use(correlationMiddleware);
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    authService = app.get(AuthService);
  });

  afterAll(async () => { await app.close(); });

  it('allows health without authentication and emits correlation identity', async () => {
    const response = await request(app.getHttpServer()).get('/health');
    expect(response.status).toBe(200);
    expect(response.headers['x-correlation-id']).toBeDefined();
  });

  it('denies a protected request without credentials using a safe envelope', async () => {
    const response = await request(app.getHttpServer()).get('/authz/context');
    expect(response.status).toBe(401);
    expect(response.body.error).toMatchObject({ code: 'AUTHENTICATION_REQUIRED', message: 'Authentication is required.' });
    expect(response.body.error.correlation_id).toBe(response.headers['x-correlation-id']);
    expect(JSON.stringify(response.body)).not.toContain('secret');
  });

  it('accepts an authorized server-issued principal and ignores client tenant context', async () => {
    const token = await authService.issueForTestOnly({ subject: 'user-1', tenantId: 'tenant-a', roles: ['foundation-user'] });
    const response = await request(app.getHttpServer())
      .get('/authz/context')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Tenant-Id', 'attacker-tenant');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ subject: 'user-1', tenantId: 'tenant-a' });
  });

  it('denies an authenticated but unauthorized actor', async () => {
    const token = await authService.issueForTestOnly({ subject: 'user-2', roles: ['foundation-user'] });
    const response = await request(app.getHttpServer()).get('/authz/denied').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
    expect(response.body.error).toMatchObject({ code: 'ACCESS_DENIED' });
  });

  it('rejects a tampered server-issued token without leaking token details', async () => {
    const token = await authService.issueForTestOnly({ subject: 'user-3', roles: ['foundation-user'] });
    const parts = token.split('.');
    const signature = parts[2] ?? '';
    const replacement = signature.startsWith('a') ? 'b' : 'a';
    const tampered = `${parts[0]}.${parts[1]}.${replacement}${signature.slice(1)}`;
    const response = await request(app.getHttpServer())
      .get('/authz/context')
      .set('Authorization', `Bearer ${tampered}`);
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    expect(JSON.stringify(response.body)).not.toContain(tampered);
  });

  it('rejects malformed bearer credentials', async () => {
    const response = await request(app.getHttpServer())
      .get('/authz/context')
      .set('Authorization', 'Basic not-a-bearer-token');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('returns a privacy-safe response for invalid credentials', async () => {
    const response = await request(app.getHttpServer()).post('/auth/login').send({ username: 'unknown', password: 'wrong' });
    expect(response.status).toBe(401);
    expect(response.body.error).toMatchObject({ code: 'AUTHENTICATION_REQUIRED' });
  });

  it('rejects unknown login fields', async () => {
    const response = await request(app.getHttpServer()).post('/auth/login').send({ username: 'u', password: 'p', role: 'admin' });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
