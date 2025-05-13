import { AsyncLocalStorage } from 'async_hooks';
import { AuthZRegistry } from '../authz.registry';
import { Inject } from '@nestjs/common';
import { AUTH_Z_REQUEST_CONTEXT } from '../authz.constants';
import { ContextType } from '../Interfaces/context';
import {
  AuditLog,
  AccessLevelAuditLog,
  RelationshipAuditLog,
  ResourceActionAuditLog,
  PermissionAuditLog,
  BaseAuditLog
} from '../Interfaces/audit.interface';

export class AuthZService<Roles, RoleDefinition> {
  constructor(
    @Inject(AUTH_Z_REQUEST_CONTEXT) private readonly localStorage: AsyncLocalStorage<ContextType | undefined>,
  ) { }

  // Registry access methods
  getRoles(): Roles[] {
    return AuthZRegistry.getRoles() as Roles[];
  }

  getRoleDefinition(role: string): RoleDefinition | null {
    return AuthZRegistry.getRolesDefinitions().get(role) as RoleDefinition || null;
  }

  getRolesDefinitions(): Map<Roles, RoleDefinition> {
    return AuthZRegistry.getRolesDefinitions() as Map<Roles, RoleDefinition>;
  }

  getDefaultRole() {
    const defaultRole = AuthZRegistry.getDefaultRole();
    return {
      role: defaultRole as Roles | null,
      definition: defaultRole ? this.getRoleDefinition(defaultRole) : null,
    };
  }

  getResources(): string[] {
    return AuthZRegistry.getResources();
  }

  getResource(resource: string) {
    return AuthZRegistry.getResourceDefinition(resource);
  }

  getRoleInfo(role: string) {
    return AuthZRegistry.getRoleInfo(role);
  }

  currentContext<Context>(): Context | null {
    const context = this.localStorage?.getStore();
    return context ? context as Context : null;
  }

  // Core permission check methods
  getAccessLevel(resource: string, action: string): string[] | null {
    return this.executeAuthZOperation<string[] | null, AccessLevelAuditLog>(
      'getAccessLevel',
      resource,
      action,
      (context) => {
        const resourceDefinition = this.getResource(resource);
        if (!resourceDefinition) {
          return this.createResultWithAudit(null, {
            message: `Resource '${resource}' not found`,
            accessLevels: null
          } as AccessLevelAuditLog);
        }

        const rolePermissions = resourceDefinition.roles.get(context.role);
        if (!rolePermissions) {
          return this.createResultWithAudit(null, {
            message: `Role '${context.role}' has no permissions defined for resource '${resource}'`,
            accessLevels: null
          } as AccessLevelAuditLog);
        }

        const accessLevels = rolePermissions.permissions.get(action) || null;
        return this.createResultWithAudit(accessLevels, {
          message: accessLevels?.length
            ? `Access levels found: ${accessLevels.join(', ')}`
            : `No access levels found for action '${action}'`,
          accessLevels
        } as AccessLevelAuditLog);
      }
    );
  }

  canBe(resource: string, relationship: string): boolean {
    return this.executeAuthZOperation<boolean, RelationshipAuditLog>(
      'canBe',
      resource,
      relationship,
      (context) => {
        const resourceDefinition = this.getResource(resource);
        if (!resourceDefinition) {
          return this.createResultWithAudit(false, {
            message: `Resource '${resource}' not found`,
            relationship
          } as RelationshipAuditLog);
        }

        const rolePermissions = resourceDefinition.roles.get(context.role);
        if (!rolePermissions) {
          return this.createResultWithAudit(false, {
            message: `Role '${context.role}' has no permissions defined for resource '${resource}'`,
            relationship
          } as RelationshipAuditLog);
        }

        const hasRelationship = rolePermissions.relationships.has(relationship);
        return this.createResultWithAudit(hasRelationship, {
          message: hasRelationship
            ? `Relationship '${relationship}' is allowed for role '${context.role}'`
            : `Relationship '${relationship}' is not allowed for role '${context.role}'`,
          relationship
        } as RelationshipAuditLog);
      }
    );
  }

  can<Resource>(resourceName: string, action: string, resource: Resource): boolean {
    return this.executeAuthZOperation<boolean, ResourceActionAuditLog>(
      'can',
      resourceName,
      action,
      (context) => {
        const resourceDefinition = this.getResource(resourceName);
        if (!resourceDefinition) {
          return this.createResultWithAudit(false, {
            message: `Resource '${resourceName}' not found`,
            resourceId: 'unknown'
          } as ResourceActionAuditLog);
        }

        const resourceId = resource[resourceDefinition.identifier as unknown as keyof Resource];
        const rolePermissions = resourceDefinition.roles.get(context.role);
        if (!rolePermissions) {
          return this.createResultWithAudit(false, {
            message: `Role '${context.role}' has no permissions defined for resource '${resourceName}'`,
            resourceId: resourceId as string,
          } as ResourceActionAuditLog);
        }

        const accessLevels = rolePermissions.permissions.get(action);
        if (!accessLevels || accessLevels.length === 0) {
          return this.createResultWithAudit(false, {
            message: `No access levels defined for action '${action}' on resource '${resourceName}'`,
            resourceId: resourceId as string,
          } as ResourceActionAuditLog);
        }

        // Check each access level
        for (const acl of accessLevels) {
          const accessLevelFn = resourceDefinition.accessLevels.get(acl)?.fn;
          if (accessLevelFn && accessLevelFn(context, resource)) {
            return this.createResultWithAudit(true, {
              message: `Access granted through access level '${acl}'`,
              resourceId: resourceId as string,
            } as ResourceActionAuditLog);
          }
        }

        return this.createResultWithAudit(false, {
          message: `None of the access levels [${accessLevels.join(', ')}] granted permission`,
          resourceId: resourceId as string,
        } as ResourceActionAuditLog);
      }
    );
  }

