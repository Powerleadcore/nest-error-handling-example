import * as crypto from 'crypto';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CryptoService {
  generateUUID(): string {
    return crypto.randomUUID();
  }

  generateRandomSting(length: number = 8): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, characters.length);
      otp += characters[randomIndex];
    }
    return otp;
  }

  generateHASH(): string {
    return crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');
  }
}
