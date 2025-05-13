/**
 * Custom error types for better error handling
 */
export class AuthZRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthZRegistryError';
  }
}

export class ConfigValidationError extends AuthZRegistryError {
  constructor(message: string) {
    super(`Configuration validation failed: ${message}`);
    this.name = 'ConfigValidationError';
  }
}

export class RoleNotFoundError extends AuthZRegistryError {
  constructor(role: string) {
    super(`Role "${role}" is not defined in the registry.`);
    this.name = 'RoleNotFoundError';
  }
}

export class ResourceNotFoundError extends AuthZRegistryError {
  constructor(resource: string) {
    super(`Resource "${resource}" not found. Please make sure that the resource is defined in the root module.`);
    this.name = 'ResourceNotFoundError';
  }
}

export class InvalidResourceDefinitionError extends AuthZRegistryError {
  constructor(resource: string, reason: string) {
    super(`Invalid resource definition for "${resource}": ${reason}`);
    this.name = 'InvalidResourceDefinitionError';
  }
}