  hasPermission(resourceName: string, action: string, accessLevels?: string[]): boolean {
    return this.executeAuthZOperation<boolean, PermissionAuditLog>(
      'hasPermission',
      resourceName,
      action,
      (context) => {
        const resource = this.getResource(resourceName);
        if (!resource) {
          return this.createResultWithAudit(false, {
            message: `Resource '${resourceName}' not found`
          } as PermissionAuditLog);
        }

        const rolePermissions = resource.roles.get(context.role);
        if (!rolePermissions) {
          return this.createResultWithAudit(false, {
            message: `Role '${context.role}' has no permissions defined for resource '${resourceName}'`
          } as PermissionAuditLog);
        }

        const permissions = rolePermissions.permissions.get(action);
        const hasPermission = !!permissions && permissions.length !== 0;

        if (!hasPermission) {
          return this.createResultWithAudit(false, {
            message: `Permission '${action}' not granted for role '${context.role}'`
          } as PermissionAuditLog);
        }

        // If specific access levels were requested, check if they exist and are valid
        if (accessLevels && Array.isArray(accessLevels) && accessLevels.length > 0) {
          // Validate that all requested access levels are defined for the resource
          const invalidAccessLevels = accessLevels.filter(acl => !resource.accessLevels.has(acl));
          if (invalidAccessLevels.length > 0) {
            return this.createResultWithAudit(false, {
              message: `Invalid access levels requested: [${invalidAccessLevels.join(', ')}]`
            } as PermissionAuditLog);
          }

          // Check if the role has all the specified access levels for this action
          const hasAllAccessLevels = accessLevels.every(acl => permissions!.includes(acl));
          return this.createResultWithAudit(hasAllAccessLevels, {
            message: hasAllAccessLevels
              ? `Requested access levels [${accessLevels.join(', ')}] are granted for action '${action}'`
              : `Not all requested access levels [${accessLevels.join(', ')}] are granted. Available: [${permissions!.join(', ')}]`
          } as PermissionAuditLog);
        }

        return this.createResultWithAudit(true, {
          message: `Permission '${action}' granted with access levels: [${permissions!.join(', ')}]`
        } as PermissionAuditLog);
      }
    );
  }

  // Helper methods
  private validateContext(): { context: ContextType | null; failReason?: string } {
    const context = this.localStorage?.getStore();
    if (!context) return { context: null, failReason: "No context found in local storage" };
    if (!context.role) return { context: null, failReason: "No role defined in context" };

    const globalChecks = AuthZRegistry.getGlobalChecks();
    for (const check of globalChecks) {
      if (!check.fn(context)) {
        return {
          context,
          failReason: `Global check failed: ${check.name} - ${check.message}`
        };
      }
    }

    return { context };
  }

  private createResultWithAudit<T, L extends AuditLog>(
    result: T,
    auditProps: Partial<L>
  ): { result: T; auditLog: L } {
    const auditLog = {
      ...auditProps,
      result: result ? 'allow' : 'deny'
    } as L;

    return { result, auditLog };
  }

  private executeAuthZOperation<T, L extends AuditLog>(
    method: string,
    resource: string,
    actionOrRelationship: string,
    operation: (context: ContextType) => { result: T; auditLog: L }
  ): T {
    // Validate context first
    const { context, failReason } = this.validateContext();

    // If context validation failed, return with failure
    if (failReason || !context) {
      const baseAudit: Partial<BaseAuditLog> = {
        method,
        resource,
        userId: context?.userId || 'unknown',
        result: 'deny',
        message: failReason || 'Context validation failed'
      };

      // Add action or relationship based on the method type
      const auditLog = {
        ...baseAudit,
        ...(method === 'hasPermission' || method === 'getAccessLevel' || method === 'can'
          ? { action: actionOrRelationship }
          : { relationship: actionOrRelationship })
      } as L;

      // Log and throw if needed
      this.handleAuditResult(auditLog);
      return null as T;
    }

    // Execute the operation with valid context
    const { result, auditLog } = operation(context);

    // Complete the audit log with common fields
    const completeAuditLog = {
      ...auditLog,
      method,
      resource,
      userId: context.userId,
    } as L;

    // Handle audit logging and throwing if needed
    this.handleAuditResult(completeAuditLog);
    return result;
  }

  private handleAuditResult<L extends AuditLog>(auditLog: L): void {
    if (AuthZRegistry.isLoggingEnabled()) {
      AuthZRegistry.getLogger()(auditLog);
    }

    if (auditLog.result === 'deny') {
      throw AuthZRegistry.getAuthZExceptionFunction()(auditLog);
    }
  }
}