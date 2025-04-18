import { Module } from '@nestjs/common';
import { TestModule } from './Modules/Test/test.module';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from './Packages/Logger/index.module';

@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    TestModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
