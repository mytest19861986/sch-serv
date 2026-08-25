export type RuntimeEnvironment = 'development' | 'test' | 'production';

export interface RuntimeConfig {
  readonly environment: RuntimeEnvironment;
  readonly port: number;
  readonly provisionalSigningSecret: string;
  readonly databaseUrl: string;
}

export function loadRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const environment = env.APP_ENV ?? 'development';
  // A deployment process marked production must never silently fall back to
  // development when APP_ENV is missing or contradictory.
  if (env.NODE_ENV === 'production' && environment !== 'production') {
    throw new Error('PROVISIONAL_AUTH_NOT_ALLOWED_IN_PRODUCTION');
  }
  if (environment !== 'development' && environment !== 'test' && environment !== 'production') {
    throw new Error('CONFIGURATION_INVALID');
  }
  if (environment === 'production') {
    // The provisional authentication provider has no approved session/revocation policy.
    throw new Error('PROVISIONAL_AUTH_NOT_ALLOWED_IN_PRODUCTION');
  }

  const portValue = env.PORT ?? '3000';
  const port = Number(portValue);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('CONFIGURATION_INVALID');
  }

  const provisionalSigningSecret = env.AUTH_PROVISIONAL_SIGNING_SECRET;
  if (!provisionalSigningSecret || provisionalSigningSecret.length < 32) {
    throw new Error('CONFIGURATION_INVALID');
  }

  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.trim().length < 1 || !/^postgres(?:ql)?:\/\//.test(databaseUrl)) {
    throw new Error('CONFIGURATION_INVALID');
  }
  return { environment, port, provisionalSigningSecret, databaseUrl };
}
