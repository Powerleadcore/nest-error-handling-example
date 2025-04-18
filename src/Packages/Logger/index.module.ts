import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HttpMiddleware } from './Middlewares/HttpMiddleware';

@Global()
@Module({})
export class LoggerModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpMiddleware).forRoutes('*');
  }
}
