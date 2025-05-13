import { iEmailVerification } from '../Interfaces/iEmailVerification';
import { EmailVerficationStatus } from '../Enums/emailVerificationStatus.enum';
import { Exclude, Expose } from 'class-transformer';
import { DATE } from '@Shared/Domain/Value-objects';

@Exclude()
export class EmailVerification implements iEmailVerification {
  constructor(
    private _token: string,
    private _expiry: string,
    private _status: EmailVerficationStatus,
  ) {
    this.validate();
  }

  static create(props: { token: string }) {
    return new this(
      props.token,
      DATE.create(86400000),
      EmailVerficationStatus.PENDING,
    );
  }

  verify() {
    this._status = EmailVerficationStatus.VERIFIED;
  }

  resend(props: { token: string }) {
    this._expiry = DATE.create(86400000);
    this._token = props.token;
  }

  validate() {
    if (!this._token) {
      throw new Error('Token is required');
    }
  }

  toJSON(): iEmailVerification {
    return {
      token: this._token,
      expiry: this._expiry,
      status: this._status,
    };
  }

  @Expose() public get token(): string {
    return this._token;
  }
  @Expose() public get expiry(): string {
    return this._expiry;
  }
  @Expose() public get status(): EmailVerficationStatus {
    return this._status;
  }
}
