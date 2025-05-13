import { ExecutionContext } from "@nestjs/common";
import { ContextType } from "./context";

export type ContextResolver<Context extends ContextType = ContextType> = (ctx: ExecutionContext) => Context | null;