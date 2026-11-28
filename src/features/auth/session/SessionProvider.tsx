import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { configureApiAuth } from '../../../lib/api/client';
import { login, logout } from '../api/auth.api';
import { AuthError, isSessionExpired, type AuthFailureReason, type Session } from '../domain/session';
import { performLogout } from '../domain/logout';
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

  // Kept synchronously in sync with session transitions so child effects
  // triggered immediately after login or account switching always read the
  // latest token without a mount/cleanup reset gap.
  const sessionRef = useRef<Session | null>(initial.session);
  const sessionEpochRef = useRef(0);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const invalidateSession = useCallback((reason: AuthFailureReason) => {
    sessionEpochRef.current += 1;
    sessionRef.current = null;
    clearStoredSession();
    setSession(null);
    setAuthError(reason);
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<Session> => {
    // Clear any previous user's token and Store ID before starting a new
    // sign-in so an account switch (or failed sign-in) can never retain or
    // reuse the previous account's session or restaurant scope.
    const epoch = ++sessionEpochRef.current;
    sessionRef.current = null;
    clearStoredSession();
    setSession(null);
    setAuthError(null);

    const next = await login({ email, password });
    if (sessionEpochRef.current !== epoch) {
      throw new AuthError('invalid-session');
    }

    sessionRef.current = next;
    storeSession(next);
    setSession(next);
    return next;
  }, []);

  /**
   * Local state is cleared before the remote logout starts, so a failed remote
   * call can never leave the user locally authenticated. The captured token is
   * passed explicitly because the session is already gone when the request runs.
   */
  const signOut = useCallback((): Promise<boolean> => {
    const token = sessionRef.current?.token ?? null;

    return performLogout({
      clearLocal: () => {
        sessionEpochRef.current += 1;
        sessionRef.current = null;
        clearStoredSession();
        setSession(null);
        setAuthError(null);
      },
      remoteLogout: token ? () => logout(token) : undefined,
    });
  }, []);

  useEffect(() => {
    const releaseApiAuth = configureApiAuth({
      getToken: () => {
        const current = sessionRef.current;
        if (!current || isSessionExpired(current)) {
          return null;
        }
        return current.token;
      },
      onUnauthorized: () => invalidateSession('expired'),
    });
    setAuthReady(true);

    return () => {
      releaseApiAuth();
      setAuthReady(false);
    };
  }, [invalidateSession]);

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
