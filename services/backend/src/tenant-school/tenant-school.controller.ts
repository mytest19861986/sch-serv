import { Body, Controller, Get, Param, Patch, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { ContextualRequest } from '../common/request-context.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { TenantSchoolService } from './tenant-school.service.js';
import type { TenantSchoolAuthorizationContext } from './tenant-school.policy.js';

@Controller()
@UseGuards(AuthGuard)
export class TenantSchoolController {
  constructor(private readonly service: TenantSchoolService) {}
  private context(request: ContextualRequest): TenantSchoolAuthorizationContext { if (!request.principal) throw new UnauthorizedException(); return { principal: request.principal, correlationId: request.correlationId ?? 'unavailable' }; }
  @Post('tenants') createTenant(@Req() request: ContextualRequest, @Body() body: unknown) { return this.service.createTenant(this.context(request), body); }
  @Get('tenants/:id') getTenant(@Req() request: ContextualRequest, @Param('id') id: string) { return this.service.getTenant(this.context(request), id); }
  @Patch('tenants/:id') updateTenant(@Req() request: ContextualRequest, @Param('id') id: string, @Body() body: unknown) { return this.service.updateTenant(this.context(request), id, body); }
  @Post('schools') createSchool(@Req() request: ContextualRequest, @Body() body: unknown) { return this.service.createSchool(this.context(request), body); }
  @Get('schools/:id') getSchool(@Req() request: ContextualRequest, @Param('id') id: string) { return this.service.getSchool(this.context(request), id); }
  @Patch('schools/:id') updateSchool(@Req() request: ContextualRequest, @Param('id') id: string, @Body() body: unknown) { return this.service.updateSchool(this.context(request), id, body); }
}
