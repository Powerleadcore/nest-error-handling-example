import { EmailVerficationStatus } from '../Enums/emailVerificationStatus.enum';

export interface iEmailVerification {
  token: string;
  expiry: string;
  status: EmailVerficationStatus;
}
