import { DATE } from '@Shared/Domain/Value-objects';
import { iPasswordReset } from '../Interfaces/iPasswordReset';
import { PasswordResetStatus } from '../Enums/passwordResetStatus.enum';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class PasswordReset implements iPasswordReset {
  constructor(
    private _token: string,
    private _expiry: string,
    private _requestTime: string,
    private _status: PasswordResetStatus,
  ) {}

  static create(props: { token: string }) {
    return new this(
      props.token,
      DATE.create(86400000),
      DATE.create(),
      PasswordResetStatus.ACTIVE,
    );
  }
  //toJSON
  toJSON() {
    return {
      token: this._token,
      expiry: this._expiry,
      requestTime: this._requestTime,
      status: this._status,
    };
  }

  @Expose() public get token(): string {
    return this._token;
  }

  @Expose() public get expiry(): string {
    return this._expiry;
  }

  @Expose() public get requestTime(): string {
    return this._requestTime;
  }

  @Expose() public get status(): PasswordResetStatus {
    return this._status;
  }

  public expire(): void {
    this._status = PasswordResetStatus.EXPIRED;
  }

  public use(): void {
    this._status = PasswordResetStatus.USED;
  }

  public isExpired(): boolean {
    return new Date(this._expiry) < new Date();
  }

  public isUsed(): boolean {
    return this._status === PasswordResetStatus.USED;
  }
}
