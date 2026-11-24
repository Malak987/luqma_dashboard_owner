import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { configureApiAuth, resetApiAuth } from '../../../lib/api/client';
import { login, logout } from '../api/auth.api';
import type { AuthFailureReason, Session } from '../domain/session';
import { performLogout } from '../domain/logout';
import { isSessionExpired } from '../domain/session';
import { SessionContext, type SessionContextValue } from './context';
import { clearStoredSession, loadStoredSession, storeSession } from './storage';

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [initial] = useState(() => loadStoredSession());
  const [session, setSession] = useState<Session | null>(initial.session);
  const [authError, setAuthError] = useState<AuthFailureReason | null>(initial.reason);
  const [authReady, setAuthReady] = useState(false);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const invalidateSession = useCallback((reason: AuthFailureReason) => {
    clearStoredSession();
    setSession(null);
    setAuthError(reason);
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<Session> => {
    setAuthError(null);
    const next = await login({ email, password });
    storeSession(next);
    setSession(next);
    return next;
  }, []);

  /**
   * Local state is cleared before the remote logout starts, so a failed remote
   * call can never leave the user locally authenticated. The captured token is
   * passed explicitly because the session is already gone when the request runs.
   */
  const signOut = useCallback(() => {
    const token = session?.token ?? null;

    void performLogout({
      clearLocal: () => {
        clearStoredSession();
        setSession(null);
        setAuthError(null);
      },
      remoteLogout: token ? () => logout(token) : undefined,
    });
  }, [session]);

  useEffect(() => {
    configureApiAuth({
      getToken: () => session?.token ?? null,
      onUnauthorized: () => invalidateSession('expired'),
    });
    setAuthReady(true);

    return () => {
      resetApiAuth();
      setAuthReady(false);
    };
  }, [invalidateSession, session]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const checkExpiry = () => {
      if (isSessionExpired(session)) {
        invalidateSession('expired');
      }
    };

    checkExpiry();
    const timer = window.setInterval(checkExpiry, 15_000);
    return () => window.clearInterval(timer);
  }, [invalidateSession, session]);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      status: session ? 'authenticated' : 'anonymous',
      authReady,
      authError,
      signIn,
      signOut,
      invalidateSession,
      clearAuthError,
    }),
    [authError, authReady, clearAuthError, invalidateSession, session, signIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
