import { AsyncLocalStorage } from 'async_hooks';
import { iGlobalContext } from '../Interfaces/iGlobalContext';

export const requestStorage = new AsyncLocalStorage<iGlobalContext>();

export function getCorrelationId(): string | null {
  const store = requestStorage.getStore();
  return store ? store.correlationId : null;
}
