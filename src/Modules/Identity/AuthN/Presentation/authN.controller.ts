import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { AuthNService } from '../Application/Services/authN.service';
import { RegisterDto } from '../Application/DTOs/register.dto';
import { LoginDto } from '../Application/DTOs/login.dto';
import { AuthResponseDto } from '../Application/DTOs/auth-response.dto';
import { User } from '@Modules/Identity/Users/Domain';
import { Public } from '@Packages/AuthZModule/Decorators/public.decorator';

@Controller('auth')
export class AuthNController {
  constructor(private readonly authNService: AuthNService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return await this.authNService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authNService.login(loginDto);
  }

  // @Auth()
  // @Get('me')
  // async getProfile(): Promise<User> {
  //   return this.authNService.getCurrentUser();
  // }
}
