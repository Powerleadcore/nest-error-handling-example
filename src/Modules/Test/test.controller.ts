import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { AppService } from './test.service';
import { Public } from '@Packages/AuthZModule/Decorators/public.decorator';
import { AuthN } from '@Packages/AuthZModule/Decorators/authN.decorator';
import { HasPermission } from '@Packages/AuthZModule/Decorators/hasPermission';
import Resources from '@Modules/AuthZ/Enums/resources.enum';
import { UserAccessLevels, UserActions } from '@Modules/Identity/Users/user.authz.config';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Get()
  @AuthN()
  @HasPermission(Resources.USER, UserActions.READ)
  getHello() {
    return this.appService.getHello();
  }
  
  @Post()
  @Public()
  @HttpCode(200)
  getHelloPost() {
    return this.appService.getHello();
  }
}