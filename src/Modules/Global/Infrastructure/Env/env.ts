import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsInt, IsNotEmpty, IsString, Min, ValidateIf } from 'class-validator';

export enum NodeEnv {
  DEVELOPMENT = 'DEVELOPMENT',
  STAGING = 'STAGING',
  PRODUCTION = 'PRODUCTION',
  TEST = 'TEST',
}

export enum AppMode {
  API = 'API',
  CRON = 'CRON',
}

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  SERVICE_NAME: string;

  @IsEnum(NodeEnv, {
    message: 'NODE_ENV must be one of: development, staging, production, test',
  })
  NODE_ENV: NodeEnv;

  @IsIn(['API', 'CRON'], {
    message: 'APP_MODE must be either API or CRON',
  })
  APP_MODE: AppMode;

  // PORT is only required for API mode
  @ValidateIf((o: EnvironmentVariables) => o.APP_MODE === AppMode.API)
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  PORT?: number;

  // API_PREFIX is only required for API mode
  @ValidateIf((o: EnvironmentVariables) => o.APP_MODE === AppMode.API)
  @IsString()
  @IsNotEmpty()
  API_PREFIX?: string;

  // Database configuration
  @IsString()
  @IsNotEmpty()
  DB_URL: string;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  DB_SSL_ENABLE: boolean;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  DB_RUN_MIGRATIONS: boolean;

  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  DB_RETRY_DELAY: number;

  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  DB_RETRY_ATTEMPTS: number;

  // JWT configuration
  @IsString()
  @IsNotEmpty()
  AUTH_ACCESS_PRIVATE_KEY: string;

  @IsString()
  @IsNotEmpty()
  AUTH_ACCESS_PUBLIC_KEY: string;

  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  AUTH_ACCESS_EXPIRE: number;
}