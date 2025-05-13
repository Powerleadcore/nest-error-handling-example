import * as crypto from 'crypto';
// Utility classes with JSDoc documentation
/**
 * Represents a universally unique identifier (UUID).
 */
export class UUID {
  static create(): string {
    return crypto.randomUUID();
  }
}
