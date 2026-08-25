import { loadRuntimeConfig } from './runtime-config.js';

describe('loadRuntimeConfig', () => {
  it('rejects an absent provisional signing secret', () => {
    expect(() => loadRuntimeConfig({ APP_ENV: 'test', PORT: '3001' })).toThrow('CONFIGURATION_INVALID');
  });

  it('rejects an invalid port', () => {
    expect(() => loadRuntimeConfig({ APP_ENV: 'test', PORT: 'invalid', AUTH_PROVISIONAL_SIGNING_SECRET: 'x'.repeat(32) })).toThrow('CONFIGURATION_INVALID');
  });

  it('returns validated configuration', () => {
    expect(loadRuntimeConfig({ APP_ENV: 'test', PORT: '3001', AUTH_PROVISIONAL_SIGNING_SECRET: 'x'.repeat(32) })).toMatchObject({ environment: 'test', port: 3001 });
  });
});
