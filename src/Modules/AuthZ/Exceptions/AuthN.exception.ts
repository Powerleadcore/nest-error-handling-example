import { ErrorCategory, Exception, HttpCode } from "@Packages/ErrorHandler";
import { LogCategory } from "@Packages/Logger/Enums/logCategory.enum";
import { LogLevel } from "@Packages/Logger/Enums/logLevel";

export class AuthNException extends Exception {
  constructor(message: string, payload: any) {
    super({
      category: ErrorCategory.AUTHENTICATION,
      scope: 'AuthN',
      message,
      code: 'AUTHN_ERROR',
      httpResponse: {
        status: HttpCode.UNAUTHORIZED,
        message: 'not authenticated',
      },
      payload,
      log: true,
      logLevel: LogLevel.WARN,
      logCategory: LogCategory.SECURITY,
    });
  }
}