# Overview

AuthZModule is a comprehensive authorization system for NestJS applications that provides fine-grained access control management. It supports role-based access control (RBAC) with additional features for advanced permission checks, including context-aware authorization and audit logging.

> **IMPORTANT**: This module strictly enforces the use of TypeScript enums for all authorization entities (roles, resources, actions, access levels, and relationships) to ensure type safety and prevent runtime errors.

## How the Module Works Behind the Scenes

### Core Components

1. **AuthZRegistry**: The central singleton that stores all authorization configurations:
   - Role definitions and their permissions
   - Resource definitions with their actions, access levels, and relationships
   - Global checks for context validation
   - Exception generators and audit logging functions

2. **AuthZService**: The service that exposes the authorization API to application code:
   - Provides methods to check permissions (`hasPermission`, `can`, `canBe`)
   - Evaluates access levels for resources (`getAccessLevel`)
   - Accesses the registry to validate permissions against the current context
   - Handles audit logging and exception generation

3. **ContextInterceptor**: Manages the application context:
   - Extracts user context from requests
   - Stores context in AsyncLocalStorage for access throughout the request lifecycle
   - Performs early permission checks based on decorators

4. **Middleware & Decorators**: Provide simple APIs for securing routes and methods

### Key Concepts

- **Context**: User-specific information (userId, role, etc.) used to make authorization decisions
- **Resources**: Domain entities that need authorization (e.g., User, Order)
- **Actions**: Operations that can be performed on resources (e.g., CREATE, READ)
- **Access Levels**: Conditional permissions with priority (e.g., OWN, ALL)
- **Relationships**: Associations between users and resources (e.g., OWNER)

## Required Enum Definitions

The module requires proper TypeScript enums for type safety and consistency:

```typescript
// Required enum definitions
export enum Roles {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  SELLER = 'SELLER',
  USER = 'USER',
}

export enum Resources {
  USER = 'USER',
  PRODUCT = 'PRODUCT',
  ORDER = 'ORDER',
  // Other resources...
}

export enum UserActions {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LIST = 'LIST',
}

export enum UserAccessLevels {
  ALL = 'ALL',
  ALL_RANK = 'ALL_RANK',
  OWN = 'OWN',
  ASSIGNED = 'ASSIGNED',
}

export enum UserRelationships {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
}
```

## Lifecycle

1. **Module Initialization**:
   - **Root Initialization** (`forRoot`): Configures roles, resources, context resolver, and global settings
   - **Feature Registration** (`forFeature`): Registers resource definitions with detailed permission configurations

2. **Request Processing**:
   - **Context Resolution**: The `ContextInterceptor` extracts context from the request (using JWT middleware)
   - **Context Storage**: The resolved context is stored in AsyncLocalStorage for the request duration
   - **Early Permission Check**: Validates any permissions required by decorators

3. **Authorization Flow**:
   - **Context Retrieval**: Any authorization check first retrieves the current user context
   - **Global Checks**: Validates global conditions (e.g., account is active)
   - **Permission Evaluation**: Checks specific permissions against role definitions
   - **Access Level Resolution**: For resource-specific checks, evaluates access level functions
   - **Audit & Result**: Generates audit logs and throws exceptions for denied access

## Decorator Usage

### @Public()

Makes a route publicly accessible without authentication:

```typescript
@Public()
@Get('public-route')
publicRoute() {
  return { message: 'This is public' };
}
```

### @AuthN()

Requires authentication (useful when a controller has `@Public()` routes but others need auth):

```typescript
@AuthN()
@Get('protected-route')
protectedRoute() {
  return { message: 'Authenticated' };
}
```

### @HasPermission()

Requires specific permissions for a resource action:

```typescript
// Always use enum values, never string literals
@HasPermission(Resources.USER, UserActions.READ, [UserAccessLevels.OWN])
@Get('profile')
getProfile() {
  // Only users with READ permission and OWN access level can access
  return this.userService.getCurrentUser();
}
```

## Library Usage

### Defining Required Enums

Before configuring the module, you must define the required enums:

