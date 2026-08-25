import { Body, Controller, Get, Param, Patch, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { ContextualRequest } from '../common/request-context.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { UsersService } from './users.service.js';
import type { UsersAuthorizationContext } from './users.policy.js';

@Controller()
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}
  private context(request: ContextualRequest): UsersAuthorizationContext { if (!request.principal) throw new UnauthorizedException(); return { principal: request.principal, correlationId: request.correlationId ?? 'unavailable' }; }
  @Post('users') createUser(@Req() request: ContextualRequest, @Body() body: unknown) { return this.service.createUser(this.context(request), body); }
  @Get('users') listUsers(@Req() request: ContextualRequest) { return this.service.listUsers(this.context(request)); }
  @Get('users/:id') getUser(@Req() request: ContextualRequest, @Param('id') id: string) { return this.service.getUser(this.context(request), id); }
  @Patch('users/:id') updateUser(@Req() request: ContextualRequest, @Param('id') id: string, @Body() body: unknown) { return this.service.updateUser(this.context(request), id, body); }
  @Post('tenant-memberships') createMembership(@Req() request: ContextualRequest, @Body() body: unknown) { return this.service.createMembership(this.context(request), body); }
  @Get('tenant-memberships') listMemberships(@Req() request: ContextualRequest) { return this.service.listMemberships(this.context(request)); }
  @Get('tenant-memberships/:id') getMembership(@Req() request: ContextualRequest, @Param('id') id: string) { return this.service.getMembership(this.context(request), id); }
  @Patch('tenant-memberships/:id') updateMembership(@Req() request: ContextualRequest, @Param('id') id: string, @Body() body: unknown) { return this.service.updateMembership(this.context(request), id, body); }
  @Post('role-assignments') createRoleAssignment(@Req() request: ContextualRequest, @Body() body: unknown) { return this.service.createRoleAssignment(this.context(request), body); }
  @Get('role-assignments') listRoleAssignments(@Req() request: ContextualRequest) { return this.service.listRoleAssignments(this.context(request)); }
  @Get('role-assignments/:id') getRoleAssignment(@Req() request: ContextualRequest, @Param('id') id: string) { return this.service.getRoleAssignment(this.context(request), id); }
  @Patch('role-assignments/:id') updateRoleAssignment(@Req() request: ContextualRequest, @Param('id') id: string, @Body() body: unknown) { return this.service.updateRoleAssignment(this.context(request), id, body); }
}
