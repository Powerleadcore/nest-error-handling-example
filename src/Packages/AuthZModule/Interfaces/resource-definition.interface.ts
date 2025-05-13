import { AccessLevelResolver } from "./access-level-resolver";
export type ResourceDefinition<
  Actions extends string,
  AccessLevels extends string,
  Relationships extends string,
  Roles extends string,
  Context,
  Resource extends Record<string, any>,
> = {
  identifier: keyof Resource;
  actions: Record<string, string>;
  accessLevels: Record<AccessLevels, {
    fn: AccessLevelResolver<Context, Resource>,
    priority: number,
  }>;
  relationships: Record<string, string>;
  roles: Partial<Record<
    Roles,
    {
      permissions: Partial<Record<Actions, Array<`${AccessLevels}` | AccessLevels>>>; //how can we make this array unique
      relationships: Array<`${Relationships}` | Relationships>;
    }
  >>;
};