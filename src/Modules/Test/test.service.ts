import { Injectable } from '@nestjs/common';
import { Exception } from 'src/Packages/ErrorHandler/Domain/Aggragates/Exception';
import { ErrorCategory } from 'src/Packages/ErrorHandler/Domain/Enums/ErrorCategory';
import { HttpCode } from 'src/Packages/ErrorHandler/Domain/Enums/HttpCode';
import { LogLevel } from 'src/Packages/ErrorHandler/Domain/Enums/logLevel';

class ExampleCode extends Exception {
  constructor(payload: any = {}) {
    super({
      code: 'EXAMPLE_ERROR',
      message: 'Example Error',
      scope: 'Example',
      category: ErrorCategory.AUTHENTICATION,
      payload: payload,
      httpResponse: {
        status: HttpCode.MULTIPLE_CHOICES,
        message: 'Example Error Message',
        payload: payload,
      },
      log: true,
      logLevel: LogLevel.LOG,
    });
  }
}

class AuthZError extends Exception {
  constructor(
    userId: string,
    entity: string,
    action: string,
    accessLevel: string,
    entityId: string,
  ) {
    super({
      code: 'EXAMPLE_ERROR',
      message: 'Example Error',
      scope: 'Example',
      category: ErrorCategory.AUTHENTICATION,
      payload: {
        userId: userId,
        entity: entity,
        action: action,
        accessLevel: accessLevel,
        entityId: entityId,
      },
      httpResponse: {
        status: HttpCode.FORBIDDEN,
        message: 'Access Not Authorized',
      },
      log: true,
      logLevel: LogLevel.WARN,
    });
  }
}

@Injectable()
export class AppService {
  getHello(): string {
    throw new Error('weee');
    throw new AuthZError(
      crypto.randomUUID(),
      'user',
      'read',
      '*-rank',
      crypto.randomUUID(),
    );
    return 'Hello World!';
  }
}
