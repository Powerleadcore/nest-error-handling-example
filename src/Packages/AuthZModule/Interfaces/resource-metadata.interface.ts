import { AccessLevelResolver } from "./access-level-resolver";
import { ResourcePermissions } from "./resource-permissions.interfaces";

export interface ResourceMetadata {
  identifier: string;
  actions: Set<string>;
  accessLevels: Map<string, {
    fn: AccessLevelResolver<any, any>,
    priority: number,
  }>;
  relationships: Set<string>;
  roles: Map<string, ResourcePermissions>;
}
