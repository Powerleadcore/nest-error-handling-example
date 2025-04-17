import { ErrorCategory } from '../Enums/ErrorCategory';
import { LogLevel } from '../Enums/logLevel';
import { iException } from '../Interfaces/iException';
import { iHttpResponse } from '../Interfaces/iHttpResponse';

export class Exception extends Error implements iException {
  code: string;
  name: string;
  message: string;
  stack?: string;
  scope: string;
  log: boolean = false;
  logLevel: LogLevel = LogLevel.ERROR;
  category: ErrorCategory;
  errors?: any[];
  payload?: any;
  httpResponse: iHttpResponse;
  timestamp: Date;

  constructor(props: {
    code: string;
    message: string;
    scope: string;
    category: ErrorCategory;
    httpResponse: iHttpResponse;
    log?: boolean;
    logLevel?: LogLevel;
    errors?: any[];
    payload?: any;
  }) {
    super(props.message);
    this.code = props.code;
    this.name = this.constructor.name;
    this.scope = props.scope;
    this.category = props.category;
    this.errors = props.errors;
    this.payload = props.payload;
    this.httpResponse = props.httpResponse;
    this.log = props.log || false;
    this.logLevel = props.logLevel || LogLevel.ERROR;
    this.timestamp = new Date();
  }

  toJSON(): iException {
    return {
      code: this.code,
      name: this.name,
      message: this.message,
      scope: this.scope,
      category: this.category,
      stack: this?.stack,
      errors: this?.errors,
      payload: this?.payload,
      httpResponse: {
        status: this.httpResponse?.status,
        message: this.httpResponse?.message,
        payload: this.httpResponse?.payload,
      },
      timestamp: this.timestamp,
    };
  }
}
