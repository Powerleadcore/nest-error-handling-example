import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import {
  AuthZRegistryError,
  RoleNotFoundError,
  ResourceNotFoundError,
  InvalidResourceDefinitionError,
  ConfigValidationError
} from "./Exceptions/authz.exceptions";
import { AccessLevelResolver } from "./Interfaces/access-level-resolver";
import { GlobalCheck } from "./Interfaces/global-checks";
import { ResourceDefinition } from "./Interfaces/resource-definition.interface";
import { ResourceMetadata } from "./Interfaces/resource-metadata.interface";
import { ResourcePermissions } from "./Interfaces/resource-permissions.interfaces";
import { RoleDefinition } from "./Interfaces/role-definition";
import { RoleInfo } from "./Interfaces/role-info";
import { AuditLog } from "./Interfaces/audit.interface";
import { AuthZRootOptions } from "./Interfaces/authz-root-options.interface";
import { AuthZFeatureOptions } from "./Interfaces/authz-feature-options.interface";

export class AuthZRegistry {
  private static readonly rolesDefinitions = new Map<string, RoleDefinition>();
  private static readonly resourcesDefinitions = new Map<string, ResourceMetadata | null>();
  private static readonly resourcesByRole = new Map<string, Set<string>>();
  private static defaultRole: string | null = null;
  private static globalChecks: GlobalCheck<any>[] = [];
  private static log = false;
  private static logger: (result: AuditLog) => void = console.log;
  private static authNException: (result: AuditLog) => object = () =>
    new UnauthorizedException('Not Authenticated');
  private static authZException: (result: AuditLog) => object = () =>
    new ForbiddenException('Access Not Authorized');
  // Configuration validators
  private static validateString(value: any, name: string): void {
    if (!value || typeof value !== 'string' || value.trim() === '') {
      throw new ConfigValidationError(`${name} must be a non-empty string`);
    }
  }

  private static validateFunction(value: any, name: string): void {
    if (typeof value !== 'function') {
      throw new ConfigValidationError(`${name} must be a function`);
    }
  }

  private static validateBoolean(value: any, name: string): void {
    if (typeof value !== 'boolean') {
      throw new ConfigValidationError(`${name} must be a boolean`);
    }
  }

  private static validateObject(value: any, name: string): void {
    if (!value || typeof value !== 'object') {
      throw new ConfigValidationError(`${name} must be a valid object`);
    }
  }

  // Logging configuration
  static setLogging(enabled: boolean): void {
    this.validateBoolean(enabled, 'Logging flag');
    this.log = enabled;
  }

  static isLoggingEnabled(): boolean {
    return this.log;
  }

  static setLogger(loggerFn: (result: AuditLog) => void): void {
    this.validateFunction(loggerFn, 'Logger');
    this.logger = loggerFn;
  }

  static getLogger(): (result: AuditLog) => void {
    return this.logger;
  }

  // Error handling
  static setAuthNExceptionFunction(throwFn: (result: AuditLog) => object): void {
    this.validateFunction(throwFn, 'Authentication Exception Function');
    this.authNException = throwFn;
  }

  static getAuthNExceptionFunction(): (result: AuditLog) => object {
    return this.authNException;
  }

  static setAuthZExceptionFunction(throwFn: (result: AuditLog) => object): void {
    this.validateFunction(throwFn, 'Authorization Exception Function');
    this.authZException = throwFn;
  }

  static getAuthZExceptionFunction(): (result: AuditLog) => object {
    return this.authZException;
  }


  // Global checks
  static setGlobalChecks(checks: GlobalCheck<any>[]): void {
    if (!Array.isArray(checks)) {
      throw new ConfigValidationError('Global checks must be an array');
    }

    for (const check of checks) {
      this.validateString(check.name, 'Global check name');
      this.validateFunction(check.fn, 'Global check function');
      this.validateString(check.message, 'Global check message');
    }
    this.globalChecks = checks;
  }

  static getGlobalChecks(): GlobalCheck<any>[] {
    return this.globalChecks;
  }

  // Role management
  static setDefaultRole(role: string, force = false): void {
    this.validateString(role, 'Role identifier');

    if (!this.defaultRole || force) {
      if (this.rolesDefinitions.has(role)) {
        this.defaultRole = role;
      } else {
        throw new RoleNotFoundError(role);
      }
    }
  }

  static getDefaultRole(): string | null {
    return this.defaultRole;
  }

  static addRole(role: string, roleDefinition: RoleDefinition): void {
    this.validateString(role, 'Role identifier');
    this.validateObject(roleDefinition, 'Role definition');

    if (!this.rolesDefinitions.has(role)) {
      this.rolesDefinitions.set(role, roleDefinition);
      this.resourcesByRole.set(role, new Set<string>());
    }
  }

  static getRoles(): string[] {
    return Array.from(this.rolesDefinitions.keys());
  }

  static getRolesDefinitions(): Map<string, RoleDefinition> {
    return this.rolesDefinitions;
  }

