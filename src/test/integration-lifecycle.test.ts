import { afterEach, describe, expect, it, vi } from 'vitest';
import { login, logout } from '../features/auth/api/auth.api';
import { performLogout } from '../features/auth/domain/logout';
import {
  clearStoredSession,
  loadStoredSession,
  SESSION_STORAGE_KEY,
  storeSession,
  type StorageLike,
} from '../features/auth/session/storage';
import { getMenuCategories } from '../features/menuCategories/api/menuCategory.api';
import type { MenuCategoryData } from '../features/menuCategories/api/menuCategory.types';
import { getStoreById } from '../features/store/api/store.api';
import { createOwnerStoreScopeFromSession } from '../features/store/domain/ownership';
import type { OwnerStore } from '../features/store/domain/store';
import { configureApiAuth, resetApiAuth } from '../lib/api/client';
import { ScopedRequestRunner } from '../lib/scopedRequest';

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

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response;
}

const ownerA = {
  userId: '11111111-1111-4111-8111-111111111111',
  userName: 'Owner A',
  token: 'token-a',
  storeId: 'c4a7f2d0-6f1d-4e7b-9b2e-3d6c8f4a1b22',
};

const ownerB = {
  userId: '22222222-2222-4222-8222-222222222222',
  userName: 'Owner B',
  token: 'token-b',
  storeId: 'd8f1a3c6-5b2e-4d9a-8c70-1f6b3e5a9d55',
};

const catAId = 'a2d9e1f4-3b6c-4f8a-9d10-5e7b2c4a6f33';
const catBId = 'b3e8f2a5-4c7d-4e9b-8a20-6f8c3d5b7e44';

function loginEnvelope(account: typeof ownerA) {
  return {
    message: 'Success',
    isSucceeded: true,
    timestamp: '2026-11-28T10:00:00Z',
    data: {
      userId: account.userId,
      userName: account.userName,
      role: 'Owner',
      token: account.token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      storeId: account.storeId,
    },
  };
}

function storeEnvelope(storeId: string, nameEn: string) {
  return {
    message: 'Success',
    isSucceeded: true,
    timestamp: '2026-11-28T10:00:00Z',
    data: {
      id: storeId,
      nameAr: nameEn,
      nameEn,
      phoneNumber: '+20 100 000 0000',
      address: 'Cairo',
      iconUrl: null,
      descriptionAr: null,
      descriptionEn: null,
      mainCategoryNameAr: null,
      mainCategoryNameEn: null,
      openTime: null,
      closeTime: null,
      priceLevel: 2,
      averageRating: null,
      ratingsCount: null,
      deliveryTimeMinutes: null,
      deliveryFee: null,
      isActive: true,
      isOpenNow: true,
      images: [],
    },
  };
}

function categoryEnvelope(id: string, storeId: string, nameEn: string) {
  return {
    message: 'Success',
    isSucceeded: true,
    timestamp: '2026-11-28T10:00:00Z',
    data: [
      {
        id,
        storeId,
        nameAr: nameEn,
        nameEn,
        imageUrl: null,
        displayOrder: 1,
        isActive: true,
        itemsCount: 3,
      },
    ],
  };
}

const fetchMock = vi.fn();

