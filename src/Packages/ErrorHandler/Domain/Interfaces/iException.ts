import { LogLevel } from '@Packages/Logger/Enums/logLevel';
import { ErrorCategory } from '../Enums/ErrorCategory';
import { iHttpResponse } from './iHttpResponse';
import { LogCategory } from '@Packages/Logger/Enums/logCategory.enum';

export interface iException extends Error {
  code: string;
  name: string;
  message: string;
  scope: string;
  category: ErrorCategory;
  stack?: string;
  errors?: any[];
  payload?: any;
  log: boolean;
  logLevel: LogLevel;
  logCategory: LogCategory;
  httpResponse: iHttpResponse;
  timestamp: Date;
}