```typescript
export enum Roles {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  SELLER = 'SELLER',
  USER = 'USER',
}

export enum Resources {
  USER = 'USER',
  PRODUCT = 'PRODUCT',
  ORDER = 'ORDER',
}

// Resource-specific actions
export enum UserActions {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LIST = 'LIST',
}

// Resource-specific access levels
export enum UserAccessLevels {
  ALL = 'ALL',
  ALL_RANK = 'ALL_RANK',
  OWN = 'OWN',
  ASSIGNED = 'ASSIGNED',
}

// Resource-specific relationships
export enum UserRelationships {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
}
```

### Root Module Configuration

```typescript
// In your AuthZ module (e.g., src/Modules/AuthZ/index.module.ts)
@Global()
@Module({
  imports: [
    AuthZModule.forRoot<Roles, RoleDefinition, Context>({
      // Define all possible roles and their properties
      // Must use Roles enum keys
      roles: rolesDefinition,
      
      // Set default role for new users (must use enum value)
      default: Roles.SELLER,
      
      // Register all resource names (must use Resources enum)
      resources: Resources,
      
      // Define global checks that apply to all authorization requests
      globalChecks: [{
        name: "ActiveAccount",
        message: "account is not active",
        fn: (context) => context.isActive,
      }],
      
      // Define how to extract the context from requests
      contextResolver: (ctx): Context | null => {
        const request = ctx.switchToHttp().getRequest();
        const context = request.context;
        return context || null;
      },
      
      // Enable audit logging
      log: true,
      
      // Configure the logger function
      logger: (result) => {
        if (result.result === 'deny') {
          Logger.warn(result.message, { payload: result, category: LogCategory.SECURITY }, 'AuthZModule');
        } else {
          Logger.log(result.message, { payload: result, category: LogCategory.SECURITY }, 'AuthZModule');
        }
      },
      
      // Configure authorization exception generator
      authZException: (result) => {
        return new AuthZException(result.message, result);
      },
      
      // Configure authentication exception generator
      authNException: (result) => {
        return new AuthNException(result.message, result);
      }
    }),
  ],
  exports: [AuthZModule],
})
export class AuthZ {}
```

### Feature Module Configuration

```typescript
// In a resource module (e.g., UsersModule)
@Module({
  imports: [
    TypeOrmModule.forFeature([UserSchema, ProfileSchema]),
    AuthZModule.forFeature({
      resources: [
        {
          // Must use Resources enum value
          name: Resources.USER,
          definition: UserAuthZDefinition,
        },
      ],
    })
  ],
  providers: [],
  controllers: [],
  exports: [TypeOrmModule],
})
export class UsersModule {}
```

### Resource Definition

```typescript
// Define authorization configuration for a resource
// Use proper generic type parameters for strict type checking
export const UserAuthZDefinition: ResourceDefinition<UserActions, UserAccessLevels, UserRelationships, Roles, Context, User> = {
  // Unique identifier property in the resource entity
  identifier: 'userId',
  
  // Define all possible actions on this resource (must use enum)
  actions: UserActions,
  
  // Define all possible relationships users can have with this resource (must use enum)
  relationships: UserRelationships,
  
  // Define access levels with resolver functions and priority (must use enum keys)
  accessLevels: {
    [UserAccessLevels.ALL]: { fn: () => true, priority: 0 },
    [UserAccessLevels.ALL_RANK]: { fn: (ctx: Context, res: User) => ctx.rank <= res.rank, priority: 1 },
    [UserAccessLevels.OWN]: { fn: (ctx: Context, res: User) => ctx.userId === res.userId, priority: 2 },
    [UserAccessLevels.ASSIGNED]: { fn: (ctx: Context, res: User) => ctx.assignedUsers.includes(res.userId), priority: 3 },
  },
  
  // Define role-specific permissions and relationships (must use enum values)
  roles: {
    [Roles.SUPER_ADMIN]: {
      permissions: {
        [UserActions.CREATE]: [UserAccessLevels.ALL],
        [UserActions.READ]: [UserAccessLevels.ALL],
        [UserActions.LIST]: [UserAccessLevels.ALL],
        [UserActions.UPDATE]: [UserAccessLevels.ALL],
        [UserActions.DELETE]: [UserAccessLevels.ALL]
      },
      relationships: [UserRelationships.OWNER]
    },
    [Roles.ADMIN]: {
      permissions: {
        [UserActions.CREATE]: [UserAccessLevels.ALL_RANK],
        [UserActions.READ]: [UserAccessLevels.ALL_RANK],
        [UserActions.LIST]: [UserAccessLevels.ALL_RANK],
        [UserActions.UPDATE]: [UserAccessLevels.ALL_RANK],
        [UserActions.DELETE]: [UserAccessLevels.ALL_RANK]
      },
      relationships: [UserRelationships.OWNER]
    },
    // More roles...
  }
}
```

