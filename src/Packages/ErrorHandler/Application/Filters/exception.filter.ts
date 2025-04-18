import { ArgumentsHost, Catch } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { handleException } from '../Helpers/handleException';
import { Logger } from 'src/Packages/Logger/Services/Logger.service';

@Catch()
export class GlobalExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: any, host: ArgumentsHost) {
    const error = handleException(exception, this.logger);
    if (host.getType() === 'http') {
      const { httpAdapter } = this.httpAdapterHost;
      const ctx = host.switchToHttp();
      httpAdapter.reply(
        ctx.getResponse(),
        {
          status: error.httpResponse.status,
          message: error.httpResponse.message,
          errors: error.httpResponse.payload,
        },
        error.httpResponse.status,
      );
    }
  }
}
