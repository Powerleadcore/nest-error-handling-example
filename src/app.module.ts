import { Module } from '@nestjs/common';
import { TestModule } from './Modules/Test/test.module';

@Module({
  imports: [TestModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
