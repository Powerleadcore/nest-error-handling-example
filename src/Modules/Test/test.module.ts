import { Module } from '@nestjs/common';
import { AppController } from './test.controller';
import { AppService } from './test.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class TestModule {}
