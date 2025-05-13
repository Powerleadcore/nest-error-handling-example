import { BaseContext } from "./base-context.interface";

export type ContextType = Record<string, unknown> & BaseContext<any>;