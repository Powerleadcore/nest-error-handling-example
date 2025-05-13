import { iUser, User } from '@Modules/Identity/Users/Domain';
import { Profile } from '@Modules/Identity/Users/Domain/Entities/profile';
import { EmailVerification } from '@Modules/Identity/Users/Domain/Value-Objects/emailVerification';
import { PasswordReset } from '@Modules/Identity/Users/Domain/Value-Objects/passwordReset';
import { UserSettings } from '@Modules/Identity/Users/Domain/Value-Objects/userSettings';

export class UserMapper {
  /**
   * Converts a domain User entity to a database-ready iUser object
   */
  static FromDomainToDatabase(user: User): iUser {
    // We can use the toJSON method from the User domain entity
    // which already formats the data correctly for database storage
    return user.toJSON();
  }

  /**
   * Reconstructs a domain User entity from database data
   */
  static FromDatabaseToDomain(raw: iUser): User {
    // Create profile from raw data
    const profile = new Profile(
      raw.profile.profileId,
      raw.profile.firstName,
      raw.profile.lastName,
      raw.profile.phoneNumber,
      raw.profile.createAt,
      raw.profile.updateAt,
      raw.profile.deleteAt,
    );

    // Create email verification from raw data
    const emailVerification = raw.emailVerification
      ? new EmailVerification(
          raw.emailVerification.token,
          raw.emailVerification.expiry,
          raw.emailVerification.status,
        )
      : EmailVerification.create({ token: '' });

    // Create password reset if it exists
    const passwordReset = raw.passwordReset
      ? new PasswordReset(
          raw.passwordReset.token,
          raw.passwordReset.expiry,
          raw.passwordReset.requestTime,
          raw.passwordReset.status,
        )
      : null;

    // Create user settings
    const userSettings = new UserSettings(raw.userSettings.is2faEnabled);

    // Create and return domain User entity
    return new User(
      raw.userId,
      raw.email,
      raw.password,
      raw.currency,
      raw.status,
      profile,
      emailVerification,
      passwordReset,
      userSettings,
      raw.role,
      raw.rank,
      raw.createAt,
      raw.updateAt,
      raw.deleteAt,
    );
  }
}
