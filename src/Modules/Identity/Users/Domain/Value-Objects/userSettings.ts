import { Exclude, Expose } from 'class-transformer';
import { iUserSettings } from '../Interfaces/iUserSettings';

@Exclude()
export class UserSettings implements iUserSettings {
  constructor(private _is2faEnabled: boolean) {}

  static create(props: { is2faEnabled: boolean }) {
    return new this(props.is2faEnabled);
  }

  toJSON() {
    return {
      is2faEnabled: this._is2faEnabled,
    };
  }

  @Expose() public get is2faEnabled(): boolean {
    return this._is2faEnabled;
  }
}
