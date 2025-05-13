import { BaseContext } from "@Packages/AuthZModule/Interfaces/base-context.interface";
import Roles from "../Enums/roles.enums";

export interface Context extends BaseContext<Roles>{
  isActive: boolean;
  assignedUsers: string[];
  [key: string]: any;
}