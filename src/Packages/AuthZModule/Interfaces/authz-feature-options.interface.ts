import { ResourceDefinition } from './resource-definition.interface';
export interface AuthZFeatureOptions {
  resources : {
    name: string,
    definition: ResourceDefinition<any, any, any, any, any, any>
  }[]
}
