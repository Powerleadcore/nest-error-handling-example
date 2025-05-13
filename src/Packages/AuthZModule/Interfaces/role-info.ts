import { RoleDefinition } from "./role-definition";

export interface RoleInfo {
  role: string;
  roleDefinition: RoleDefinition;
  permissions: Record<string, {
    actions: Map<string, string[]>;
    relationships: Set<string>;
  }>;
}