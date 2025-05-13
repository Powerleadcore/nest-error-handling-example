import * as dotenv from 'dotenv';
dotenv.config();
import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';

const getSSLConfig = () => {
  const sslEnabled = process.env.DB_SSL === 'true';
  return sslEnabled
    ? {
        rejectUnauthorized: false,
        ca: process.env.DB_SSL_CA || undefined,
      }
    : false;
};

const AppDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DB_URL,
  entities: [join(__dirname, '../../../../../', './**/*.schema{.ts,.js}')],
  migrations: [
    join(__dirname, '../../', './Database/Migrations/**/*{.ts,.js}'),
  ],
  migrationsTableName: 'migrations_table',
  synchronize: false,
  migrationsRun: process.env.DB_RUN_MIGRATIONS === 'true',
  logging: false,
  extra: {
    ssl: getSSLConfig(),
  },
};

const AppDataSource = new DataSource(AppDataSourceOptions);

export default AppDataSource;
