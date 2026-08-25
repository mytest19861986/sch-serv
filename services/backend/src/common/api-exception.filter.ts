import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import type { ContextualRequest } from './request-context.js';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<ContextualRequest>();
    const response = context.getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const code = this.codeFor(status);
    response.status(status).json({
      error: {
        code,
        message: this.messageFor(code),
        correlation_id: request.correlationId ?? 'unavailable'
      }
    });
  }

  private codeFor(status: number): string {
    if (status === HttpStatus.UNAUTHORIZED) return 'AUTHENTICATION_REQUIRED';
    if (status === HttpStatus.FORBIDDEN) return 'ACCESS_DENIED';
    if (status === HttpStatus.BAD_REQUEST) return 'VALIDATION_ERROR';
    if (status === HttpStatus.SERVICE_UNAVAILABLE) return 'SERVICE_UNAVAILABLE';
    return 'INTERNAL_ERROR';
  }

  private messageFor(code: string): string {
    const messages: Record<string, string> = {
      AUTHENTICATION_REQUIRED: 'Authentication is required.',
      ACCESS_DENIED: 'Access is denied.',
      VALIDATION_ERROR: 'The request is invalid.',
      SERVICE_UNAVAILABLE: 'The service is temporarily unavailable.',
      INTERNAL_ERROR: 'An unexpected error occurred.'
    };
    return messages[code] ?? messages.INTERNAL_ERROR ?? 'An unexpected error occurred.';
  }
}