afterEach(() => {
  resetApiAuth();
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('Account switching, logout, and stale response isolation', () => {
  it('clears all authenticated session and restaurant state on logout and ignores stale responses', async () => {
    vi.stubGlobal('fetch', fetchMock);
    const storage = new MemoryStorage();

    fetchMock.mockResolvedValueOnce(response(loginEnvelope(ownerA)));
    const sessionA = await login({ email: 'a@example.com', password: 'secret' });
    storeSession(sessionA, storage);
    let currentToken: string | null = sessionA.token;
    configureApiAuth({ getToken: () => currentToken });

    const scopeA = createOwnerStoreScopeFromSession(sessionA);
    const storeRunner = new ScopedRequestRunner();
    const categoryRunner = new ScopedRequestRunner();

    const storeDeferred = deferred<Response>();
    const categoryDeferred = deferred<Response>();
    fetchMock.mockReturnValueOnce(storeDeferred.promise);
    fetchMock.mockReturnValueOnce(categoryDeferred.promise);

    let activeStore: OwnerStore | null = null;
    let activeCategories: MenuCategoryData[] = [];

    const storeLoad = storeRunner.run((signal) => getStoreById(scopeA, signal), {
      onSuccess: (s) => {
        activeStore = s;
      },
      onError: () => {
        activeStore = null;
      },
    });

    const catLoad = categoryRunner.run((signal) => getMenuCategories(scopeA, false, signal), {
      onSuccess: (list) => {
        activeCategories = list;
      },
      onError: () => {
        activeCategories = [];
      },
    });

    // Logout occurs while Store and Category requests are still in flight.
    fetchMock.mockResolvedValueOnce(response('', 200));
    const capturedToken = currentToken;
    await performLogout({
      clearLocal: () => {
        currentToken = null;
        clearStoredSession(storage);
        storeRunner.cancel();
        categoryRunner.cancel();
        activeStore = null;
        activeCategories = [];
      },
      remoteLogout: capturedToken ? () => logout(capturedToken) : undefined,
    });

    // Late resolutions from Owner A must not repopulate cleared state.
    storeDeferred.resolve(response(storeEnvelope(ownerA.storeId, 'Restaurant A')));
    categoryDeferred.resolve(response(categoryEnvelope(catAId, ownerA.storeId, 'Grills A')));
    await Promise.all([storeLoad, catLoad]);

    expect(storage.has(SESSION_STORAGE_KEY)).toBe(false);
    expect(loadStoredSession(storage).session).toBeNull();
    expect(activeStore).toBeNull();
    expect(activeCategories).toEqual([]);
  });

  it('prevents stale Owner A Store and Category responses from overwriting Owner B after account switch', async () => {
    vi.stubGlobal('fetch', fetchMock);
    const storage = new MemoryStorage();

    // Sign in Owner A
    fetchMock.mockResolvedValueOnce(response(loginEnvelope(ownerA)));
    const sessionA = await login({ email: 'a@example.com', password: 'secret' });
    storeSession(sessionA, storage);
    let currentToken: string | null = sessionA.token;
    configureApiAuth({ getToken: () => currentToken });
    const scopeA = createOwnerStoreScopeFromSession(sessionA);

    const storeRunner = new ScopedRequestRunner();
    const categoryRunner = new ScopedRequestRunner();

    let activeStore: OwnerStore | null = null;
    let activeCategories: MenuCategoryData[] = [];

    const storeADeferred = deferred<Response>();
    const catADeferred = deferred<Response>();
    fetchMock.mockReturnValueOnce(storeADeferred.promise);
    fetchMock.mockReturnValueOnce(catADeferred.promise);

    const loadStoreA = storeRunner.run((signal) => getStoreById(scopeA, signal), {
      onSuccess: (s) => {
        activeStore = s;
      },
      onError: () => undefined,
    });
    const loadCatA = categoryRunner.run((signal) => getMenuCategories(scopeA, false, signal), {
      onSuccess: (list) => {
        activeCategories = list;
      },
      onError: () => undefined,
    });

    // Switch immediately to Owner B before Owner A's requests finish
    currentToken = null;
    clearStoredSession(storage);
    storeRunner.cancel();
    categoryRunner.cancel();
    activeStore = null;
    activeCategories = [];

    fetchMock.mockResolvedValueOnce(response(loginEnvelope(ownerB)));
    const sessionB = await login({ email: 'b@example.com', password: 'secret' });
    storeSession(sessionB, storage);
    currentToken = sessionB.token;
    const scopeB = createOwnerStoreScopeFromSession(sessionB);

    fetchMock.mockResolvedValueOnce(response(storeEnvelope(ownerB.storeId, 'Restaurant B')));
    fetchMock.mockResolvedValueOnce(response(categoryEnvelope(catBId, ownerB.storeId, 'Desserts B')));

    const loadStoreB = storeRunner.run((signal) => getStoreById(scopeB, signal), {
      onSuccess: (s) => {
        activeStore = s;
      },
      onError: () => undefined,
    });
    const loadCatB = categoryRunner.run((signal) => getMenuCategories(scopeB, false, signal), {
      onSuccess: (list) => {
        activeCategories = list;
      },
      onError: () => undefined,
    });

    await Promise.all([loadStoreB, loadCatB]);

    // Owner A's stale responses arrive AFTER Owner B has loaded.
    storeADeferred.resolve(response(storeEnvelope(ownerA.storeId, 'Restaurant A')));
    catADeferred.resolve(response(categoryEnvelope(catAId, ownerA.storeId, 'Grills A')));
    await Promise.all([loadStoreA, loadCatA]);

    expect(loadStoredSession(storage).session?.storeId).toBe(ownerB.storeId);
    expect(activeStore).not.toBeNull();
    expect(activeStore!.id).toBe(ownerB.storeId);
    expect(activeStore!.nameEn).toBe('Restaurant B');
    expect(activeCategories).toHaveLength(1);
    expect(activeCategories[0].storeId).toBe(ownerB.storeId);
    expect(activeCategories[0].nameEn).toBe('Desserts B');
  });

  it('never retains the previous session when a subsequent login attempt fails', async () => {
    vi.stubGlobal('fetch', fetchMock);
    const storage = new MemoryStorage();

    fetchMock.mockResolvedValueOnce(response(loginEnvelope(ownerA)));
    const sessionA = await login({ email: 'a@example.com', password: 'secret' });
    storeSession(sessionA, storage);
    let currentToken: string | null = sessionA.token;
    configureApiAuth({ getToken: () => currentToken });

    // Start a new sign-in (matching SessionProvider.signIn semantics: clear first)
    currentToken = null;
    clearStoredSession(storage);

    fetchMock.mockResolvedValueOnce(response({}, 401));
    await expect(login({ email: 'b@example.com', password: 'wrong' })).rejects.toMatchObject({
      reason: 'invalid-credentials',
    });

    expect(storage.has(SESSION_STORAGE_KEY)).toBe(false);
    expect(loadStoredSession(storage).session).toBeNull();
    expect(currentToken).toBeNull();
  });

  it('deduplicates concurrent retry calls so duplicate Store requests are not issued', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => ownerA.token });

    const scopeA = createOwnerStoreScopeFromSession({
      token: ownerA.token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      storeId: ownerA.storeId,
      user: { userId: ownerA.userId, userName: ownerA.userName, role: 'Owner' },
    });

    const runner = new ScopedRequestRunner();
    const pending = deferred<Response>();
    fetchMock.mockReturnValueOnce(pending.promise);

    let resolvedCount = 0;
    const first = runner.run(
      (signal) => getStoreById(scopeA, signal),
      {
        onSuccess: () => {
          resolvedCount += 1;
        },
        onError: () => undefined,
      },
      { dedupe: true },
    );
    const second = runner.run(
      (signal) => getStoreById(scopeA, signal),
      {
        onSuccess: () => {
          resolvedCount += 1;
        },
        onError: () => undefined,
      },
      { dedupe: true },
    );

    pending.resolve(response(storeEnvelope(ownerA.storeId, 'Restaurant A')));
    await Promise.all([first, second]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(resolvedCount).toBe(1);
  });
});
