import { Injectable } from '@nestjs/common';
import { DatabaseHealthIndicator } from '../Indicators/database.indicator';

@Injectable()
export class HealthCheckService {
  constructor(private databaseHealthIndicator: DatabaseHealthIndicator) {}

  async check() {
    const healthChecks = {
      database: await this.databaseHealthIndicator.isHealthy(),
      uptime: this.getUptime(),
      memoryUsage: this.getMemoryUsage(),
    };

    const isHealthy = Object.values(healthChecks).every(
      (check) => check.status === 'up',
    );

    return {
      status: isHealthy ? 'ok' : 'error',
      details: {},
    };
  }

  private getUptime(): { status: string; uptime: number } {
    const uptime = process.uptime();
    return {
      status: 'up',
      uptime,
    };
  }

  private getMemoryUsage(): { status: string; memory: NodeJS.MemoryUsage } {
    const memoryUsage = process.memoryUsage();
    return {
      status: 'up',
      memory: memoryUsage,
    };
  }
}
