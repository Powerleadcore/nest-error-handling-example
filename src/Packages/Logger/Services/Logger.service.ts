import {
  Injectable,
  LoggerService,
  LogLevel as NestLogLevel,
  Optional,
} from '@nestjs/common';
import * as winston from 'winston';
import { hostname } from 'os';
import { LogLevel, logLevels } from '../Enums/logLevel';
import { prodConsoleFormat } from '../Helpers/prod.console.logger';
import { iLogger } from '../Interfaces/iLogger';
import { LogCategory } from '../Enums/logCategory.enum';
import { ILog } from '../Interfaces/iLog';
import { isILog } from '../Helpers/type-guards';
import { devConsoleFormat } from '../Helpers/dev.console.logger';
import { safeStringify } from '../Helpers/safe-stringify';
import { getCorrelationId } from '../Context/requestContext.service';

@Injectable()
export class Logger implements LoggerService, iLogger {
  private readonly logger: winston.Logger;
  private readonly context: string;

  constructor();
  constructor(context: string);
  constructor(@Optional() context?: string) {
    this.context = context || 'UNKNOWN_CONTEXT';

    try {
      // Determine the appropriate format based on environment
      const isDevelopment = process.env.NODE_ENV !== 'PRODUCTION';

      // Configure Winston logger with appropriate format
      this.logger = winston.createLogger({
        defaultMeta: {
          hostname: hostname(),
          service_name: process.env.SERVICE_NAME || 'UNKNOWN_SERVICE',
          environment: process.env.NODE_ENV || 'UNKNOWN_ENV',
        },
        levels: logLevels,
        transports: [
          new winston.transports.Console({
            format: isDevelopment ? devConsoleFormat : prodConsoleFormat,
            level: process.env.LOG_LEVEL || 'LOG',
          }),
        ],
      });
    } catch (error) {
      // Fallback to console if Winston initialization fails
      console.error('Failed to initialize Winston logger:', error);
      this.logger = {
        log: (info: any) => {
          const emoji =
            info.level.toUpperCase() === 'ERROR'
              ? '🔥'
              : info.level.toUpperCase() === 'WARN'
                ? '⚠️'
                : '📝';
          console.log(`${emoji} [${info.level.toUpperCase()}] ${info.message}`);
        },
      } as any;
    }
  }

  /**
   * Creates a properly structured ILog object
   */
  static createPayload(category: LogCategory, data: any): ILog {
    return {
      category,
      payload: data,
    };
  }

  /**
   * Convert different message types to strings with size limits
   */
  private stringifyMessage(message: any): string {
    try {
      if (message === null || message === undefined) {
        return '';
      }

      if (typeof message === 'string') {
        // Limit string length for safety
        return message.length > 10000
          ? message.substring(0, 10000) + '...(truncated)'
          : message;
      }

      if (message instanceof Error) {
        return message.stack || message.message;
      }

      if (typeof message === 'object') {
        try {
          // Use safeStringify with a size limit
          return safeStringify(message, 10000);
        } catch {
          return '[Object]';
        }
      }

      return String(message);
    } catch {
      return '[Error formatting message]';
    }
  }

