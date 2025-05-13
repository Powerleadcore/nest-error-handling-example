import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './Packages/ErrorHandler';
import { Logger } from './Packages/Logger/Services/Logger.service';
import { TransformInterceptor } from './Packages/Common/Interceptors/TransformInterceptor';
import { CustomValidationPipe } from './Packages/Common/Pipes/ValidationPipe';
import { ClassSerializerInterceptor } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

async function bootstrap() {
  const logger = new Logger();
  const fastifyAdapter = new FastifyAdapter({
    logger: false, // enable logger for non-prod
    trustProxy: process.env.NODE_ENV === 'production',
    bodyLimit: 10 * 1024 * 1024, // 10MB
    disableRequestLogging: process.env.NODE_ENV === 'production',
    ignoreTrailingSlash: true,
    connectionTimeout: 30000,
    maxParamLength: 100,
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
    {
      rawBody: true,
      logger: logger,
    },
  );

  const reflector = app.get('Reflector') as Reflector;

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new TransformInterceptor(),
  );
  app.useGlobalPipes(new CustomValidationPipe());
  app.enableShutdownHooks();
  //get the HttpAdapterHost
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapter));
  await app.listen(3000, '0.0.0.0');
  logger.log('Application is running on: http://0.0.0.0:3000', 'Bootstrap');
}
bootstrap();
