import { iTimestamp } from '@Shared/Domain/Interfaces/iTimestamp';

export interface iProfile extends iTimestamp {
  profileId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}