### Using the Service in Application Code

```typescript
@Injectable()
export class AppService {
  constructor(
    @Inject(AUTH_Z_MODULE_SERVICE) private authZService: AuthZService<any, any>,
    @InjectRepository(UserSchema)
    private readonly userRepository: Repository<iUser>,
  ) {}

  async getHello() {
    // Get the current user context
    const context = this.authZService.currentContext<Context>();
    const userId = context?.userId;
    
    if (!userId) {
      throw new Error('User not found');
    }
    
    const user = await this.userRepository.findOne({
      where: { userId: userId },
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if the current user has permission to read this user
    // Always use enum values, never string literals
    this.authZService.can(
      Resources.USER,
      UserActions.READ,
      user,
    );
    
    // If we reach here, permission was granted
    return UserMapper.FromDatabaseToDomain(user);
  }
  
  // Example using getAccessLevel
  async getUserWithAccessLevel(userId: string) {
    const user = await this.userRepository.findOne({
      where: { userId },
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Determine the highest access level the current user has for this resource
    const accessLevel = this.authZService.getAccessLevel(
      Resources.USER,
      UserActions.READ,
      user
    );
    
    // Now we know not just if the user can access, but how they can access it
    console.log(`Access level: ${accessLevel}`); // e.g., 'OWN', 'ALL_RANK', etc.
    
    // You can use this info to conditionally show/hide UI elements
    return {
      user: UserMapper.FromDatabaseToDomain(user),
      accessLevel: accessLevel
    };
  }
}
```

### Context Setup with Middleware

```typescript
export class JwtAuthNMiddleware implements NestMiddleware {
  constructor(
    private readonly tokenService: JwtTokenService,
    @InjectRepository(UserSchema)
    private readonly userRepository: Repository<iUser>,
  ) {}

  async use(req: any, res: any, next: () => void) {
    const token = req.headers['x-auth-token'];
    if (token) {
      const payload = await this.tokenService.verifyAccessToken(token);
      if (payload && payload.sub) {
        const user = await this.userRepository.findOne({
          where: { userId: payload.sub },
        });
        if (user) {
          // Create the context that will be used for authorization
          // Note: role must be a valid Roles enum value
          const context: Context = {
            userId: payload.sub,
            role: user.role as Roles, // Ensure this is a valid Roles enum value
            rank: user.rank,
            isActive: user.status === 'ACTIVE',
            assignedUsers: [],
          }
          // Store the context in the request for the interceptor to find
          req['context'] = context;
        }
      }
    }
    next();
  }
}
```

## AuthZService API

### Key Methods

1. **`currentContext<T = unknown>()`**: Retrieves the current user context from AsyncLocalStorage.

2. **`hasPermission(resource, action, accessLevels?)`**: Checks if the current user has permission for a resource action with specific access levels.

3. **`can(resource, action, entity)`**: Checks if the user can perform an action on a specific resource entity.

4. **`canBe(relationship, resource, entity)`**: Checks if the user has a specific relationship with a resource entity.

5. **`getAccessLevel(resource, action, entity)`**: Determines and returns the highest priority access level that the current user has for a given resource action on a specific entity.
   - Returns the access level enum value (e.g., `UserAccessLevels.OWN`)
   - Returns `null` if the user has no access
   - Useful for conditional UI rendering based on access level

