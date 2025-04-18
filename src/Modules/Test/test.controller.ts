import { Body, Controller, Get, HttpCode, Logger, Post } from '@nestjs/common';
import { AppService } from './test.service';
import { IsString, IsUUID } from 'class-validator';
import { Exclude, Expose } from 'class-transformer';

class DTOExample {
  @IsUUID()
  id: string;
  @IsString()
  name: string;
}
@Exclude()
class DTOExampleResponse {
  @Expose()
  id: string;
  @Expose()
  name: string;
  @Expose()
  password: string;
  constructor(id: string, name: string, password: string) {
    this.id = id;
    this.name = name;
    this.password = password;
  }
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post()
  @HttpCode(200)
  getHelloPost(@Body() DTOExample: DTOExample) {
    Logger.log('received Data', DTOExample, 'AppController');
    const res = new DTOExampleResponse(
      DTOExample.id,
      DTOExample.name,
      'password',
    );
    return { message: 'hello world', res };
    return this.appService.getHello();
  }
}