  // Resource management
  static addResource(
    resource: string,
    resourceDefinition: ResourceDefinition<any, any, any, any, any, any> | null,
  ): void {
    this.validateString(resource, 'Resource identifier');

    // Handle case when resource is not already registered
    if (!this.resourcesDefinitions.has(resource)) {
      if (resourceDefinition === null) {
        this.resourcesDefinitions.set(resource, null);
        return;
      }
      throw new ResourceNotFoundError(resource);
    }

    // Handle case when resource is already registered
    if (resourceDefinition === null) {
      throw new InvalidResourceDefinitionError(
        resource,
        "Definition can't be null because the resource is already registered."
      );
    }

    this.validateAndRegisterResourceDefinition(resource, resourceDefinition);
  }

  private static validateAndRegisterResourceDefinition(
    resource: string,
    definition: ResourceDefinition<any, any, any, any, any, any>
  ): void {
    if (typeof definition.identifier !== 'string') {
      throw new InvalidResourceDefinitionError(
        resource,
        'Resource definition must have an identifier'
      );
    }

    try {
      const {
        actionsSet,
        relationshipsSet,
        accessLevelsMap
      } = this.validateResourceComponentsAndCreateMaps(resource, definition);

      const rolesMap = this.buildRolesPermissionsMap(
        resource,
        definition,
        actionsSet,
        relationshipsSet,
        accessLevelsMap
      );

      // Store the validated resource definition
      this.resourcesDefinitions.set(resource, {
        identifier: definition.identifier,
        actions: actionsSet,
        accessLevels: accessLevelsMap,
        relationships: relationshipsSet,
        roles: rolesMap
      });
    } catch (error) {
      // Rethrow AuthZRegistryErrors as-is
      if (error instanceof AuthZRegistryError) {
        throw error;
      }
      // Wrap other errors
      throw new AuthZRegistryError(`Error processing resource "${resource}": ${error.message}`);
    }
  }

  private static validateResourceComponentsAndCreateMaps(
    resource: string,
    definition: ResourceDefinition<any, any, any, any, any, any>
  ) {
    // Create sets to store valid actions, accessLevels, and relationships
    const actionsSet = new Set<string>(Object.values(definition.actions));
    const relationshipsSet = new Set<string>(Object.values(definition.relationships));
    const accessLevelsMap = new Map<string, { fn: AccessLevelResolver<any, any>, priority: number }>();

    // Validate and store access levels
    for (const [key, accessLevel] of Object.entries(definition.accessLevels)) {
      if (typeof accessLevel.fn !== 'function') {
        throw new InvalidResourceDefinitionError(
          resource,
          `Access level resolver "${key}" must be a function that returns a boolean`
        );
      }
      if (typeof accessLevel.priority !== 'number' || accessLevel.priority < 0) {
        throw new InvalidResourceDefinitionError(
          resource,
          `Access level priority "${key}" must be a non-negative number`
        );
      }
      accessLevelsMap.set(key, accessLevel);
    }

    return { actionsSet, relationshipsSet, accessLevelsMap };
  }

  private static buildRolesPermissionsMap(
    resource: string,
    definition: ResourceDefinition<any, any, any, any, any, any>,
    actionsSet: Set<string>,
    relationshipsSet: Set<string>,
    accessLevelsMap: Map<string, { fn: AccessLevelResolver<any, any>, priority: number }>
  ) {
    const rolesMap = new Map<string, ResourcePermissions>();

    // Validate and store each role's permissions and relationships
    for (const [role, roleConfig] of Object.entries(definition.roles)) {
      // Skip if role is not defined in the registry
      if (!this.rolesDefinitions.has(role)) {
        throw new RoleNotFoundError(role);
      }

      const permissionsMap = this.validateActionsAndAccessLevels(
        resource,
        role,
        roleConfig.permissions,
        actionsSet,
        accessLevelsMap
      );

      const roleRelationships = this.validateRelationships(
        resource,
        roleConfig.relationships,
        relationshipsSet
      );

      rolesMap.set(role, {
        permissions: permissionsMap,
        relationships: roleRelationships
      });

      // Update the resource-by-role lookup for better performance
      this.updateResourceRoleIndex(role, resource);
    }

    return rolesMap;
  }

  private static validateActionsAndAccessLevels(
    resource: string,
    role: string,
    permissions: Record<string, string[]>,
    actionsSet: Set<string>,
    accessLevelsMap: Map<string, { fn: AccessLevelResolver<any, any>, priority: number }>
  ) {
    const permissionsMap = new Map<string, string[]>();

    for (const [action, accessLevels] of Object.entries(permissions)) {
      // Check if action is valid
      if (!actionsSet.has(action)) {
        throw new InvalidResourceDefinitionError(
          resource,
          `Action "${action}" is not defined for this resource`
        );
      }

      // Check if all access levels are valid
      for (const accessLevel of accessLevels) {
        if (!accessLevelsMap.has(accessLevel as string)) {
          throw new InvalidResourceDefinitionError(
            resource,
            `Access level "${accessLevel}" is not defined for this resource`
          );
        }
      }

      // Store the permissions in the map
      permissionsMap.set(action, accessLevels as string[]);
    }

    return permissionsMap;
  }

