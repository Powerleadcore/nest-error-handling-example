import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { ApiHealthCheckController } from './Presentation/api.controller';
import { DatabaseHealthIndicator } from './Application/Indicators/database.indicator';
import { TerminusModule } from '@nestjs/terminus';
import { HealthCheckService } from './Application/Services/health-check.service';

@Module({
  imports: [TerminusModule, TypeOrmModule],
  controllers: [ApiHealthCheckController],
  providers: [HealthCheckService, DatabaseHealthIndicator],
})
export class HealthCheckModule {}
