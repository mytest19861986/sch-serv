export type RuntimeEnvironment = 'development' | 'test' | 'production';

export interface RuntimeConfig {
  readonly environment: RuntimeEnvironment;
  readonly port: number;
  readonly provisionalSigningSecret: string;
}

export function loadRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const environment = env.APP_ENV ?? 'development';
  if (environment !== 'development' && environment !== 'test' && environment !== 'production') {
    throw new Error('CONFIGURATION_INVALID');
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

  return { environment, port, provisionalSigningSecret };
}
