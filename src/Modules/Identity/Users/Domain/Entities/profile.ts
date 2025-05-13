import { Exclude, Expose } from 'class-transformer';
import { iProfile } from '../Interfaces/iProfile';
import { DATE, UUID } from '@Shared/Domain/Value-objects';

@Exclude()
export class Profile implements iProfile {
  constructor(
    private _profileId: string,
    private _firstName: string,
    private _lastName: string,
    private _phoneNumber: string,
    private _createAt: string,
    private _updateAt: string | null,
    private _deleteAt: string | null,
  ) {
    this.validate();
  }

  static create(props: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  }) {
    const profile = new this(
      UUID.create(),
      props.firstName,
      props.lastName,
      props.phoneNumber,
      DATE.create(),
      null,
      null,
    );
    return profile;
  }

  //Fields
  updateProfile(props: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }) {
    this.update(() => {
      if (props.firstName) {
        this._firstName = props.firstName;
      }
      if (props.lastName) {
        this._lastName = props.lastName;
      }
      if (props.phoneNumber) {
        this._phoneNumber = props.phoneNumber;
      }
    });
  }

  delete() {
    this.update(() => {
      this._deleteAt = DATE.create();
    });
  }
  //utility
  private update<T>(callback: () => T): T {
    this.canUpdate();
    const res = callback();
    this._updateAt = DATE.create();
    return res;
  }

  private canUpdate(): void {
    if (this.deleteAt) {
      throw new Error(`Profile is deleted and cannot be updated`);
    }
  }

  private validate() {
    if (!this.firstName || !this.lastName) {
      throw new Error(`First name and last name are required`);
    }
  }

  toJSON() {
    return {
      profileId: this._profileId,
      firstName: this._firstName,
      lastName: this._lastName,
      phoneNumber: this._phoneNumber,
      createAt: this._createAt,
      updateAt: this._updateAt,
      deleteAt: this._deleteAt,
    };
  }

  @Expose() get profileId(): string {
    return this._profileId;
  }
  @Expose() get firstName(): string {
    return this._firstName;
  }
  @Expose() get lastName(): string {
    return this._lastName;
  }
  @Expose() get phoneNumber(): string {
    return this._phoneNumber;
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
