import { ErrorCategory } from '../Enums/ErrorCategory';
import { iHttpResponse } from './iHttpResponse';

export interface iException extends Error {
  code: string;
  name: string;
  message: string;
  scope: string;
  category: ErrorCategory;
  stack?: string;
  errors?: any[];
  payload?: any;
  httpResponse: iHttpResponse;
  timestamp: Date;
}
