import { Body, Controller, Get, Param, Patch, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { ContextualRequest } from '../common/request-context.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { ParentsService } from './parents.service.js';
import type { ParentsAuthorizationContext } from './parents.policy.js';
@Controller()
@UseGuards(AuthGuard)
export class ParentsController {
  constructor(private readonly service:ParentsService){}
  private c(r:ContextualRequest):ParentsAuthorizationContext{if(!r.principal)throw new UnauthorizedException();return{principal:r.principal,correlationId:r.correlationId??'unavailable'};}
  @Post('guardians') create(@Req()r:ContextualRequest,@Body()b:unknown){return this.service.create(this.c(r),b);}
  @Get('guardians') list(@Req()r:ContextualRequest,@Query('tenant_id')t?:string){return this.service.list(this.c(r),t);}
  @Get('guardians/:id') get(@Req()r:ContextualRequest,@Param('id')id:string){return this.service.get(this.c(r),id);}
  @Patch('guardians/:id') update(@Req()r:ContextualRequest,@Param('id')id:string,@Body()b:unknown){return this.service.update(this.c(r),id,b);}
  @Post('student-guardian-relationships') link(@Req()r:ContextualRequest,@Body()b:unknown){return this.service.link(this.c(r),b);}
  @Get('me/children') children(@Req()r:ContextualRequest){return this.service.children(this.c(r));}
}
