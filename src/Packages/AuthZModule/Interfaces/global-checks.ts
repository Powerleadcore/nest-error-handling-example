import { ContextType } from "./context";

export type GlobalCheck<Context extends ContextType> = {
  name: string,
  message: string,
  fn: (Context: Context) => boolean,
};