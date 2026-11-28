import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ScopedRequestRunner } from '../../../lib/scopedRequest';
import { useSession } from '../../auth/session/context';
import { getStoreById } from '../api/store.api';
import { createOwnerStoreScopeFromSession, type OwnerStoreScope } from '../domain/ownership';
import type { OwnerStore } from '../domain/store';
import { StoreContext, type StoreContextValue, type StoreStatus } from './context';

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  const { authReady, session } = useSession();
  const [store, setStore] = useState<OwnerStore | null>(null);
  const [status, setStatus] = useState<StoreStatus>('idle');
  const [error, setError] = useState<unknown>(null);
  const runnerRef = useRef<ScopedRequestRunner | null>(null);
  if (!runnerRef.current) {
    runnerRef.current = new ScopedRequestRunner();
  }

  const scope = useMemo<OwnerStoreScope | null>(() => {
    if (!session) {
      return null;
    }
    try {
      return createOwnerStoreScopeFromSession(session);
    } catch {
      return null;
    }
  }, [session]);

  const loadStore = useCallback(
    (activeScope: OwnerStoreScope, dedupe = false): Promise<void> =>
      runnerRef.current!.run(
        (signal) => getStoreById(activeScope, signal),
        {
          onStart: () => {
            setStatus('loading');
            setError(null);
          },
          onSuccess: (next) => {
            setStore(next);
            setStatus('success');
          },
          onError: (caught) => {
            setStore(null);
            setError(caught);
            setStatus('error');
          },
        },
        { dedupe },
      ),
    [],
  );

  const reload = useCallback(async () => {
    if (!scope) {
      runnerRef.current!.cancel();
      setStore(null);
      setStatus('idle');
      setError(null);
      return;
    }

    await loadStore(scope, true);
  }, [loadStore, scope]);

  useEffect(() => {
    // Restaurant state is strictly scoped to the current authenticated Owner
    // session. Clear it immediately on logout or account switch so a previous
    // user's restaurant context can never bleed into another session.
    const runner = runnerRef.current!;
    runner.cancel();
    setStore(null);
    setError(null);

    if (!session || !scope) {
      setStatus('idle');
      return;
    }

    if (!authReady) {
      return;
    }

    void loadStore(scope, false);

    return () => {
      runner.cancel();
    };
  }, [authReady, loadStore, scope, session]);

  const value = useMemo<StoreContextValue>(
    () => ({
      store,
      scope,
      status,
      error,
      reload,
    }),
    [error, reload, scope, status, store],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
