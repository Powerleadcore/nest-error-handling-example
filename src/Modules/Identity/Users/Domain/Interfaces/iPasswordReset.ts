import { PasswordResetStatus } from '../Enums/passwordResetStatus.enum';

export interface iPasswordReset {
  token: string;
  expiry: string;
  requestTime: string;
  status: PasswordResetStatus;
}
