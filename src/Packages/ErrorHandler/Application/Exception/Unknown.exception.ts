import { LogLevel } from 'src/Packages/Logger/Enums/logLevel';
import { Exception } from '../../Domain/Aggragates/Exception';
import { ErrorCategory } from '../../Domain/Enums/ErrorCategory';
import { HttpCode } from '../../Domain/Enums/HttpCode';

export class UnknownException extends Exception {
  constructor(props: {
    name?: string;
    stack?: string;
    errors?: any[];
    payload?: any;
    message?: string;
  }) {
    super({
      code: 'UNKNOWN_ERROR',
      message: 'Unknown Error',
      scope: 'Global',
      category: ErrorCategory.SYSTEM,
      errors: props.errors,
      payload: props.payload,
      httpResponse: {
        status: HttpCode.INTERNAL_SERVER_ERROR,
        message: 'Something Went Wrong Please Try Again Later',
      },
      log: true,
      logLevel: LogLevel.ERROR,
    });
    if (props.name) {
      this.name = props.name;
    }
    if (props.message) {
      this.message = props.message;
    }
    this.stack = props.stack;
  }
}
