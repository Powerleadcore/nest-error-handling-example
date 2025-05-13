import { Controller, Get } from '@nestjs/common';
import { HealthCheck } from '@nestjs/terminus';
import { HealthCheckService } from '../Application/Services/health-check.service';
import { Public } from '@Packages/AuthZModule/Decorators/public.decorator';

@Controller('health')
export class ApiHealthCheckController {
  constructor(private healthCheckService: HealthCheckService) {}

  @Get()
  @Public()
  @HealthCheck()
  async check() {
    return await this.healthCheckService.check();
  }
}
