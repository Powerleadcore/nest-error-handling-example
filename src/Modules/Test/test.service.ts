import Resources from '@Modules/AuthZ/Enums/resources.enum';
import { Context } from '@Modules/AuthZ/Interfaces/context';
import { UserActions } from '@Modules/Identity/Users/user.authz.config';
import { iUser } from '@Modules/Identity/Users/Domain';
import { UserSchema } from '@Modules/Identity/Users/Infrastructure/Database';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthZService } from '@Packages/AuthZModule';
import { AUTH_Z_MODULE_SERVICE } from '@Packages/AuthZModule/authz.constants';
import { Repository } from 'typeorm';
import { UserMapper } from '../Identity/Users/Infrastructure/Database/Helpers/user.mapper';

@Injectable()
export class AppService {
  constructor(
    @Inject(AUTH_Z_MODULE_SERVICE) private authZService: AuthZService<any, any>,
    @InjectRepository(UserSchema)
    private readonly userRepository: Repository<iUser>,
  ) { }
  async getHello() {
    const context = this.authZService.currentContext<Context>();
    const userId = context?.userId;
    if (!userId) {
      throw new Error('User not found');
    }
    const user = await this.userRepository.findOne({
      where: { userId: userId },
    });
    if (!user) {
      throw new Error('User not found');
    }
    this.authZService.can(
      Resources.USER,
      UserActions.READ,
      user,
    )
    return UserMapper.FromDatabaseToDomain(user);
  }
}
