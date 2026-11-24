import type { AuthFailureReason, Session } from '../domain/session';
import { isAllowedRole, isSessionExpired } from '../domain/session';

export const SESSION_STORAGE_KEY = 'luqma.session';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LoadedSession {
  session: Session | null;
  reason: AuthFailureReason | null;
}

function defaultStorage(): StorageLike | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.sessionStorage;
}

function isSessionShape(value: unknown): value is Session {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const user = candidate.user;
  if (!user || typeof user !== 'object') {
    return false;
  }
  const userRecord = user as Record<string, unknown>;
  return (
    typeof candidate.token === 'string' &&
    candidate.token.trim() !== '' &&
    typeof candidate.expiresAt === 'string' &&
    typeof userRecord.userId === 'string' &&
    userRecord.userId.trim() !== '' &&
    typeof userRecord.userName === 'string' &&
    userRecord.userName.trim() !== '' &&
    typeof userRecord.role === 'string' &&
    userRecord.role.trim() !== ''
  );
}

/**
 * Only the access token, expiry, and non-sensitive identity fields are stored.
 * Passwords are never persisted. sessionStorage is readable by JavaScript and is
 * not equivalent to an HttpOnly cookie; the backend remains authoritative.
 */
export function storeSession(session: Session, storage: StorageLike | null = defaultStorage()): void {
  if (!storage) {
    return;
  }
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession(storage: StorageLike | null = defaultStorage()): void {
  storage?.removeItem(SESSION_STORAGE_KEY);
}

export function loadStoredSession(
  storage: StorageLike | null = defaultStorage(),
  now = Date.now(),
): LoadedSession {
  if (!storage) {
    return { session: null, reason: null };
  }

  const raw = storage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return { session: null, reason: null };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    clearStoredSession(storage);
    return { session: null, reason: 'invalid-session' };
  }

  if (!isSessionShape(parsed)) {
    clearStoredSession(storage);
    return { session: null, reason: 'invalid-session' };
  }

  if (!isAllowedRole(parsed.user.role)) {
    clearStoredSession(storage);
    return { session: null, reason: 'role-not-allowed' };
  }

  if (isSessionExpired(parsed, now)) {
    clearStoredSession(storage);
    return { session: null, reason: 'expired' };
  }

  return { session: parsed, reason: null };
}
