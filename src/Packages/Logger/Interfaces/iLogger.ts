import { LoggerService, LogLevel as NestLogLevel } from '@nestjs/common';
import { ILog } from './iLog';
import { LogCategory } from '../Enums/logCategory.enum';

export interface iLogger extends LoggerService {
  // Standard logging methods with all supported overloads
  log(message: any): void;
  log(message: any, context: string): void;
  log(message: any, payload: ILog): void;
  log(message: any, payload: any): void;
  log(message: any, payload: any, context: string): void;

  // Helper methods for structured logging
  // logWithPayload(message: string, category: LogCategory, payload: any): void;
  // logError(message: string, error: Error): void;

  // Error logging with all supported overloads
  error(message: any): void;
  error(message: any, trace: string): void;
  error(message: any, payload: ILog): void;
  error(message: any, payload: any): void;
  error(message: any, payload: any, context: string): void;

  // Warning logging with all supported overloads
  warn(message: any): void;
  warn(message: any, context: string): void;
  warn(message: any, payload: ILog): void;
  warn(message: any, payload: any): void;
  warn(message: any, payload: any, context: string): void;

  // Debug logging with all supported overloads
  debug(message: any): void;
  debug(message: any, context: string): void;
  debug(message: any, payload: ILog): void;
  debug(message: any, payload: any): void;
  debug(message: any, payload: any, context: string): void;

  // Verbose logging with all supported overloads
  verbose(message: any): void;
  verbose(message: any, context: string): void;
  verbose(message: any, payload: ILog): void;
  verbose(message: any, payload: any): void;
  verbose(message: any, payload: any, context: string): void;

  // Fatal logging with all supported overloads
  fatal(message: any): void;
  fatal(message: any, context: string): void;
  fatal(message: any, payload: ILog): void;
  fatal(message: any, payload: any): void;
  fatal(message: any, payload: any, context: string): void;

  // NestJS specific method
  setLogLevels?(levels: NestLogLevel[]): void;
}
