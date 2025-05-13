import { Global, Logger, Module } from "@nestjs/common";
import { AuthZModule } from "@Packages/AuthZModule";
import rolesDefinition from "./Definitions/roles.definitions";
import Roles from "./Enums/roles.enums";
import Resources from "./Enums/resources.enum";
import RoleDefinition from "./Interfaces/roleDefinition";
import { Context } from './Interfaces/context';
import { LogCategory } from "@Packages/Logger/Enums/logCategory.enum";
import { AuthZException } from "./Exceptions/AuthZ.exception";
import { AuthNException } from "./Exceptions/AuthN.exception";



@Global()
@Module({
  imports: [
    AuthZModule.forRoot<Roles, RoleDefinition, Context>({
      roles: rolesDefinition,
      default: Roles.SELLER,
      resources: Resources,
      globalChecks: [{
        name: "ActiveAccount",
        message: "account is not active",
        fn: (context) => context.isActive,
      }],
      contextResolver: (ctx): Context | null => {
        const request = ctx.switchToHttp().getRequest();
        const context = request.context || request.raw?.context || (request as any).context;
        return context || null;
      },
      log: true,
      logger: (result) => {
        if (result.result === 'deny') {
          Logger.warn(result.message, { payload:result, category: LogCategory.SECURITY }, 'AuthZModule');
        } else {
          Logger.log(result.message, { payload:result, category: LogCategory.SECURITY }, 'AuthZModule');
        }
      },
      authZException: (result) => {
        return new AuthZException(result.message, result);
      },
      authNException: (result) => {
        return new AuthNException(result.message, result);
      }
    }),
  ],
  exports: [
    AuthZModule,
  ],
})
export class AuthZ { }