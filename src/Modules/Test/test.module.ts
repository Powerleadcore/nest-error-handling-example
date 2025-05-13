import { Module } from '@nestjs/common';
import { AppController } from './test.controller';
import { AppService } from './test.service';
import { UsersModule } from '@Modules/Identity/Users/index.module';
@Module({
  imports: [UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class TestModule {}
