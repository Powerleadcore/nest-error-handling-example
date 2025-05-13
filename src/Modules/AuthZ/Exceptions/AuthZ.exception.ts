import { ErrorCategory, Exception, HttpCode } from "@Packages/ErrorHandler";

export class AuthZException extends Exception {
  constructor(message: string, payload: any) {
    super({
      category: ErrorCategory.AUTHORIZATION,
      scope: 'AuthZ',
      message,
      code: 'AUTHZ_ERROR',
      httpResponse: {
        status: HttpCode.FORBIDDEN,
        message: 'not authorized',
      },
      payload
    });
  }
}