```typescript
// Example of getAccessLevel usage
const accessLevel = authZService.getAccessLevel(
  Resources.USER,
  UserActions.UPDATE,
  user
);

if (accessLevel === UserAccessLevels.ALL) {
  // User has full access
  console.log('Full administrative access');
} else if (accessLevel === UserAccessLevels.OWN) {
  // User has own-only access
  console.log('Can only edit own profile');
} else if (accessLevel) {
  // User has some other access level
  console.log(`Access level: ${accessLevel}`);
} else {
  // User has no access
  console.log('No access');
}
```

## Advanced Examples

### Proper Enum Usage in Decorators

```typescript
// Controller with proper enum usage
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // Using enums for type safety - this is the ONLY acceptable approach
  @HasPermission(Resources.USER, UserActions.READ, [UserAccessLevels.ALL])
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // Using enums for type safety
  @HasPermission(Resources.USER, UserActions.READ, [UserAccessLevels.OWN])
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
```

### Custom Access Level Function Example

```typescript
// Complex access level function example with proper enum usage
export const OrderAuthZDefinition: ResourceDefinition<OrderActions, OrderAccessLevels, OrderRelationships, Roles, Context, Order> = {
  identifier: 'orderId',
  actions: OrderActions,
  relationships: OrderRelationships,
  accessLevels: {
    [OrderAccessLevels.ALL]: { 
      fn: () => true, 
      priority: 0 
    },
    [OrderAccessLevels.OWN]: { 
      fn: (ctx, order) => ctx.userId === order.userId, 
      priority: 1 
    },
    [OrderAccessLevels.DEPARTMENT]: { 
      fn: async (ctx, order) => {
        // This could be an async function that checks user's department
        const orderOwnerDept = await getDepartment(order.userId);
        return ctx.departmentId === orderOwnerDept;
      }, 
      priority: 2 
    }
  },
  roles: {
    [Roles.SUPER_ADMIN]: {
      permissions: {
        [OrderActions.READ]: [OrderAccessLevels.ALL],
        [OrderActions.UPDATE]: [OrderAccessLevels.ALL],
        [OrderActions.CANCEL]: [OrderAccessLevels.ALL]
      },
      relationships: [OrderRelationships.ADMIN]
    },
    [Roles.SELLER]: {
      permissions: {
        [OrderActions.READ]: [OrderAccessLevels.OWN, OrderAccessLevels.DEPARTMENT],
        [OrderActions.UPDATE]: [OrderAccessLevels.OWN],
        [OrderActions.CANCEL]: [OrderAccessLevels.OWN]
      },
      relationships: [OrderRelationships.OWNER]
    }
  }
}
```

### Audit Logging Example

```typescript
// Custom audit logging configuration
AuthZModule.forRoot<Roles, RoleDefinition, Context>({
  // ...other configuration with enum values
  log: true,
  logger: (result) => {
    // Custom logging implementation with full type information
    if (result.result === 'deny') {
      console.warn(`[AUTHZ-DENY] ${result.message}`, {
        userId: result.context?.userId,
        role: result.context?.role, // This will be a Roles enum value
        resource: result.resource,  // This will be a Resources enum value
        action: result.action,      // This will be an action enum value
        accessLevel: result.accessLevel, // This will be an access level enum value
      });
    } else {
      console.log(`[AUTHZ-ALLOW] User ${result.context?.userId} with role ${result.context?.role} performed ${result.action} on ${result.resource}`);
    }
  }
})
```

## For Developers Maintaining the Module

### Core Components and Their Responsibilities

#### AuthZRegistry

The registry is the single source of truth for all authorization configurations. It:

1. Validates and stores role and resource definitions
2. Provides lookup methods for permissions, roles, and resources
3. Maintains indexes for faster permission checks
4. Manages global settings and exception factories

For optimization:
- Consider adding caching for frequently accessed permission checks
- Improve index structures for large-scale applications
- Consider lazy loading of resource definitions

#### ContextInterceptor

The interceptor is responsible for context management during requests. It:

