import { Logger } from '@nestjs/common';
import { Exception } from '../../Domain/Aggragates/Exception';
import { LogLevel } from '../../Domain/Enums/logLevel';

export function logException(exception: Exception, logger: Logger): void {
  if (exception.log) {
    switch (exception.logLevel) {
      case LogLevel.ERROR:
        logger.error(exception.toJSON());
        break;
      case LogLevel.WARN:
        logger.warn(exception.toJSON());
        break;
      case LogLevel.DEBUG:
        logger.debug(exception.toJSON());
        break;
      case LogLevel.VERBOSE:
        logger.verbose(exception.toJSON());
        break;
      case LogLevel.FATAL:
        logger.error(exception.toJSON());
        break;
      default:
        logger.log(exception.toJSON());
    }
  }
}
