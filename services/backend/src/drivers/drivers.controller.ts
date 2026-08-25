import { Body, Controller, Get, Param, Patch, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { ContextualRequest } from '../common/request-context.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { DriversService } from './drivers.service.js';
import type { DriversAuthorizationContext } from './drivers.policy.js';

@Controller('drivers')
@UseGuards(AuthGuard)
export class DriversController {
  constructor(private readonly service: DriversService) {}
  private context(request: ContextualRequest): DriversAuthorizationContext { if (!request.principal) throw new UnauthorizedException(); return { principal: request.principal, correlationId: request.correlationId ?? 'unavailable' }; }
  @Post() create(@Req() request: ContextualRequest, @Body() body: unknown) { return this.service.create(this.context(request), body); }
  @Get() list(@Req() request: ContextualRequest, @Query('tenant_id') tenantId?: string) { return this.service.list(this.context(request), tenantId); }
  @Get(':id') get(@Req() request: ContextualRequest, @Param('id') id: string) { return this.service.get(this.context(request), id); }
  @Patch(':id') update(@Req() request: ContextualRequest, @Param('id') id: string, @Body() body: unknown) { return this.service.update(this.context(request), id, body); }
}
