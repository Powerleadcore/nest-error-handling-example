export enum LogLevel {
  FATAL = 'FATAL', // Critical failures requiring immediate action
  ERROR = 'ERROR', // Non-critical issues to monitor
  WARN = 'WARN', // Non-critical issues to monitor
  LOG = 'LOG', // General informational messages
  DEBUG = 'DEBUG', // Debug-level details
  VERBOSE = 'VERBOSE', // Detailed information for developers
}

export const logLevels: Record<LogLevel, number> = {
  FATAL: 0, // Critical failures requiring immediate action
  ERROR: 1, // Non-critical issues to monitor
  WARN: 2, // Non-critical issues to monitor
  LOG: 3, // General informational messages
  DEBUG: 4, // Debug-level details
  VERBOSE: 5, // Detailed information for developers
};
