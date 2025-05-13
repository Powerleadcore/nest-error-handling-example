import { DynamicModule, Module, OnModuleInit } from '@nestjs/common';
import { AuthZRootOptions } from './Interfaces/authz-root-options.interface';
import { AuthZRegistry } from './authz.registry';
import { AUTH_Z_CONTEXT_RESOLVER, AUTH_Z_MODULE_SERVICE, AUTH_Z_REQUEST_CONTEXT } from './authz.constants';
import { AuthZService } from './Services/authz.service';
import { AuthZFeatureOptions } from './Interfaces/authz-feature-options.interface';
import { RoleDefinition } from './Interfaces/role-definition';
import { ContextInterceptor } from './Interceptors/context.intercepor';
import { ContextType } from './Interfaces/context';
import { AsyncLocalStorage } from 'async_hooks';

@Module({})
export class AuthZModule {

  static forRoot<
    Roles extends string | number | symbol,
    _RoleDefinition extends RoleDefinition,
    Context extends ContextType,
  >(options: AuthZRootOptions<Roles, _RoleDefinition, Context>): DynamicModule {
    AuthZRegistry.InitRegistry(options);
    return {
      global: true,
      module: AuthZModule,
      providers: [
        {
          provide: AUTH_Z_CONTEXT_RESOLVER,
          useValue: options.contextResolver,
        },
        {
          provide: AUTH_Z_REQUEST_CONTEXT,
          useValue: new AsyncLocalStorage<Context>(),
        },
        {
          provide: 'APP_INTERCEPTOR',
          useClass: ContextInterceptor,
        },
        {
          provide: AUTH_Z_MODULE_SERVICE,
          useClass: AuthZService,
        },
      ],
      exports: [AUTH_Z_MODULE_SERVICE],
    };
  }

  static forFeature(options: AuthZFeatureOptions): DynamicModule {
    AuthZRegistry.InitResources(options);
    return {
      module: AuthZModule,
      providers: [],
      exports: [],
    };
  }
}
