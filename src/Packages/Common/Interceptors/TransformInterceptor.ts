import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  status: number;
  message: string;
  data?: T | null;
  errors?: any | null;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse();
        const status = response.statusCode || HttpStatus.OK;
        let message: string = undefined;
        let _data: any = undefined;
        if (typeof data !== 'object') {
          message = data;
        } else {
          _data = data.data || data || undefined;
          message = data.message || undefined;
        }
        return {
          status,
          message,
          data: _data,
          errors: data.errors || undefined,
        };
      }),
    );
  }
}
