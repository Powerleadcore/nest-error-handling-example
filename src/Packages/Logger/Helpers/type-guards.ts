import { ILog } from '../Interfaces/iLog';
import { LogCategory } from '../Enums/logCategory.enum';

/**
 * Type guard to check if an object is a valid ILog
 */
export function isILog(obj: any): obj is ILog {
  return (
    obj &&
    typeof obj === 'object' &&
    'category' in obj &&
    'payload' in obj &&
    Object.values(LogCategory).includes(obj.category) &&
    obj.payload !== null &&
    typeof obj.payload === 'object'
  );
}
