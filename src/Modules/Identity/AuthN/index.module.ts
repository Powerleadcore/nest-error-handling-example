import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthNService } from './Application/Services/authN.service';
import { AuthNController } from './Presentation/authN.controller';
import { UsersModule } from '../Users/index.module';
import { JwtTokenService } from './Infrastructure/Services/JwtTokenService';
import { HashService } from '@Shared/Infrastructure/Services/hash.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthNMiddleware } from './Application/Middlewares/JwtauthN.middleware';

@Module({
  imports: [JwtModule.register({}), UsersModule],
  controllers: [AuthNController],
  providers: [AuthNService, HashService, JwtTokenService],
  exports: [],
})
export class AuthNModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtAuthNMiddleware)
      .forRoutes('*');
  }
}