  private static validateRelationships(
    resource: string,
    relationships: string[],
    relationshipsSet: Set<string>
  ) {
    const roleRelationships = new Set<string>();

    // Validate and store relationships
    for (const relationship of relationships) {
      if (!relationshipsSet.has(relationship as string)) {
        throw new InvalidResourceDefinitionError(
          resource,
          `Relationship "${relationship}" is not defined for this resource`
        );
      }
      roleRelationships.add(relationship as string);
    }

    return roleRelationships;
  }

  private static updateResourceRoleIndex(role: string, resource: string) {
    if (!this.resourcesByRole.has(role)) {
      this.resourcesByRole.set(role, new Set<string>());
    }
    this.resourcesByRole.get(role)!.add(resource);
  }

  static getResources(): string[] {
    return Array.from(this.resourcesDefinitions.keys());
  }

  static getResourceDefinition(resource: string): ResourceMetadata | null {
    this.validateString(resource, 'Resource identifier');

    if (this.resourcesDefinitions.has(resource)) {
      return this.resourcesDefinitions.get(resource)!;
    }
    return null;
  }

  static getRoleInfo(role: string): RoleInfo | null {
    this.validateString(role, 'Role identifier');

    // Check if the role exists in the registry
    if (!this.rolesDefinitions.has(role)) {
      return null;
    }

    return this.buildRoleInfo(role);
  }

  private static buildRoleInfo(role: string): RoleInfo {
    // Get the role definition
    const roleDefinition = this.rolesDefinitions.get(role)!;

    // Create an object to store permissions for each resource
    const permissions: Record<string, {
      actions: Map<string, string[]>;
      relationships: Set<string>;
    }> = {};

    // Use the resourcesByRole index for better performance
    const resources = this.resourcesByRole.get(role) || new Set<string>();

    for (const resourceName of resources) {
      const resourceDef = this.resourcesDefinitions.get(resourceName);

      // Skip null or undefined resource definitions
      if (!resourceDef) {
        continue;
      }

      // Check if this role has permissions for this resource
      if (resourceDef.roles.has(role)) {
        const roleResourcePermissions = resourceDef.roles.get(role)!;

        // Add the resource permissions to the result
        permissions[resourceName] = {
          actions: roleResourcePermissions.permissions,
          relationships: roleResourcePermissions.relationships
        };
      }
    }

    // Return the complete role information
    return {
      role,
      roleDefinition,
      permissions
    };
  }

  static InitRegistry(options: AuthZRootOptions<any, any, any>) {
    try {
      this.validateRootOptions(options);

      // Add roles
      Object.keys(options.roles).forEach((role) => {
        this.addRole(role, options.roles[role as keyof typeof options.roles]);
      });

      // Add resources
      Object.keys(options.resources).forEach((resource) => {
        this.addResource(resource, null);
      });

      // Configure settings
      this.setDefaultRole(options.default as string);
      this.setGlobalChecks(options.globalChecks);

      if (options.log !== undefined) {
        this.setLogging(options.log);
      }

      if (options.authNException) {
        this.setAuthNExceptionFunction(options.authNException);
      }

      if (options.authZException) {
        this.setAuthZExceptionFunction(options.authZException);
      }

      if (options.logger) {
        this.setLogger(options.logger);
      }
    } catch (error) {
      if (error instanceof AuthZRegistryError) {
        throw new Error(`AuthZ configuration failed: ${error.message}`);
      }
      throw error;
    }
  }

  private static validateRootOptions(options: AuthZRootOptions<any, any, any>): void {
    // Validate required fields
    if (!options.roles || typeof options.roles !== 'object') {
      throw new ConfigValidationError('Roles definition is required and must be an object');
    }

    if (!options.default) {
      throw new ConfigValidationError('Default role is required');
    }

    if (!options.resources || typeof options.resources !== 'object') {
      throw new ConfigValidationError('Resources definition is required and must be an object');
    }

    if (!options.contextResolver || typeof options.contextResolver !== 'function') {
      throw new ConfigValidationError('Context resolver is required and must be a function');
    }

    // Validate globalChecks
    if (!Array.isArray(options.globalChecks)) {
      throw new ConfigValidationError('Global checks must be an array');
    }
  }

  static InitResources(options: AuthZFeatureOptions) {
    if (!options.resources || !Array.isArray(options.resources)) {
      throw new ConfigValidationError('Resources must be an array in feature options');
    }

    options.resources.forEach((resource) => {
      console.log(resource.name)
      this.validateString(resource.name, 'Resource name');
      console.log(resource.name)
      this.addResource(resource.name, resource.definition);
    });
  }
}