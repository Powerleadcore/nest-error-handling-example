import { plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';
import { EnvironmentVariables } from './env';
import { Logger } from '@nestjs/common';

// Function to validate environment variables
export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors: ValidationError[] = validateSync(validatedConfig as object, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    Logger.error(
      errors
        .map((error: ValidationError) =>
          error.constraints ? Object.values(error.constraints).join(', ') : '',
        )
        .join('; '),
    );
    throw new Error(
      errors
        .map((error: ValidationError) =>
          error.constraints ? Object.values(error.constraints).join(', ') : '',
        )
        .join('; '),
    );
  }

  return validatedConfig;
}
