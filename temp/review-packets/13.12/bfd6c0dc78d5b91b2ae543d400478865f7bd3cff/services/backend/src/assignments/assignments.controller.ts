import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { ContextualRequest } from '../common/request-context.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { AssignmentsService } from './assignments.service.js';
import { isKind, type AssignmentKind } from './assignments.types.js';
import type { AssignmentsAuthorizationContext } from './assignments.policy.js';
@Controller()
@UseGuards(AuthGuard)
export class AssignmentsController { constructor(private readonly service:AssignmentsService){}
  private context(r:ContextualRequest):AssignmentsAuthorizationContext{if(!r.principal)throw new UnauthorizedException();return {principal:r.principal,correlationId:r.correlationId??'unavailable'};}
  private kind(path:string):AssignmentKind{const kind=path.startsWith('driver-')?'driver':path.startsWith('vehicle-')?'vehicle':path.startsWith('student-')?'student':undefined;if(!isKind(kind))throw new BadRequestException();return kind;}
  @Post('driver-service-assignments') createDriver(@Req()r:ContextualRequest,@Body()b:unknown){return this.service.create(this.context(r),'driver',b);}
  @Post('vehicle-service-assignments') createVehicle(@Req()r:ContextualRequest,@Body()b:unknown){return this.service.create(this.context(r),'vehicle',b);}
  @Post('student-service-assignments') createStudent(@Req()r:ContextualRequest,@Body()b:unknown){return this.service.create(this.context(r),'student',b);}
  @Get('driver-service-assignments') listDriver(@Req()r:ContextualRequest,@Query('tenant_id')t?:string){return this.service.list(this.context(r),'driver',t);}
  @Get('vehicle-service-assignments') listVehicle(@Req()r:ContextualRequest,@Query('tenant_id')t?:string){return this.service.list(this.context(r),'vehicle',t);}
  @Get('student-service-assignments') listStudent(@Req()r:ContextualRequest,@Query('tenant_id')t?:string){return this.service.list(this.context(r),'student',t);}
  @Get('driver-service-assignments/:id') getDriver(@Req()r:ContextualRequest,@Param('id')id:string){return this.service.get(this.context(r),'driver',id);}
  @Get('vehicle-service-assignments/:id') getVehicle(@Req()r:ContextualRequest,@Param('id')id:string){return this.service.get(this.context(r),'vehicle',id);}
  @Get('student-service-assignments/:id') getStudent(@Req()r:ContextualRequest,@Param('id')id:string){return this.service.get(this.context(r),'student',id);}
  @Patch('driver-service-assignments/:id') updateDriver(@Req()r:ContextualRequest,@Param('id')id:string,@Body()b:unknown){return this.service.update(this.context(r),'driver',id,b);}
  @Patch('vehicle-service-assignments/:id') updateVehicle(@Req()r:ContextualRequest,@Param('id')id:string,@Body()b:unknown){return this.service.update(this.context(r),'vehicle',id,b);}
  @Patch('student-service-assignments/:id') updateStudent(@Req()r:ContextualRequest,@Param('id')id:string,@Body()b:unknown){return this.service.update(this.context(r),'student',id,b);}
}