1. Extracts context using the configured resolver
2. Stores context in AsyncLocalStorage for thread-safe access
3. Performs early permission validation based on decorators

For optimization:
- Consider implementing context caching for complex resolvers
- Optimize the context resolution process for high-throughput applications

#### AuthZService

The service exposes the authorization API for application code. It:

1. Provides methods to check permissions and relationships
2. Uses the registry for configuration data
3. Handles audit logging and exception generation

For optimization:
- Consider implementing permission result caching
- Optimize access level functions for performance
- Consider batch permission checks for complex operations

### Extension Points

1. **Custom Access Level Functions**: 
   - Define complex conditions for permission evaluation
   - Use priority to create fallback chains

2. **Custom Exception Handlers**:
   - Override exception generators to integrate with custom error handling
   - Add domain-specific information to exception payloads

3. **Audit Logging**:
   - Customize logging for specific requirements (e.g., compliance)
   - Implement persistent audit trails

4. **Context Resolution**:
   - Extend the context structure for additional authorization data
   - Implement complex context resolution strategies

### Performance Optimization

1. **Permission Caching**:
   - Implement TTL caching for permission checks
   - Consider LRU caches for high-volume systems

2. **Efficient Lookups**:
   - The module maintains indexes like `resourcesByRole` for faster access
   - Consider additional indexes for your specific access patterns

3. **Evaluation Order**:
   - Access level functions run in priority order for efficiency
   - Put cheaper/more frequent checks at higher priorities

4. **Context Size**:
   - Keep context objects small and focused
   - Avoid expensive computations in context resolvers

### Error Handling

The module provides custom exception types and factories:
- `AuthNException`: For authentication failures
- `AuthZException`: For authorization failures
- `RoleNotFoundError`, `ResourceNotFoundError`, etc.: For configuration errors

These can be customized via the `authNException` and `authZException` options in the root configuration.

## Type Safety and Common Errors

### Avoiding Common Errors

1. **String Literals Instead of Enums**:
   ```typescript
   // ❌ INCORRECT: Using string literals
   @HasPermission('USER', 'READ', ['OWN'])
   
   // ✅ CORRECT: Using enum values
   @HasPermission(Resources.USER, UserActions.READ, [UserAccessLevels.OWN])
   ```

2. **Inconsistent Enum Keys**:
   ```typescript
   // ❌ INCORRECT: Inconsistent keys in role definitions
   roles: {
     'SUPER_ADMIN': { /* ... */ },  // String literal
     [Roles.ADMIN]: { /* ... */ }   // Enum value
   }
   
   // ✅ CORRECT: Consistent use of enum values
   roles: {
     [Roles.SUPER_ADMIN]: { /* ... */ },
     [Roles.ADMIN]: { /* ... */ }
   }
   ```

3. **Missing Type Parameters**:
   ```typescript
   // ❌ INCORRECT: Missing generic types
   export const UserAuthZDefinition: ResourceDefinition = {
     // ...
   }
   
   // ✅ CORRECT: Proper generic type parameters
   export const UserAuthZDefinition: ResourceDefinition<UserActions, UserAccessLevels, UserRelationships, Roles, Context, User> = {
     // ...
   }
   ```

4. **Direct String Access to AccessLevels**:
   ```typescript
   // ❌ INCORRECT: Using string literals for access levels
   accessLevels: {
     "ALL": { fn: () => true, priority: 0 },
     "OWN": { fn: (ctx, res) => ctx.userId === res.userId, priority: 1 }
   }
   
   // ✅ CORRECT: Using enum values
   accessLevels: {
     [UserAccessLevels.ALL]: { fn: () => true, priority: 0 },
     [UserAccessLevels.OWN]: { fn: (ctx, res) => ctx.userId === res.userId, priority: 1 }
   }
   ```

## Conclusion

AuthZModule provides a powerful, flexible authorization system for NestJS applications. By understanding its architecture and configuration options, developers can implement complex permission models with minimal code and maintain consistent authorization logic across their applications.

**Important**: Always use TypeScript enums for roles, resources, actions, access levels, and relationships to ensure type safety and prevent runtime errors.