import { Module } from '@nestjs/common';
import { GlobalModule } from './Modules/Global/index.module';
import { IndentityModule } from '@Modules/Identity/index.module';
import { TestModule } from '@Modules/Test/test.module';
import { AuthZ } from '@Modules/AuthZ/index.module';

@Module({
  imports: [GlobalModule, IndentityModule, TestModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
