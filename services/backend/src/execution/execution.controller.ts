import { Body, Controller, Get, Param, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { ContextualRequest } from '../common/request-context.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { ExecutionService } from './execution.service.js';
import type { ExecutionAuthorizationContext } from './execution.policy.js';

@Controller('driver')
@UseGuards(AuthGuard)
export class ExecutionController {
  constructor(private readonly service: ExecutionService) {}
  private context(request: ContextualRequest): ExecutionAuthorizationContext { if (!request.principal) throw new UnauthorizedException(); return { principal: request.principal, correlationId: request.correlationId ?? 'unavailable' }; }
  @Get('active-services') activeServices(@Req() request: ContextualRequest) { return this.service.activeServices(this.context(request)); }
  @Get('services/:serviceInstanceId/transport-state') transportState(@Req() request: ContextualRequest, @Param('serviceInstanceId') id: string) { return this.service.transportState(this.context(request), id); }
  @Get('services/:serviceInstanceId/roster') roster(@Req() request: ContextualRequest, @Param('serviceInstanceId') id: string) { return this.service.roster(this.context(request), id); }
  @Post('services/:serviceInstanceId/start') start(@Req() request: ContextualRequest, @Param('serviceInstanceId') id: string, @Body() body: unknown) { return this.service.start(this.context(request), id, body); }
}
