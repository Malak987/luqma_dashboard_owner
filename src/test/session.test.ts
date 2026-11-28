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
import { mapOwnerProfile } from '../features/profile/domain/profile';
import { createOwnerStoreScopeFromSession } from '../features/store/domain/ownership';

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

const storeA = 'c4a7f2d0-6f1d-4e7b-9b2e-3d6c8f4a1b22';
const storeB = 'd8f1a3c6-5b2e-4d9a-8c70-1f6b3e5a9d55';

function session(overrides: Partial<Session> = {}): Session {
  return {
    token: 'test-jwt-value',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    storeId: storeA,
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

  it('decides access independently for every session state including missing storeId', () => {
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
    expect(decideAccess(session({ storeId: '' }))).toEqual({ kind: 'missing-store-id' });
    expect(decideAccess(session({ storeId: 'not-a-uuid' }))).toEqual({
      kind: 'missing-store-id',
    });
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

  it('derives an OwnerStoreScope only from a valid Owner session', () => {
    const valid = session();
    const scope = createOwnerStoreScopeFromSession(valid);
    expect(scope.storeId).toBe(storeA);
    expect(scope.ownerId).toBe('user-1');

    expect(() =>
      createOwnerStoreScopeFromSession(
        session({ user: { userId: 'u', userName: 'A', role: 'Admin' as unknown as 'Owner' } }),
      ),
    ).toThrow();
    expect(() => createOwnerStoreScopeFromSession(session({ storeId: '' }))).toThrow();
    expect(() => createOwnerStoreScopeFromSession(null)).toThrow();
  });
});

describe('session storage', () => {
  it('stores and restores a valid session with its exact Store ID', () => {
    const storage = new MemoryStorage();
    const value = session();
    storeSession(value, storage);

    const loaded = loadStoredSession(storage);
    expect(loaded.reason).toBeNull();
    expect(loaded.session?.token).toBe('test-jwt-value');
    expect(loaded.session?.storeId).toBe(storeA);
    expect(loaded.session?.user.role).toBe('Owner');
  });

  it('replaces the stored Store ID completely when switching accounts', () => {
    const storage = new MemoryStorage();
    storeSession(session({ token: 'token-a', storeId: storeA }), storage);
    expect(loadStoredSession(storage).session?.storeId).toBe(storeA);

    clearStoredSession(storage);
    storeSession(
      session({
        token: 'token-b',
        storeId: storeB,
        user: { userId: 'user-2', userName: 'Owner Two', role: 'Owner' },
      }),
      storage,
    );

    const restored = loadStoredSession(storage);
    expect(restored.reason).toBeNull();
    expect(restored.session?.storeId).toBe(storeB);
    expect(restored.session?.storeId).not.toBe(storeA);
    expect(restored.session?.user.userId).toBe('user-2');
  });

  it('never lets GetProfile (which lacks storeId) overwrite the Login Store ID', () => {
    const storage = new MemoryStorage();
    const activeSession = session({ storeId: storeA });
    storeSession(activeSession, storage);

    const profile = mapOwnerProfile({
      id: 'user-1',
      name: 'Nour Hassan',
      email: 'owner@example.com',
      phoneNumber: '+20 100 000 0000',
      address: 'Cairo',
      role: 'Owner',
      emailConfirmed: true,
      isArchived: false,
      createAt: '2026-11-11T16:31:10Z',
      updateAt: '0001-01-01T00:00:00',
    });

    expect(profile).not.toHaveProperty('storeId');
    expect(loadStoredSession(storage).session?.storeId).toBe(storeA);
  });

  it('clears an expired session (including its Store ID) and reports expiry', () => {
    const storage = new MemoryStorage();
    storeSession(session({ expiresAt: new Date(Date.now() - 1000).toISOString() }), storage);

    const loaded = loadStoredSession(storage);
    expect(loaded.session).toBeNull();
    expect(loaded.reason).toBe('expired');
    expect(storage.has(SESSION_STORAGE_KEY)).toBe(false);
  });

  it('clears and rejects a stored session that is missing a Store ID', () => {
    const storage = new MemoryStorage();
    const withoutStore = {
      token: 'test-jwt-value',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      user: { userId: 'user-1', userName: 'Nour Hassan', role: 'Owner' },
    };
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(withoutStore));

    const loaded = loadStoredSession(storage);
    expect(loaded.session).toBeNull();
    expect(loaded.reason).toBe('missing-store-id');
    expect(storage.has(SESSION_STORAGE_KEY)).toBe(false);
  });

  it('clears and rejects a stored session with a malformed Store ID', () => {
    const storage = new MemoryStorage();
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session({ storeId: 'not-a-uuid' })));

    const loaded = loadStoredSession(storage);
    expect(loaded.session).toBeNull();
    expect(loaded.reason).toBe('invalid-session');
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

  it('clears the local session and Store ID on sign-out without needing an API call', () => {
    const storage = new MemoryStorage();
    storeSession(session(), storage);
    clearStoredSession(storage);
    expect(storage.has(SESSION_STORAGE_KEY)).toBe(false);
    expect(loadStoredSession(storage).session).toBeNull();
  });
});
