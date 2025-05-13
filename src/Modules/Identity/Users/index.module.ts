import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { ProfileSchema, UserSchema } from './Infrastructure/Database';
import { AuthZModule } from '@Packages/AuthZModule';
import { UserAuthZDefinition } from './user.authz.config';
import Resources from '@Modules/AuthZ/Enums/resources.enum';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSchema, ProfileSchema]),
    AuthZModule.forFeature({
      resources: [
        {
          name: Resources.USER,
          definition: UserAuthZDefinition,
        },
      ],
    })
  ],
  providers: [],
  controllers: [],
  exports: [TypeOrmModule],
})
export class UsersModule {}
