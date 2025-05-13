import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { AUTH_N_DECORATOR, AUTH_Z_CONTEXT_RESOLVER, AUTH_Z_DECORATOR, AUTH_Z_MODULE_SERVICE, AUTH_Z_REQUEST_CONTEXT } from '../authz.constants';
import { ContextResolver } from '../Interfaces/context-resolver';
import { ContextType } from '../Interfaces/context';
import { AuthZService } from '../Services/authz.service';
import { AuthZRegistry } from '../authz.registry';

@Injectable()
export class ContextInterceptor implements NestInterceptor {
  constructor(
    @Inject(AUTH_Z_CONTEXT_RESOLVER) private readonly contextResolver: ContextResolver,
    @Inject(AUTH_Z_REQUEST_CONTEXT) private readonly localStorage: AsyncLocalStorage<ContextType | null>,
    @Inject(AUTH_Z_MODULE_SERVICE) private readonly authZService: AuthZService<any, any>,
    private readonly reflector: Reflector,
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Get authentication requirements from handler metadata
    const isPublic = this.reflector.get<boolean>(AUTH_N_DECORATOR, context.getHandler()) === false;

    // If not explicitly marked as public, we require authentication
    const requiresAuth = !isPublic;

    // Check if route has permission requirements
    const permissionReq = this.reflector.get<{
      resource: string,
      action: string,
      accessLevels?: string[],
    }>(AUTH_Z_DECORATOR, context.getHandler());

    // Resolve application context from the request
    let appContext: ContextType | null = null;
    try {
      appContext = this.contextResolver(context) || null;
    } catch (error) {
      // Use registry's throw function with proper audit info
      throw AuthZRegistry.getAuthNExceptionFunction()({
        method: 'intercept',
        resource: 'system',
        userId: 'unknown',
        result: 'deny',
        message: 'Failed to resolve context'
      });
    }

    // If authentication is required but no context is available, deny access
    if (requiresAuth && !appContext) {
      throw AuthZRegistry.getAuthNExceptionFunction()({
        method: 'intercept',
        resource: 'authentication',
        userId: 'unknown',
        result: 'deny',
        message: 'Authentication required'
      });
    }

    // Run the handler with the resolved context
    return new Observable(subscriber => {
      this.localStorage.run(appContext, () => {
        // Early permission check - if permissions are required, validate them before continuing
        if (permissionReq && appContext) {
          // Use hasPermission which already has audit log support
          this.authZService.hasPermission(
            permissionReq.resource,
            permissionReq.action,
            permissionReq.accessLevels
          );
        }
        next.handle().subscribe({
          next: value => subscriber.next(value),
          error: err => subscriber.error(err),
          complete: () => subscriber.complete()
        });
      });
    });
  }
}