import Roles from "@Modules/AuthZ/Enums/roles.enums";
import { ResourceDefinition } from "@Packages/AuthZModule/Interfaces/resource-definition.interface";
import { User } from "./Domain";
import { Context } from "@Modules/AuthZ/Interfaces/context";

export enum UserActions {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LIST = 'LIST',
}

export enum UserAccessLevels {
  ALL = 'ALL',
  ALL_RANK = 'ALL_RANK',
  OWN = 'OWN',
  ASSIGNED = 'ASSIGNED',
}

export enum UserRelationships {
  OWNER = 'OWNER',
}

export const UserAuthZDefinition: ResourceDefinition<UserActions, UserAccessLevels, UserRelationships, Roles, Context, User> = {
  identifier: 'userId',
  actions: UserActions,
  relationships: UserRelationships,
  accessLevels: {
    ALL: { fn: () => true, priority: 0 },
    ALL_RANK: { fn: (ctx: Context, res: User) => ctx.rank <= res.rank, priority: 1 },
    OWN: { fn: (ctx: Context, res: User) => ctx.userId === res.userId, priority: 2 },
    ASSIGNED: { fn: (ctx: Context, res: User) => ctx.assignedUsers.includes(res.userId), priority: 3 },
  },
  roles: {
    SUPER_ADMIN: {
      permissions: {
        CREATE: ['ALL'],
        READ: ['ALL'],
        LIST: ['ALL'],
        UPDATE: ['ALL'],
        DELETE: ['ALL']
      },
      relationships: ['OWNER']
    },
    ADMIN: {
      permissions: {
        CREATE: ['ALL_RANK'],
        READ: ['ALL_RANK'],
        LIST: ['ALL_RANK'],
        UPDATE: ['ALL_RANK'],
        DELETE: ['ALL_RANK']
      },
      relationships: ['OWNER']
    },
    MANAGER: {
      permissions: {
        READ: ['ASSIGNED', 'OWN'],
        LIST: ['ASSIGNED'],
        UPDATE: ['ASSIGNED', 'OWN'],
      },
      relationships: ['OWNER']
    },
    AGENT: {
      permissions: {
        READ: ['OWN'],
        UPDATE: ['OWN'],
      },
      relationships: ['OWNER']
    },
    SELLER: {
      permissions: {
        READ: ['OWN'],
        UPDATE: ['OWN'],
      },
      relationships: ['OWNER']
    }
  }
}