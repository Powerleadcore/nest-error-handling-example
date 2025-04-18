import * as winston from 'winston';
import { redactionFormat } from './redact.logger';
import { safeStringify } from './safe-stringify';

// Emojis to make logs more visually distinguishable
const logEmojis = {
  FATAL: '💀 ', // Skull for fatal errors
  ERROR: '🔥 ', // Fire for errors
  WARN: '⚠️ ', // Warning sign
  LOG: '📝 ', // Note for info
  DEBUG: '🐛 ', // Bug for debugging
  VERBOSE: '🔍 ', // Magnifying glass for verbose details
};

// Color themes for different log levels
const logColors = {
  FATAL: 'bold red blackBG',
  ERROR: 'red',
  WARN: 'yellow',
  LOG: 'green',
  DEBUG: 'blue',
  VERBOSE: 'gray',
};

// Add colors to winston
winston.addColors(logColors);

// Special formatter for development console
const devFormatter = winston.format.printf((info) => {
  // Format timestamp for readability with proper type checking
  const time = info.timestamp
    ? new Date(info.timestamp as string | number | Date).toLocaleTimeString()
    : new Date().toLocaleTimeString();

  // Get emoji for the log level
  // Extract just the level name without ANSI color codes by matching against known levels
  let levelStr = 'LOG'; // Default level
  Object.keys(logEmojis).forEach((level) => {
    if (String(info.level).toUpperCase().includes(level)) {
      levelStr = level;
    }
  });
  const emoji = logEmojis[levelStr as keyof typeof logEmojis] || '🔷 ';

  // Format the context with brackets if it exists
  const formattedContext = info.context ? `[${info.context}]` : '';

  // Format correlation ID if it exists with proper type checking
  const trackingInfo = info.correlationId ? `<${info.correlationId}>` : '';

  // Format category if it exists
  const categoryInfo = info.category ? `<${info.category}>` : '';

  // Create the basic message line
  let logMessage = `${emoji}${time} ${String(info.level).padEnd(7)} ${formattedContext} ${trackingInfo} ${categoryInfo}: ${info.message}`;

  // Add formatted payload if it exists
  if (info.payload) {
    try {
      // For dev environment, add indented and colorized JSON
      if (typeof info.payload === 'object') {
        // Use safeStringify with a size limit
        const payloadStr = safeStringify(info.payload, 50000);
        logMessage += `\n${payloadStr
          .split('\n')
          .map((line) => `  ${line}`)
          .join('\n')}`;
      } else {
        // Apply size limit for non-object payloads too
        const strPayload = String(info.payload);
        const limitedPayload =
          strPayload.length > 10000
            ? strPayload.substring(0, 10000) + '...(truncated)'
            : strPayload;
        logMessage += `\n  ${limitedPayload}`;
      }
    } catch (err) {
      logMessage += `\n  [Unserializable payload: ${err.message}]`;
    }
  }

  return logMessage;
});

// Combined format for development
export const devConsoleFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.colorize({ all: true }),
  redactionFormat(),
  devFormatter,
);
