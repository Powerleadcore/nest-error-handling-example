import { config } from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

config();

const configService = new ConfigService();

const getSSLConfig = () => {
  const sslEnabled = configService.get('DB_SSL') === 'true';
  return sslEnabled
    ? {
        rejectUnauthorized: false,
        ca: configService.get<string>('DB_SSL_CA') || undefined,
      }
    : false;
};

const AppDataSourceOptions: TypeOrmModuleOptions = {
  type: 'postgres',
  url: configService.getOrThrow('DB_URL'),
  entities: [join(__dirname, '../../../../../', '**/*.schema.{ts,js}')],
  migrations: [
    join(__dirname, '../../', './Database/Migrations/**/*{.ts,.js}'),
  ],
  migrationsTableName: 'migrations_table',
  synchronize: false,
  migrationsRun: configService.get('DB_RUN_MIGRATIONS') === 'true',
  extra: {
    ssl: getSSLConfig(),
  },
  retryAttempts: parseInt(configService.get('DB_RETRY_ATTEMPTS') || '3', 10),
  retryDelay: parseInt(configService.get('DB_RETRY_DELAY') || '3000', 10),
};

export { AppDataSourceOptions };
