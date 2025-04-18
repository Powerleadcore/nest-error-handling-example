/**
 * Safely stringifies objects handling circular references and size limits
 */
export function safeStringify(obj: any, maxSize = 100000): string {
  try {
    // Handle circular references
    const seen = new WeakSet();

    const stringified = JSON.stringify(
      obj,
      (key, value) => {
        // Handle null/undefined
        if (value === null || value === undefined) {
          return value;
        }

        // Handle circular references
        if (typeof value === 'object') {
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
        }

        return value;
      },
      2,
    );

    // Apply size limit if needed
    if (stringified.length > maxSize) {
      return stringified.substring(0, maxSize) + '...(truncated due to size)';
    }

    return stringified;
  } catch (error) {
    return `[Unserializable: ${error.message}]`;
  }
}
