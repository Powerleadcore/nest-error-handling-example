import { SetMetadata } from '@nestjs/common';
import { AUTH_Z_DECORATOR } from '../authz.constants';

export const HasPermission = (
  resource: string,
  action: string,
  accessLevels?: string[],
) => SetMetadata(AUTH_Z_DECORATOR, {
  resource,
  action,
  accessLevels,
});
