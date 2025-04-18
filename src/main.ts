import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './Packages/ErrorHandler';
import { Logger } from './Packages/Logger/Services/Logger.service';
import { TransformInterceptor } from './Packages/Common/Interceptors/TransformInterceptor';
import { CustomValidationPipe } from './Packages/Common/Pipes/ValidationPipe';
import { ClassSerializerInterceptor } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create(AppModule, {
    logger: logger,
  });

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
