import { LogCategory } from '../Enums/logCategory.enum';

export interface ILog {
  category: LogCategory;
  payload: Record<string, any>;
}
