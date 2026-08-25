import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { ContextualRequest } from '../common/request-context.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { StudentsService } from './students.service.js';
import type { StudentsAuthorizationContext } from './students.policy.js';

@Controller('students')
@UseGuards(AuthGuard)
export class StudentsController {
  constructor(private readonly service: StudentsService) {}
  private context(request: ContextualRequest): StudentsAuthorizationContext { if (!request.principal) throw new UnauthorizedException(); return { principal: request.principal, correlationId: request.correlationId ?? 'unavailable' }; }
  @Post() create(@Req() request: ContextualRequest, @Body() body: unknown) { return this.service.create(this.context(request), body); }
  @Get() list(@Req() request: ContextualRequest, @Query('school_id') schoolId?: string) { if (!schoolId) throw new BadRequestException(); return this.service.list(this.context(request), schoolId); }
  @Get(':id') get(@Req() request: ContextualRequest, @Param('id') id: string, @Query('school_id') schoolId?: string) { if (!schoolId) throw new BadRequestException(); return this.service.get(this.context(request), id, schoolId); }
  @Patch(':id') update(@Req() request: ContextualRequest, @Param('id') id: string, @Query('school_id') schoolId: string | undefined, @Body() body: unknown) { if (!schoolId) throw new BadRequestException(); return this.service.update(this.context(request), id, schoolId, body); }
}
