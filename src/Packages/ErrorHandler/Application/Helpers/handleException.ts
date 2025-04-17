import { Logger } from '@nestjs/common';
import { Exception } from '../../Domain/Aggragates/Exception';
import { UnknownException } from '../Exception/Unknown.exception';
import { logException } from './logException';

export function handleException(exception: any, logger: Logger): Exception {
  let error: Exception;
  if (exception instanceof Exception) {
    error = exception;
    delete error.stack;
  } else {
    if (exception instanceof Error) {
      error = new UnknownException({
        name: exception.name,
        message: exception.message,
        stack: exception.stack,
      });
    } else {
      error = new UnknownException({
        errors: [exception],
      });
    }
  }
  logException(error, logger);
  return error;
}
