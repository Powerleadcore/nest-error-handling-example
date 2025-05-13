/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { User, UserStatus, iUser } from '@Modules/Identity/Users/Domain';
import { UserSchema } from '@Modules/Identity/Users/Infrastructure/Database';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HashService } from '../../../../../Shared/Infrastructure/Services/hash.service';
import { JwtTokenService } from '../../Infrastructure/Services/JwtTokenService';
import { UUID } from '@Shared/Domain/Value-objects';
import { AuthResponseDto } from '../DTOs/auth-response.dto';
import { LoginDto } from '../DTOs/login.dto';
import { RegisterDto } from '../DTOs/register.dto';
import { UserMapper } from '../../../Users/Infrastructure/Database/Helpers/user.mapper';
import { AUTH_Z_MODULE_SERVICE } from '@Packages/AuthZModule/authz.constants';
import { AuthZService } from '@Packages/AuthZModule';
import Roles from '@Modules/AuthZ/Enums/roles.enums';
import RoleDefinition from '@Modules/AuthZ/Interfaces/roleDefinition';
import { LogCategory } from '@Packages/Logger/Enums/logCategory.enum';

@Injectable()
export class AuthNService {
  private readonly logger = new Logger(AuthNService.name);
  constructor(
    @InjectRepository(UserSchema as any)
    private readonly userRepository: Repository<iUser>,
    @Inject(AUTH_Z_MODULE_SERVICE)
    private readonly authZService: AuthZService<Roles, RoleDefinition>,
    private readonly hashService: HashService,
    private readonly jwtTokenService: JwtTokenService,
  ) { }

  async register(registerDto: RegisterDto) {
    const {
      definition,
      role
    } = this.authZService.getDefaultRole();
    if (!role || !definition) {
      throw new BadRequestException('Role not found');
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashService.hash(registerDto.password);

    // Generate email verification token
    const verificationToken = UUID.create();

    // Create user entity using domain model
    const user = User.create({
      email: registerDto.email,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phoneNumber: registerDto.phoneNumber,
      currency: registerDto.currency,
      token: verificationToken,
      role: role as Roles,
      rank: definition.rank,
    });

    // Save user to database
    const savedUser = await this.userRepository.save(user.toJSON());

    // Return response DTO
    return {
      userId: savedUser.userId,
      email: savedUser.email,
      profile: {
        firstName: savedUser.profile.firstName,
        lastName: savedUser.profile.lastName,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is verified
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User not verified Contact Admin');
    }

    // Verify password
    const isPasswordValid = await this.hashService.validate(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const accessToken = await this.jwtTokenService.signAccessToken({
      sub: user.userId,
    });

    // Return response DTO
    return new AuthResponseDto(
      user.userId,
      user.email,
      user.currency,
      user.profile.firstName,
      user.profile.lastName,
      accessToken,
    );
  }

  // async getCurrentUser(): Promise<User> {
  //   const context = this.contextService.getContext();
  //   if (!context) {
  //     throw new UnauthorizedException('No context found');
  //   }

  //   const userId = context.userId;

  //   if (!userId) {
  //     throw new UnauthorizedException('No context found');
  //   }

  //   const userData = await this.userRepository.findOne({
  //     where: { userId },
  //   });

  //   if (!userData) {
  //     throw new NotFoundException('User not found');
  //   }

  //   return UserMapper.FromDatabaseToDomain(userData);
  // }
}
