import { Logger } from 'src/Packages/Logger/Services/Logger.service';
import { Exception } from '../../Domain/Aggragates/Exception';
import { LogLevel } from 'src/Packages/Logger/Enums/logLevel';

export function logException(exception: Exception, logger: Logger): void {
  if (exception.log) {
    switch (exception.logLevel) {
      case LogLevel.ERROR:
        logger.error(exception.message, exception.logException());
        break;
      case LogLevel.WARN:
        logger.warn(exception.message, exception.logException());
        break;
      case LogLevel.DEBUG:
        logger.debug(exception.message, exception.logException());
        break;
      case LogLevel.VERBOSE:
        logger.verbose(exception.message, exception.logException());
        break;
      case LogLevel.FATAL:
        logger.error(exception.message, exception.logException());
        break;
      default:
        logger.log(exception.message, exception.logException());
    }
  }
}
