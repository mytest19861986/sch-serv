import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { ContextualRequest } from '../common/request-context.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { TenantSchoolService } from './tenant-school.service.js';

@Controller()
@UseGuards(AuthGuard)
export class TenantSchoolController {
  constructor(private readonly service: TenantSchoolService) {}
  @Post('tenants') createTenant(@Req() request: ContextualRequest, @Body() body: unknown) { return this.service.createTenant(request, body); }
  @Get('tenants/:id') getTenant(@Req() request: ContextualRequest, @Param('id') id: string) { return this.service.getTenant(request, id); }
  @Patch('tenants/:id') updateTenant(@Req() request: ContextualRequest, @Param('id') id: string, @Body() body: unknown) { return this.service.updateTenant(request, id, body); }
  @Post('schools') createSchool(@Req() request: ContextualRequest, @Body() body: unknown) { return this.service.createSchool(request, body); }
  @Get('schools/:id') getSchool(@Req() request: ContextualRequest, @Param('id') id: string) { return this.service.getSchool(request, id); }
  @Patch('schools/:id') updateSchool(@Req() request: ContextualRequest, @Param('id') id: string, @Body() body: unknown) { return this.service.updateSchool(request, id, body); }
}
