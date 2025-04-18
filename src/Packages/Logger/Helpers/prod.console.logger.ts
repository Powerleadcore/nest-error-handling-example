import * as winston from 'winston';
import { redactionFormat } from './redact.logger';

export const prodConsoleFormat = winston.format.combine(
  redactionFormat(),
  winston.format.timestamp(),
  winston.format.json(),
);
