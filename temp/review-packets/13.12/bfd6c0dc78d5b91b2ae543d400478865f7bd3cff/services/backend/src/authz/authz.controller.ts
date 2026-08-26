import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { ContextualRequest } from '../common/request-context.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { AuthorizationGuard } from './authorization.guard.js';
import { RequirePolicy } from './authorization.js';

@Controller('authz')
@UseGuards(AuthGuard, AuthorizationGuard)
export class AuthorizationController {
  @Get('context')
  @RequirePolicy('authenticated')
  context(@Req() request: ContextualRequest): { subject: string; tenantId?: string } {
    return { subject: request.principal!.subject, tenantId: request.principal!.tenantId };
  }

  @Get('denied')
  @RequirePolicy('never')
  denied(): { unreachable: true } { return { unreachable: true }; }
}
