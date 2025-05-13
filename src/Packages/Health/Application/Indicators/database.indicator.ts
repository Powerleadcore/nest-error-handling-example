import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseHealthIndicator {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async isHealthy(): Promise<{ status: string; error?: string }> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'up' };
    } catch (error: any) {
      return {
        status: 'down',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error: `Database connection failed: ${error && error?.message ? error.message : ''}`,
      };
    }
  }
}
