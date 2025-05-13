import { Exclude, Expose, Type } from 'class-transformer';
import { iUser } from '../Interfaces/iUser';
import { iProfile } from '../Interfaces/iProfile';
import { Profile } from '../Entities/profile';
import { UserStatus } from '../Enums/userStatus.enum';
import { DATE, UUID } from '@Shared/Domain/Value-objects';
import { iEmailVerification } from '../Interfaces/iEmailVerification';
import { EmailVerification } from '../Value-Objects/emailVerification';
import { PasswordReset } from '../Value-Objects/passwordReset';
import { iPasswordReset } from '../Interfaces/iPasswordReset';
import { iUserSettings } from '../Interfaces/iUserSettings';
import { UserSettings } from '../Value-Objects/userSettings';
import { CurrencyCode } from '@Shared/Domain/Enums/currencies.enum';
import Roles from '@Modules/AuthZ/Enums/roles.enums';

@Exclude()
export class User implements iUser {
  constructor(
    private _userId: string,
    private _email: string,
    private _password: string,
    private _currency: CurrencyCode,
    private _status: UserStatus,
    private _profile: Profile,
    private _emailVerification: EmailVerification,
    private _passwordReset: PasswordReset | null,
    private _userSettings: UserSettings,
    private _role: Roles,
    private _rank: number,
    private _createAt: string,
    private _updateAt: string | null,
    private _deleteAt: string | null,
  ) {
    this.validate();
  }

  static create(props: {
    email: string;
    password: string;
    currency: CurrencyCode;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    token: string;
    rank: number;
    role: Roles
  }) {
    const user = new this(
      UUID.create(),
      props.email,
      props.password,
      props.currency,
      UserStatus.PENDING,
      Profile.create({
        firstName: props.firstName,
        lastName: props.lastName,
        phoneNumber: props.phoneNumber,
      }),
      EmailVerification.create({ token: props.token }),
      null,
      UserSettings.create({
        is2faEnabled: true,
      }),
      props.role,
      props.rank,
      DATE.create(),
      null,
      null,
    );
    return user;
  }

  toJSON(): iUser {
    return {
      userId: this.userId,
      email: this.email,
      currency: this._currency,
      emailVerification: this._emailVerification.toJSON(),
      passwordReset: this._passwordReset?.toJSON() || null,
      password: this.password,
      status: this.status,
      profile: this._profile.toJSON(),
      userSettings: this._userSettings.toJSON(),
      role: this._role,
      rank: this.rank,
      createAt: this.createAt,
      updateAt: this.updateAt,
      deleteAt: this.deleteAt,
    };
  }

  //Fields
  public changeEmail(email: string, token: string): void {
    this.update(() => {
      this._email = email;
      this._emailVerification = EmailVerification.create({ token });
    });
  }

  public validateEmail() {
    this.update(() => {
      this._emailVerification.verify();
    });
  }

  public resetPassword(token: string) {
    this.update(() => {
      this._passwordReset = PasswordReset.create({ token });
    });
  }

  public changePassword(password: string): void {
    this.update(() => {
      this._password = password;
    });
  }

  public changeProfile(props: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }) {
    this.update(() => {
      this._profile.updateProfile(props);
    });
  }

  public transitionStatus(newStatus: UserStatus) {
    if (this.isTransitionValid(newStatus)) {
      return this.update(() => {
        this._status = newStatus;
      });
    } else {
      throw new Error(
        `Invalid status transition from ${this.status} to ${newStatus}`,
      );
    }
  }

  public delete() {
    this.update(() => {
      this._deleteAt = DATE.create();
      this._profile.delete();
    });
  }

  private update<T>(callback: () => T): T {
    this.canUpdate();
    const res = callback();
    this._updateAt = DATE.create();
    return res;
  }
  private canUpdate(): void {
    if (this.deleteAt) {
      throw new Error(`Cannot update deleted user`);
    }
  }

  private isTransitionValid(newStatus: UserStatus) {
    const allowedTransitions: Map<UserStatus, UserStatus[]> = new Map([
      [UserStatus.ACTIVE, [UserStatus.BLOCK, UserStatus.PENDING]],
      [UserStatus.PENDING, [UserStatus.ACTIVE, UserStatus.BLOCK]],
      [UserStatus.BLOCK, [UserStatus.PENDING]],
    ]);
    return allowedTransitions.get(this.status)?.includes(newStatus) ?? false;
  }

  private validate() {}

  @Expose() get userId(): string {
    return this._userId;
  }
  @Expose() get email(): string {
    return this._email;
  }
  @Exclude() get password(): string {
    return this._password;
  }
  @Expose() get currency() {
    return this._currency;
  }
  @Expose() get status(): UserStatus {
    return this._status;
  }
  @Expose()
  @Type(() => Profile)
  get profile(): iProfile {
    return this._profile;
  }
  @Exclude()
  @Type(() => EmailVerification)
  get emailVerification(): iEmailVerification {
    return this._emailVerification;
  }
  @Exclude()
  @Type(() => PasswordReset)
  get passwordReset(): iPasswordReset | null {
    return this._passwordReset;
  }
  @Expose()
  @Type(() => UserSettings)
  get userSettings(): iUserSettings {
    return this._userSettings;
  }
  @Expose() get role(): Roles {
    return this._role;
  }
  @Exclude() get rank(): number {
    return this._rank;
  }
  @Expose() get createAt(): string {
    return this._createAt;
  }
  @Expose() get updateAt(): string | null {
    return this._updateAt;
  }
  @Exclude() get deleteAt(): string | null {
    return this._deleteAt;
  }
}
