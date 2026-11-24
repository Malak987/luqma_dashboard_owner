import { describe, expect, it } from 'vitest';
import {
  decideAccess,
  isAllowedRole,
  isSessionExpired,
  safeReturnPath,
  type Session,
} from '../features/auth/domain/session';
import {
  clearStoredSession,
  loadStoredSession,
  SESSION_STORAGE_KEY,
  storeSession,
  type StorageLike,
} from '../features/auth/session/storage';

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  has(key: string): boolean {
    return this.values.has(key);
  }
}

function session(overrides: Partial<Session> = {}): Session {
  return {
    token: 'test-jwt-value',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    user: { userId: 'user-1', userName: 'Nour Hassan', role: 'Owner' },
    ...overrides,
  };
}

describe('role and session authorization', () => {
  it('allows only the exact Owner role', () => {
    expect(isAllowedRole('Owner')).toBe(true);
    expect(isAllowedRole('Admin')).toBe(false);
    expect(isAllowedRole('owner')).toBe(false);
    expect(isAllowedRole('ADMIN')).toBe(false);
    expect(isAllowedRole('Manager')).toBe(false);
    expect(isAllowedRole('')).toBe(false);
    expect(isAllowedRole(undefined)).toBe(false);
  });

  it('decides access independently for every session state', () => {
    expect(decideAccess(null)).toEqual({ kind: 'login' });
    expect(decideAccess(session())).toEqual({ kind: 'allow' });
    expect(
      decideAccess(
        session({ user: { userId: 'u', userName: 'N', role: 'Admin' as unknown as 'Owner' } }),
      ),
    ).toEqual({ kind: 'forbidden' });
    expect(
      decideAccess(session({ expiresAt: new Date(Date.now() - 1000).toISOString() })),
    ).toEqual({ kind: 'expired' });
    expect(
      decideAccess(
        session({
          user: { userId: 'u', userName: 'N', role: 'Manager' as unknown as 'Owner' },
        }),
      ),
    ).toEqual({ kind: 'forbidden' });
  });

  it('detects expiry and malformed expiry values', () => {
    const now = Date.now();
    expect(isSessionExpired(session({ expiresAt: new Date(now + 5000).toISOString() }), now)).toBe(
      false,
    );
    expect(isSessionExpired(session({ expiresAt: new Date(now - 5000).toISOString() }), now)).toBe(
      true,
    );
    expect(isSessionExpired(session({ expiresAt: 'not-a-date' }), now)).toBe(true);
  });

  it('allows only safe internal return paths', () => {
    expect(safeReturnPath('/orders?page=2')).toBe('/orders?page=2');
    expect(safeReturnPath('/settings')).toBe('/settings');
    expect(safeReturnPath('https://evil.example')).toBe('/');
    expect(safeReturnPath('//evil.example')).toBe('/');
    expect(safeReturnPath('/login')).toBe('/');
    expect(safeReturnPath(undefined)).toBe('/');
  });
});

describe('session storage', () => {
  it('stores and reloads a valid session', () => {
    const storage = new MemoryStorage();
    const value = session();
    storeSession(value, storage);

    const loaded = loadStoredSession(storage);
    expect(loaded.reason).toBeNull();
    expect(loaded.session?.token).toBe('test-jwt-value');
    expect(loaded.session?.user.role).toBe('Owner');
  });

  it('clears an expired session and reports expiry', () => {
    const storage = new MemoryStorage();
    storeSession(session({ expiresAt: new Date(Date.now() - 1000).toISOString() }), storage);

    const loaded = loadStoredSession(storage);
    expect(loaded.session).toBeNull();
    expect(loaded.reason).toBe('expired');
    expect(storage.has(SESSION_STORAGE_KEY)).toBe(false);
  });

  it('clears and rejects an Admin stored session', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify(
        session({
          user: { userId: 'u', userName: 'N', role: 'Admin' as unknown as 'Owner' },
        }),
      ),
    );

    const loaded = loadStoredSession(storage);
    expect(loaded.session).toBeNull();
    expect(loaded.reason).toBe('role-not-allowed');
    expect(storage.has(SESSION_STORAGE_KEY)).toBe(false);
  });

  it('clears and rejects other unsupported stored roles', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify(
        session({
          user: { userId: 'u', userName: 'N', role: 'Manager' as unknown as 'Owner' },
        }),
      ),
    );

    const loaded = loadStoredSession(storage);
    expect(loaded.session).toBeNull();
    expect(loaded.reason).toBe('role-not-allowed');
  });

  it('clears malformed and missing-role session payloads', () => {
    const storage = new MemoryStorage();
    storage.setItem(SESSION_STORAGE_KEY, '{bad-json');
    expect(loadStoredSession(storage)).toEqual({ session: null, reason: 'invalid-session' });

    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ token: 't', expiresAt: new Date(Date.now() + 5000).toISOString(), user: {} }),
    );
    expect(loadStoredSession(storage)).toEqual({ session: null, reason: 'invalid-session' });
    expect(storage.has(SESSION_STORAGE_KEY)).toBe(false);
  });

  it('clears the local session on sign-out without needing an API call', () => {
    const storage = new MemoryStorage();
    storeSession(session(), storage);
    clearStoredSession(storage);
    expect(storage.has(SESSION_STORAGE_KEY)).toBe(false);
    expect(loadStoredSession(storage).session).toBeNull();
  });
});
