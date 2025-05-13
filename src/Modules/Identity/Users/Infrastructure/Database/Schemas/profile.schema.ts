import { iProfile } from '@Modules/Identity/Users/Domain';
import { EntitySchema } from 'typeorm';

export const ProfileSchema = new EntitySchema<iProfile & { user: any }>({
  name: 'Profile',
  tableName: 'profiles_table',
  columns: {
    profileId: {
      name: 'profile_id',
      type: 'uuid',
      primary: true,
    },
    firstName: {
      name: 'first_name',
      type: 'varchar',
    },
    lastName: {
      name: 'last_name',
      type: 'varchar',
    },
    phoneNumber: {
      name: 'phone_number',
      type: 'varchar',
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
  relations: {
    user: {
      target: 'users_table',
      type: 'one-to-one',
      inverseSide: 'profile', // Add this line
      joinColumn: {
        name: 'user_id',
        referencedColumnName: 'userId',
        foreignKeyConstraintName: 'FK_USER_PROFILE',
      },
    },
  },
});
