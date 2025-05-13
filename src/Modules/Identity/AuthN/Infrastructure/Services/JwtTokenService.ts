import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { iAccessPayload } from '../../Domain/Interfaces/iAccessPayload';

@Injectable()
export class JwtTokenService {
  private readonly accessPrivateKey: string;
  private readonly accessPublicKey: string;
  private readonly accessTokenExpiresIn: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessPrivateKey = configService.getOrThrow<string>(
      'AUTH_ACCESS_PRIVATE_KEY',
    );
    this.accessPublicKey = configService.getOrThrow<string>(
      'AUTH_ACCESS_PUBLIC_KEY',
    );
    this.accessTokenExpiresIn =
      configService.getOrThrow<number>('AUTH_ACCESS_EXPIRE') / 1000;
  }

  // **Sign Access Token using Private Key**
  signAccessToken(payload: iAccessPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      privateKey: this.accessPrivateKey,
      expiresIn: this.accessTokenExpiresIn,
      algorithm: 'RS256',
    });
  }

  // **Verify Access Token using Public Key**
  verifyAccessToken(token: string): Promise<iAccessPayload> {
    return this.jwtService.verifyAsync<iAccessPayload>(token, {
      publicKey: this.accessPublicKey, // <-- Correctly use public key
      algorithms: ['RS256'],
    });
  }
}
