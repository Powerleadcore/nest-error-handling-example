import { SetMetadata } from '@nestjs/common';
import { AUTH_N_DECORATOR } from '../authz.constants';

export const Public = () => SetMetadata(AUTH_N_DECORATOR, false);
