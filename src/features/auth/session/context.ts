import { createContext, useContext } from 'react';
import type { AuthFailureReason, Session } from '../domain/session';

export interface SessionContextValue {
  session: Session | null;
  status: 'authenticated' | 'anonymous';
  authReady: boolean;
  authError: AuthFailureReason | null;
  signIn: (email: string, password: string) => Promise<Session>;
  /** Clears local state synchronously and resolves when remote logout finishes. */
  signOut: () => Promise<boolean>;
  invalidateSession: (reason: AuthFailureReason) => void;
  clearAuthError: () => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return context;
}

/** For components rendered only inside RequireAuth. */
export function useAuthenticatedSession(): Session {
  const { session } = useSession();
  if (!session) {
    throw new Error('An authenticated session is required here');
  }
  return session;
}
