import { iTimestamp } from '@Shared/Domain/Interfaces/iTimestamp';
import { iProfile } from './iProfile';
import { UserStatus } from '../Enums/userStatus.enum';
import { iEmailVerification } from './iEmailVerification';
import { iPasswordReset } from './iPasswordReset';
import { iUserSettings } from './iUserSettings';
import { CurrencyCode } from '@Shared/Domain/Enums/currencies.enum';
import Roles from '@Modules/AuthZ/Enums/roles.enums';

export interface iUser extends iTimestamp {
  userId: string;
  email: string;
  password: string;
  status: UserStatus;
  profile: iProfile;
  currency: CurrencyCode;
  emailVerification: iEmailVerification;
  passwordReset: iPasswordReset | null;
  userSettings: iUserSettings;
  role: Roles,
  rank: number;
}
