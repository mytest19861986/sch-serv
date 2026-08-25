import { LoggerService } from '@nestjs/common';

type LogContext = string | Record<string, unknown> | undefined;

export class StructuredLogger implements LoggerService {
  log(message: unknown, context?: LogContext): void { this.write('info', message, context); }
  error(message: unknown, trace?: string, context?: LogContext): void { this.write('error', message, { trace, context }); }
  warn(message: unknown, context?: LogContext): void { this.write('warn', message, context); }
  debug(message: unknown, context?: LogContext): void { this.write('debug', message, context); }
  verbose(message: unknown, context?: LogContext): void { this.write('trace', message, context); }

  private write(level: string, message: unknown, context?: unknown): void {
    process.stdout.write(`${JSON.stringify({ level, message: String(message), context, timestamp: new Date().toISOString() })}\n`);
  }
}
