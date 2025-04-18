import { Injectable } from '@nestjs/common';
import { Exception } from 'src/Packages/ErrorHandler/Domain/Aggragates/Exception';
import { ErrorCategory } from 'src/Packages/ErrorHandler/Domain/Enums/ErrorCategory';
import { HttpCode } from 'src/Packages/ErrorHandler/Domain/Enums/HttpCode';
import { LogCategory } from 'src/Packages/Logger/Enums/logCategory.enum';
import { LogLevel } from 'src/Packages/Logger/Enums/logLevel';

class AuthZError extends Exception {
  constructor(
    userId: string,
    entity: string,
    action: string,
    accessLevel: string,
    entityId: string,
  ) {
    super({
      code: 'USER_AUTHZ_ERROR',
      message: `user with id ${userId} is not authorized to ${action} ${entity} with id ${entityId}`,
      scope: 'UsersAuthZ',
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
      logCategory: LogCategory.SECURITY,
    });
  }
}

@Injectable()
export class AppService {
  getHello(): string {
    // throw new AuthZError(
    //   crypto.randomUUID(),
    //   'user',
    //   'read',
    //   '*-rank',
    //   crypto.randomUUID(),
    // );
    return 'Hello World!';
  }
}
