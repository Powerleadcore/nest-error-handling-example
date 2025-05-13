export type RolesDefinitions<
  Roles extends string | number | symbol,
  RoleDefinition extends object,
> = Record<Roles, RoleDefinition>;
