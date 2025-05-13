import Roles from '@Modules/AuthZ/Enums/roles.enums';
import { iUser, UserStatus } from '@Modules/Identity/Users/Domain';
import { CurrencyCode } from '@Shared/Domain/Enums/currencies.enum';
import { EntitySchema } from 'typeorm';

export const UserSchema = new EntitySchema<iUser>({
  name: 'User',
  tableName: 'users_table',
  columns: {
    userId: {
      name: 'user_id',
      type: 'uuid',
      primary: true,
    },
    email: {
      type: 'varchar',
    },
    password: {
      type: 'varchar',
    },
    status: {
      type: 'enum',
      enum: UserStatus,
      enumName: 'users_status_enum',
    },
    role: {
      type: 'enum',
      enum: Roles,
      enumName: 'users_role_enum',
    },
    rank: {
      type: 'numeric',
    },
    currency: {
      type: 'enum',
      enum: CurrencyCode,
      enumName: 'currencies_enum',
      default: CurrencyCode.USD,
    },
    emailVerification: {
      name: 'email_verification',
      type: 'jsonb',
      nullable: true,
    },
    passwordReset: {
      name: 'password_reset',
      type: 'jsonb',
      nullable: true,
    },
    userSettings: {
      name: 'user_settings',
      type: 'jsonb',
    },
    createAt: {
      name: 'create_at',
      type: 'timestamptz',
    },
    updateAt: {
      name: 'update_at',
      type: 'timestamptz',
      nullable: true,
    },
    deleteAt: {
      name: 'delete_at',
      type: 'timestamptz',
      nullable: true,
    },
  },
  indices: [
    {
      columns: ['email'],
      name: 'IDX_USERS_EMAIL',
      unique: true,
    },
    {
      columns: ['status'],
      name: 'IDX_USERS_STATUS',
    },
    {
      columns: ['deleteAt'],
      name: 'IDX_USERS_DELETE_AT',
    },
    {
      columns: ['createAt'],
      name: 'IDX_USERS_CREATE_AT',
    },
    {
      columns: ['status', 'deleteAt'],
      name: 'IDX_USERS_STATUS_DELETE_AT',
    },
    {
      columns: ['rank'],
      name: 'IDX_USERS_RANK',
    },
  ],
  relations: {
    profile: {
      target: 'profiles_table',
      type: 'one-to-one',
      cascade: true,
      eager: true,
      inverseSide: 'user',
    },
  },
});
