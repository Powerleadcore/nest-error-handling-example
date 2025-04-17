import { HttpCode } from '../Enums/HttpCode';

export interface iHttpResponse {
  status: HttpCode;
  message?: string;
  payload?: any;
}
