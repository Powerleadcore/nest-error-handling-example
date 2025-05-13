import UserType from '../Enums/user-type.enum';

export default interface RoleDefinition {
  rank: number;
  userType: UserType;
  inviteOnly: boolean;
  [key: string]: unknown;
}
