import { ErrorCategory, Exception, HttpCode } from 'src/Packages/ErrorHandler';

export class ValidationException extends Exception {
  constructor(errors: any[]) {
    super({
      code: 'VALIDATION_ERROR',
      message: 'Validation Error',
      scope: 'Validation',
      category: ErrorCategory.VALIDATION,
      httpResponse: {
        status: HttpCode.BAD_REQUEST,
        message: 'Validation Error',
        payload: errors,
      },
    });
  }
}
