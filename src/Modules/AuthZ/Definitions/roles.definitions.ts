import { RolesDefinitions } from "@Packages/AuthZModule";
import Roles from "../Enums/roles.enums";
import UserType from "../Enums/user-type.enum";
import RoleDefinition from "../Interfaces/roleDefinition";

const rolesDefinition: RolesDefinitions<Roles, RoleDefinition> = {
  [Roles.SUPER_ADMIN]: {
    inviteOnly: true,
    rank: 0,
    userType: UserType.INTERNAL,
  },
  [Roles.ADMIN]: {
    inviteOnly: true,
    rank: 1,
    userType: UserType.INTERNAL,
  },
  [Roles.MANAGER]: {
    inviteOnly: true,
    rank: 2,
    userType: UserType.INTERNAL,
  },
  [Roles.AGENT]: {
    inviteOnly: true,
    rank: 3,
    userType: UserType.INTERNAL,
  },
  [Roles.SELLER]: {
    inviteOnly: true,
    rank: 3,
    userType: UserType.EXTERNAL,
  },
};

export default rolesDefinition;
