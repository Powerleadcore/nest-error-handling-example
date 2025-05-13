import { Global, Module } from '@nestjs/common';
import { UsersModule } from './Users/index.module';
import { AuthNModule } from './AuthN/index.module';

@Global()
@Module({
  imports: [UsersModule, AuthNModule],
})
export class IndentityModule {}
