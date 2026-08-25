import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ApiExceptionFilter } from './common/api-exception.filter.js';
import { correlationMiddleware } from './common/correlation.js';
import { StructuredLogger } from './common/structured-logger.js';
import { loadRuntimeConfig } from './config/runtime-config.js';

export async function createApplication() {
  const config = loadRuntimeConfig();
  const application = await NestFactory.create(AppModule, { logger: new StructuredLogger(), bodyParser: true });
  application.use(correlationMiddleware);
  application.useGlobalFilters(new ApiExceptionFilter());
  return { application, config };
}

async function bootstrap(): Promise<void> {
  const { application, config } = await createApplication();
  await application.listen(config.port);
}

if (process.env.NODE_ENV !== 'test') void bootstrap();
