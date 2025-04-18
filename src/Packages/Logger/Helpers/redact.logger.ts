import * as winston from 'winston';
import { safeStringify } from './safe-stringify';

// Define patterns and keys that should be redacted
const SENSITIVE_PATTERNS = [
  /\b(?:\d[ -]*?){13,16}\b/, // Credit card numbers
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, // Email addresses
  /\b(?:\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/, // Phone numbers
  /password[:=]\s*['"]?([^'"]+)/i, // Passwords in text
  /token[:=]\s*['"]?([^'"]+)/i, // API tokens in text
  /key[:=]\s*['"]?([^'"]+)/i, // API keys in text
  /secret[:=]\s*['"]?([^'"]+)/i, // Secrets in text
];

// Keys that should be redacted (case-insensitive)
const SENSITIVE_KEYS = [
  'password',
  'token',
  'authorization',
  'secret',
  'key',
  'access_token',
  'refresh_token',
  'creditcard',
  'credit_card',
  'cardnumber',
  'card_number',
  'ssn',
  'social_security',
  'email',
  'address',
  'phone',
];

// Redaction replacement value
const REDACTED_TEXT = '[REDACTED]';

// Recursive function to redact sensitive data in objects
const redactSensitiveData = (obj: any, path = ''): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle different data types
  if (typeof obj === 'string') {
    // Redact based on patterns
    let redactedString = obj;
    for (const pattern of SENSITIVE_PATTERNS) {
      redactedString = redactedString.replace(pattern, REDACTED_TEXT);
    }
    return redactedString;
  }

  // Don't process non-objects further
  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item, index) =>
      redactSensitiveData(item, `${path}[${index}]`),
    );
  }

  // Handle objects
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Check if this key should be redacted
    if (SENSITIVE_KEYS.some((k) => lowerKey.includes(k))) {
      result[key] = REDACTED_TEXT;
    } else {
      // Recursively process nested objects
      result[key] = redactSensitiveData(value, path ? `${path}.${key}` : key);
    }
  }

  return result;
};

// Create a Winston format for redaction
export const redactionFormat = winston.format((info) => {
  try {
    // Deep clone to avoid modifying the original object
    // Use safeStringify instead of direct JSON operations
    const safeInfo = JSON.parse(safeStringify(info));

    // Redact sensitive information in message if it's a string
    if (typeof safeInfo.message === 'string') {
      safeInfo.message = redactSensitiveData(safeInfo.message);
    }

    // Redact in payload
    if (safeInfo.payload) {
      safeInfo.payload = redactSensitiveData(safeInfo.payload);
    }

    // Redact in other fields except for standard metadata
    const skipFields = [
      'level',
      'timestamp',
      'service_name',
      'hostname',
      'environment',
    ];

    for (const key of Object.keys(safeInfo)) {
      if (!skipFields.includes(key) && key !== 'message' && key !== 'payload') {
        safeInfo[key] = redactSensitiveData(safeInfo[key]);
      }
    }

    return safeInfo;
  } catch (error) {
    // If redaction fails, at least log something
    return {
      level: info.level || 'error',
      message: 'Error in redaction formatter',
      payload: { error: error.message },
    };
  }
});
