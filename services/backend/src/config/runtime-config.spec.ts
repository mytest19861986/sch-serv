import { loadRuntimeConfig } from './runtime-config.js';

describe('loadRuntimeConfig', () => {
  it('rejects an absent provisional signing secret', () => {
    expect(() => loadRuntimeConfig({ APP_ENV: 'test', PORT: '3001', DATABASE_URL: 'postgres://localhost/test' })).toThrow('CONFIGURATION_INVALID');
  });

  it('rejects an invalid port', () => {
    expect(() => loadRuntimeConfig({ APP_ENV: 'test', PORT: 'invalid', AUTH_PROVISIONAL_SIGNING_SECRET: 'x'.repeat(32), DATABASE_URL: 'postgres://localhost/test' })).toThrow('CONFIGURATION_INVALID');
  });

  it('rejects production while provisional authentication is selected', () => {
    expect(() => loadRuntimeConfig({ APP_ENV: 'production', AUTH_PROVISIONAL_SIGNING_SECRET: 'x'.repeat(32), DATABASE_URL: 'postgres://localhost/test' })).toThrow('PROVISIONAL_AUTH_NOT_ALLOWED_IN_PRODUCTION');
  });

  it('rejects a production Node process with missing or contradictory APP_ENV', () => {
    expect(() => loadRuntimeConfig({ NODE_ENV: 'production', AUTH_PROVISIONAL_SIGNING_SECRET: 'x'.repeat(32) })).toThrow('PROVISIONAL_AUTH_NOT_ALLOWED_IN_PRODUCTION');
    expect(() => loadRuntimeConfig({ NODE_ENV: 'production', APP_ENV: 'development', AUTH_PROVISIONAL_SIGNING_SECRET: 'x'.repeat(32) })).toThrow('PROVISIONAL_AUTH_NOT_ALLOWED_IN_PRODUCTION');
  });

  it('returns validated configuration', () => {
    expect(loadRuntimeConfig({ APP_ENV: 'test', PORT: '3001', AUTH_PROVISIONAL_SIGNING_SECRET: 'x'.repeat(32), DATABASE_URL: 'postgres://localhost/test' })).toMatchObject({ environment: 'test', port: 3001, databaseUrl: 'postgres://localhost/test' });
  });

  it('rejects a missing database URL', () => {
    expect(() => loadRuntimeConfig({ APP_ENV: 'test', AUTH_PROVISIONAL_SIGNING_SECRET: 'x'.repeat(32) })).toThrow('CONFIGURATION_INVALID');
  });
});
