import { CurrencyCode } from '@Shared/Domain/Enums/currencies.enum';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class AuthResponseDto {
  constructor(
    private _userId: string,
    private _email: string,
    private _currency: CurrencyCode,
    private _firstName: string,
    private _lastName: string,
    private _accessToken: string,
  ) {}

  @Expose()
  get userId(): string {
    return this._userId;
  }

  @Expose()
  get email(): string {
    return this._email;
  }

  @Expose()
  get currency(): string {
    return this._currency;
  }

  @Expose()
  get firstName(): string {
    return this._firstName;
  }

  @Expose()
  get lastName(): string {
    return this._lastName;
  }

  @Expose()
  get accessToken(): string {
    return this._accessToken;
  }
}