  /**
   * Limit payload size to avoid performance issues
   */
  private limitPayloadSize(payload: any, maxSize = 100000): any {
    try {
      if (!payload || typeof payload !== 'object') {
        return payload;
      }
      const size = JSON.stringify(payload).length;
      if (size <= maxSize) {
        return payload;
      }
      // For ILog objects, limit the nested payload
      if (isILog(payload)) {
        return {
          category: payload.category,
          payload: {
            truncated: true,
            message: `Original payload exceeded size limit (${size} bytes)`,
            sizeLimit: maxSize,
          },
        };
      }
      // For other objects
      return {
        truncated: true,
        message: `Original payload exceeded size limit (${size} bytes)`,
        sizeLimit: maxSize,
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: any) {
      return { error: 'Error while limiting payload size' };
    }
  }

  /**
   * Simplified parameter handling with predictable patterns
   */
  private normalizeArgs(
    message: any,
    optionalParams: any[],
  ): { message: string; context: string; payload: ILog | undefined } {
    // Start with defaults
    let context = this.context;
    let payload: ILog | undefined = undefined;

    try {
      // Convert message to string first
      const stringMessage = this.stringifyMessage(message);

      // No parameters case
      if (!optionalParams || optionalParams.length === 0) {
        return { message: stringMessage, context, payload };
      }

      // Pattern 1: logger.log(message, context)
      // Only applies when no context was set in constructor
      if (
        optionalParams.length === 1 &&
        typeof optionalParams[0] === 'string' &&
        this.context === 'UNKNOWN_CONTEXT'
      ) {
        context = optionalParams[0];
        return { message: stringMessage, context, payload };
      }

      // Pattern 2: logger.log(message, ILog)
      if (optionalParams.length === 1 && isILog(optionalParams[0])) {
        payload = optionalParams[0];
        return { message: stringMessage, context, payload };
      }

      // Pattern 3: logger.log(message, <any value>)
      if (optionalParams.length === 1) {
        const param = optionalParams[0];

        // Special handling for Error objects
        if (param instanceof Error) {
          payload = {
            category: LogCategory.SYSTEM,
            payload: {
              error: param.message,
              stack: param.stack,
              name: param.name,
            },
          };
        } else {
          payload = {
            category: LogCategory.SYSTEM,
            payload: param,
          };
        }

        return { message: stringMessage, context, payload };
      }

      // Pattern 4: logger.log(message, data, context)
      // Only applies when no context was set in constructor
      if (
        optionalParams.length === 2 &&
        typeof optionalParams[1] === 'string' &&
        this.context === 'UNKNOWN_CONTEXT'
      ) {
        context = optionalParams[1];

        // First parameter becomes payload
        const payloadData = optionalParams[0];

        if (isILog(payloadData)) {
          payload = payloadData;
        } else {
          payload = {
            category: LogCategory.SYSTEM,
            payload: payloadData,
          };
        }

        return { message: stringMessage, context, payload };
      }

      // Pattern 5: logger.log(message, ...anyParams)
      // Any other combination - all parameters become payload data
      const payloadData =
        optionalParams.length === 1 ? optionalParams[0] : optionalParams;
      payload = {
        category: LogCategory.SYSTEM,
        payload: payloadData,
      };

      // Apply size limit to the final payload
      if (payload) {
        payload = this.limitPayloadSize(payload);
      }

      return { message: stringMessage, context, payload };
    } catch (error) {
      // Fallback with better error handling
      console.error('Error normalizing log arguments:', error);
      return {
        message:
          typeof message === 'string' ? message : 'Error processing message',
        context,
        payload: {
          category: LogCategory.SYSTEM,
          payload: { error: 'Error processing log arguments' },
        },
      };
    }
  }

  // Core logging method
  private writeLog(
    level: LogLevel,
    message: any,
    ...optionalParams: any[]
  ): void {
    try {
      const {
        message: msgString,
        context,
        payload,
      } = this.normalizeArgs(message, optionalParams);

      // Get correlation ID
      const correlationId = getCorrelationId();
      // Log with all necessary information
      this.logger.log({
        level: level.toString(),
        timestamp: new Date().toISOString(), // Add timestamp for all logs
        context,
        message: msgString,
        correlationId,
        category: payload?.category || LogCategory.SYSTEM,
        payload: payload?.payload || undefined,
      });
    } catch (error) {
      // Improved error handling
      console.error('Error in logger.writeLog:', error);
      console.log(`[${level}] ${message} (Fallback logging due to error)`);
    }
  }

  // Simplified method signatures
  log(message: any): void;
  log(message: any, context: string): void;
  log(message: any, payload: ILog): void;
  log(message: any, payload: any): void;
  log(message: any, payload: any, context: string): void;
  log(message: any, ...optionalParams: any[]): void {
    this.writeLog(LogLevel.LOG, message, ...optionalParams);
  }

  error(message: any): void;
  error(message: any, trace: string): void;
  error(message: any, payload: ILog): void;
  error(message: any, payload: any): void;
  error(message: any, payload: any, context: string): void;
  error(message: any, ...optionalParams: any[]): void {
    this.writeLog(LogLevel.ERROR, message, ...optionalParams);
  }

  warn(message: any): void;
  warn(message: any, context: string): void;
  warn(message: any, payload: ILog): void;
  warn(message: any, payload: any): void;
  warn(message: any, payload: any, context: string): void;
  warn(message: any, ...optionalParams: any[]): void {
    this.writeLog(LogLevel.WARN, message, ...optionalParams);
  }

  debug(message: any): void;
  debug(message: any, context: string): void;
  debug(message: any, payload: ILog): void;
  debug(message: any, payload: any): void;
  debug(message: any, payload: any, context: string): void;
  debug(message: any, ...optionalParams: any[]): void {
    this.writeLog(LogLevel.DEBUG, message, ...optionalParams);
  }

  verbose(message: any): void;
  verbose(message: any, context: string): void;
  verbose(message: any, payload: ILog): void;
  verbose(message: any, payload: any): void;
  verbose(message: any, payload: any, context: string): void;
  verbose(message: any, ...optionalParams: any[]): void {
    this.writeLog(LogLevel.VERBOSE, message, ...optionalParams);
  }

  fatal(message: any): void;
  fatal(message: any, context: string): void;
  fatal(message: any, payload: ILog): void;
  fatal(message: any, payload: any): void;
  fatal(message: any, payload: any, context: string): void;
  fatal(message: any, ...optionalParams: any[]): void {
    this.writeLog(LogLevel.FATAL, message, ...optionalParams);
  }

  // NestJS specific methods
  setLogLevels?(levels: NestLogLevel[]): void {
    try {
      // Convert NestJS log levels to our format and update Winston logger
      const nestToWinstonMap: Record<string, string> = {
        log: LogLevel.LOG,
        error: LogLevel.ERROR,
        warn: LogLevel.WARN,
        debug: LogLevel.DEBUG,
        verbose: LogLevel.VERBOSE,
        fatal: LogLevel.FATAL,
      };

      // Get all transports
      const transports = this.logger.transports;

      // Map NestJS levels to our levels and set on all transports
      const mappedLevels = levels.map(
        (level) => nestToWinstonMap[level.toString()] || level.toString(),
      );

      // Highest level in array becomes the level (lower number = higher priority)
      if (mappedLevels.length > 0) {
        const lowestLevelName = mappedLevels.reduce((lowest, current) => {
          const lowestValue = logLevels[lowest as LogLevel] || 999;
          const currentValue = logLevels[current as LogLevel] || 999;
          return currentValue < lowestValue ? current : lowest;
        });

        // Apply to all transports
        transports.forEach((transport) => {
          if ('level' in transport) {
            (transport as any).level = lowestLevelName;
          }
        });

        console.log(`Log levels set to: ${mappedLevels.join(', ')}`);
      }
    } catch (error) {
      console.error('Error setting log levels:', error);
    }
  }
}
