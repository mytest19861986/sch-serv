import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import type { ContextualRequest } from './request-context.js';

const SAFE_CORRELATION_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{7,127}$/;

export function correlationMiddleware(request: Request, response: Response, next: NextFunction): void {
  const contextualRequest = request as ContextualRequest;
  const supplied = request.header('x-correlation-id');
  const correlationId = supplied && SAFE_CORRELATION_ID.test(supplied) ? supplied : randomUUID();
  contextualRequest.correlationId = correlationId;
  response.setHeader('x-correlation-id', correlationId);
  next();
}
