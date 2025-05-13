import * as bcrypt from 'bcryptjs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class HashService {
  private readonly saltOrRounds = 10;

  async hash(text: string): Promise<string> {
    try {
      const hashedText: string = await bcrypt.hash(text, this.saltOrRounds);
      return hashedText;
    } catch (error) {
      console.error('Error hashing text:', error);
      throw new Error('Failed to hash text');
    }
  }

  async validate(text: string, hash: string): Promise<boolean> {
    try {
      // Use an explicit variable with type annotation
      const isValid: boolean = await bcrypt.compare(text, hash);
      return isValid;
    } catch (error) {
      console.error('Error validating hash:', error);
      throw new Error('Failed to validate hash');
    }
  }
}
