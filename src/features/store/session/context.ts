import { createContext, useContext } from 'react';
import type { OwnerStoreScope } from '../domain/ownership';
import type { OwnerStore } from '../domain/store';

export type StoreStatus = 'idle' | 'loading' | 'success' | 'error';

export interface StoreContextValue {
  store: OwnerStore | null;
  scope: OwnerStoreScope | null;
  status: StoreStatus;
  error: unknown;
  reload: () => Promise<void>;
}

export const StoreContext = createContext<StoreContextValue | null>(null);

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used inside StoreProvider');
  }
  return context;
}
