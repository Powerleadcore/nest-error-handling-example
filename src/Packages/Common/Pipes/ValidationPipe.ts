import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  ValidationError,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ValidationException } from '../Exceptions/validation.exception';

@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      throw new ValidationException(
        errors.map((error) => ({
          field: error.property,
          message: error.constraints 
            ? Object.keys(error.constraints).map(
                (key) => error.constraints![key],
              )
            : [],
        })),
      );
    }

    return value;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  private toValidate(metatype: Function): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: ValidationError[]) {
    const result: Record<string, any> = {};

    errors.forEach((error) => {
      const property = error.property;
      const constraints = error.constraints;

      if (constraints) {
        result[property] = Object.values(constraints)[0]; // Get first error message
      }

      // Handle nested validation errors
      if (error.children && error.children.length > 0) {
        result[property] = this.formatErrors(error.children);
      }
    });

    return result;
  }
}
