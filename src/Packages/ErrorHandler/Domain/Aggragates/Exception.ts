import { LogLevel } from '@Packages/Logger/Enums/logLevel';
import { ErrorCategory } from '../Enums/ErrorCategory';
import { iException } from '../Interfaces/iException';
import { iHttpResponse } from '../Interfaces/iHttpResponse';
import { LogCategory } from '@Packages/Logger/Enums/logCategory.enum';

export class Exception extends Error implements iException {
  code: string;
  name: string;
  message: string;
  stack?: string;
  scope: string;
  log: boolean = false;
  logLevel: LogLevel = LogLevel.ERROR;
  logCategory: LogCategory = LogCategory.SYSTEM;
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
    logCategory?: LogCategory;
    errors?: any[];
    payload?: any;
  }) {
    super(props.message);
    this.code = props.code;
    this.name = this.constructor.name;
    this.scope = props.scope;
    this.category = props.category;
    this.errors = props.errors;
    this.log = props.log || false;
    this.logLevel = props.logLevel || LogLevel.ERROR;
    this.logCategory = props.logCategory || LogCategory.SYSTEM;
    this.payload = props.payload;
    this.httpResponse = props.httpResponse;
    this.logLevel = props.logLevel || LogLevel.ERROR;
    this.timestamp = new Date();
  }

  logException() {
    return {
      category: this.logCategory,
      payload: {
        code: this.code,
        name: this.name,
        scope: this.scope,
        category: this.category,
        stack: this?.stack,
        errors: this?.errors,
        payload: this?.payload,
      },
    };
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
      log: this?.log,
      logLevel: this?.logLevel,
      logCategory: this?.logCategory,
      httpResponse: {
        status: this.httpResponse?.status,
        message: this.httpResponse?.message,
        payload: this.httpResponse?.payload,
      },
      timestamp: this.timestamp,
    };
  }
}
