import { RolesDefinitions } from './roles-definitions.type';
import { ContextResolver } from './context-resolver';
import { ContextType } from './context';
import { GlobalCheck } from './global-checks';
import { AuditLog } from './audit.interface';

export interface AuthZRootOptions<
  Roles extends string | number | symbol,
  RoleDefinition extends object,
  Context extends ContextType,
> {
  roles: RolesDefinitions<Roles, RoleDefinition>;
  default: Roles;
  resources: Record<string,string>;
  contextResolver: ContextResolver<Context>;
  globalChecks: GlobalCheck<Context>[];
  log?: boolean;
  logger?: (result: AuditLog) => void;
  authNException?: (result: AuditLog) => object;
  authZException?: (result: AuditLog) => object;
}