import { afterEach, describe, expect, it, vi } from 'vitest';
import { login } from '../features/auth/api/auth.api';
import { AuthError } from '../features/auth/domain/session';
import { resetApiAuth } from '../lib/api/client';

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response;
}

const primaryStoreId = 'c4a7f2d0-6f1d-4e7b-9b2e-3d6c8f4a1b22';
const secondaryStoreId = 'd8f1a3c6-5b2e-4d9a-8c70-1f6b3e5a9d55';

function envelope(overrides: Record<string, unknown> = {}) {
  return {
    message: 'Success',
    isSucceeded: true,
    timestamp: '2026-11-23T20:00:00Z',
    data: {
      userId: 'user-1',
      userName: 'Nour Hassan',
      role: 'Owner',
      token: 'test-jwt-value',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      storeId: primaryStoreId,
      ...overrides,
    },
  };
}

const fetchMock = vi.fn();

afterEach(() => {
  resetApiAuth();
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('POST /api/Account/Login', () => {
  it('signs in an Owner and parses data.storeId from the documented response', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(response(envelope()));

    const session = await login({ email: 'owner@example.com', password: 'secret-value' });
    expect(session.user.role).toBe('Owner');
    expect(session.user.userName).toBe('Nour Hassan');
    expect(session.user.userId).toBe('user-1');
    expect(session.token).toBe('test-jwt-value');
    expect(session.storeId).toBe(primaryStoreId);
    expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(Date.now());

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://luqma-api.runasp.net/api/Account/Login');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ email: 'owner@example.com', password: 'secret-value' }));
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('rejects a missing, null, empty, or Guid.Empty storeId safely', async () => {
    vi.stubGlobal('fetch', fetchMock);

    const omitted = envelope();
    delete (omitted.data as Record<string, unknown>).storeId;
    fetchMock.mockResolvedValueOnce(response(omitted));
    await expect(login({ email: 'owner@example.com', password: 'secret-value' })).rejects.toMatchObject({
      reason: 'missing-store-id',
    });

    fetchMock.mockResolvedValueOnce(response(envelope({ storeId: null })));
    await expect(login({ email: 'owner@example.com', password: 'secret-value' })).rejects.toMatchObject({
      reason: 'missing-store-id',
    });

    fetchMock.mockResolvedValueOnce(response(envelope({ storeId: '   ' })));
    await expect(login({ email: 'owner@example.com', password: 'secret-value' })).rejects.toMatchObject({
      reason: 'missing-store-id',
    });

    fetchMock.mockResolvedValueOnce(
      response(envelope({ storeId: '00000000-0000-0000-0000-000000000000' })),
    );
    await expect(login({ email: 'owner@example.com', password: 'secret-value' })).rejects.toMatchObject({
      reason: 'missing-store-id',
    });
  });

  it('rejects a malformed non-UUID storeId safely', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(response(envelope({ storeId: 'not-a-uuid' })));

    await expect(login({ email: 'owner@example.com', password: 'secret-value' })).rejects.toMatchObject({
      reason: 'invalid-response',
    });
  });

  it('returns distinct Store IDs when switching Owner accounts', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValueOnce(
      response(envelope({ userId: 'owner-a', userName: 'Owner A', storeId: primaryStoreId })),
    );
    fetchMock.mockResolvedValueOnce(
      response(envelope({ userId: 'owner-b', userName: 'Owner B', storeId: secondaryStoreId })),
    );

    const first = await login({ email: 'a@example.com', password: 'secret-value' });
    const second = await login({ email: 'b@example.com', password: 'secret-value' });

    expect(first.storeId).toBe(primaryStoreId);
    expect(second.storeId).toBe(secondaryStoreId);
    expect(second.storeId).not.toBe(first.storeId);
  });

  it('rejects an Admin role and creates no dashboard session', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(response(envelope({ role: 'Admin' })));

    await expect(login({ email: 'admin@example.com', password: 'secret-value' })).rejects.toMatchObject({
      reason: 'role-not-allowed',
    });
  });

  it('rejects a business failure with isSucceeded:false', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(
      response({ message: 'Invalid credentials', data: null, isSucceeded: false, timestamp: '' }),
    );

    await expect(login({ email: 'owner@example.com', password: 'wrong' })).rejects.toMatchObject({
      reason: 'invalid-credentials',
    });
  });

  it('rejects a missing role without creating a session', async () => {
    vi.stubGlobal('fetch', fetchMock);
    const payload = envelope();
    delete (payload.data as Record<string, unknown>).role;
    fetchMock.mockResolvedValue(response(payload));

    await expect(login({ email: 'owner@example.com', password: 'secret-value' })).rejects.toMatchObject({
      reason: 'role-not-allowed',
    });
  });

  it('rejects an unsupported role without creating a session', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(response(envelope({ role: 'Manager' })));

    await expect(login({ email: 'manager@example.com', password: 'secret-value' })).rejects.toMatchObject({
      reason: 'role-not-allowed',
    });
  });

  it('rejects missing or empty tokens', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(response(envelope({ token: '' })));

    await expect(login({ email: 'owner@example.com', password: 'secret-value' })).rejects.toMatchObject({
      reason: 'invalid-response',
    });
  });

  it('rejects an expired expiresAt', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(
      response(envelope({ expiresAt: new Date(Date.now() - 1000).toISOString() })),
    );

    await expect(login({ email: 'owner@example.com', password: 'secret-value' })).rejects.toMatchObject({
      reason: 'invalid-response',
    });
  });

  it('rejects malformed envelopes', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(response({ isSucceeded: true }));

    await expect(login({ email: 'owner@example.com', password: 'secret-value' })).rejects.toMatchObject({
      reason: 'invalid-response',
    });
  });

  it('maps network and server errors without exposing the token', async () => {
    vi.stubGlobal('fetch', fetchMock);

    fetchMock.mockRejectedValueOnce(new TypeError('connection refused'));
    const networkError = await login({ email: 'owner@example.com', password: 'secret-value' }).catch(
      (error: unknown) => error,
    );
    expect(networkError).toBeInstanceOf(AuthError);
    expect(networkError).toMatchObject({ reason: 'network' });
    expect((networkError as Error).message).not.toContain('test-jwt-value');

    fetchMock.mockResolvedValueOnce(response({}, 503));
    await expect(login({ email: 'owner@example.com', password: 'secret-value' })).rejects.toMatchObject({
      reason: 'server',
    });
  });

  it('maps a 401 from Login to invalid credentials', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(response({}, 401));

    await expect(login({ email: 'owner@example.com', password: 'wrong' })).rejects.toMatchObject({
      reason: 'invalid-credentials',
    });
  });
});
