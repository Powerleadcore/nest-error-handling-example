import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './Infrastructure/Env/validate';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSourceOptions } from './Infrastructure/Database/Config/datasource.option';
import { AsyncLocalStorage } from 'async_hooks';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtTokenService } from '@Modules/Identity/AuthN/Infrastructure/Services/JwtTokenService';
import { JwtModule } from '@nestjs/jwt';
import { HealthCheckModule } from '@Packages/Health/index.module';
import { AuthZ } from '@Modules/AuthZ/index.module';
import { LoggerModule } from '@Packages/Logger/index.module';

@Global()
@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      validate,
    }),
    AuthZ,
    JwtModule.register({}),
    TypeOrmModule.forRoot(AppDataSourceOptions),
    HealthCheckModule,
  ],
  providers: [
    JwtTokenService,
    {
      provide: AsyncLocalStorage,
      useValue: new AsyncLocalStorage(),
    },
  ],
  exports: [],
})
export class GlobalModule {}
