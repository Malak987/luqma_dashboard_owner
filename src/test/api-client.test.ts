import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, configureApiAuth, resetApiAuth } from '../lib/api/client';
import { ApiError } from '../lib/api/errors';

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response;
}

const fetchMock = vi.fn();

afterEach(() => {
  resetApiAuth();
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('central API client', () => {
  it('uses the centralized base URL and attaches the bearer token', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'test-token' });
    fetchMock.mockResolvedValue(response({ ok: true }));

    const result = await apiRequest<{ ok: boolean }>('/api/Protected');
    expect(result.ok).toBe(true);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://luqma-api.runasp.net/api/Protected');
    expect(init.headers).toMatchObject({
      Accept: 'application/json',
      Authorization: 'Bearer test-token',
    });
  });

  it('does not attach authorization to documented anonymous endpoints', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'test-token' });
    fetchMock.mockResolvedValue(response({ isSucceeded: true }));

    await apiRequest('/api/Account/Login', {
      method: 'POST',
      body: { email: 'owner@example.com', password: 'secret' },
      auth: false,
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
    expect(headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ email: 'owner@example.com', password: 'secret' }));
  });

  it('rejects protected calls without a token before touching the network', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => null });

    await expect(apiRequest('/api/Protected')).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('normalizes 401, 403 and HTTP failures', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'test-token' });

    fetchMock.mockResolvedValueOnce(response({}, 401));
    await expect(apiRequest('/api/Protected')).rejects.toMatchObject({ kind: 'unauthorized' });

    fetchMock.mockResolvedValueOnce(response({}, 403));
    await expect(apiRequest('/api/Protected')).rejects.toMatchObject({ kind: 'forbidden' });

    fetchMock.mockResolvedValueOnce(response({}, 503));
    await expect(apiRequest('/api/Protected')).rejects.toMatchObject({
      kind: 'http',
      status: 503,
    });
  });

  it('invokes the configured unauthorized handler on a 401', async () => {
    vi.stubGlobal('fetch', fetchMock);
    const onUnauthorized = vi.fn();
    configureApiAuth({ getToken: () => 'test-token', onUnauthorized });
    fetchMock.mockResolvedValueOnce(response({}, 401));

    await expect(apiRequest('/api/Protected')).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('normalizes network and timeout failures', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'test-token' });

    fetchMock.mockRejectedValueOnce(new TypeError('connection refused'));
    await expect(apiRequest('/api/Protected')).rejects.toMatchObject({ kind: 'network' });

    fetchMock.mockRejectedValueOnce(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    await expect(apiRequest('/api/Protected')).rejects.toMatchObject({ kind: 'timeout' });
  });

  it('rejects malformed JSON and empty success responses safely', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'test-token' });

    fetchMock.mockResolvedValueOnce(response('not-json'));
    const request = apiRequest('/api/Protected');
    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('prevents a stale 401 from Owner A from invalidating Owner B after an account switch', async () => {
    vi.stubGlobal('fetch', fetchMock);

    let currentToken: string | null = 'owner-a-token';
    const onUnauthorized = vi.fn(() => {
      currentToken = null;
    });
    configureApiAuth({ getToken: () => currentToken, onUnauthorized });

    let resolveOwnerAResponse!: (value: Response) => void;
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveOwnerAResponse = resolve;
      }),
    );

    const ownerARequest = apiRequest('/api/Store/GetById/store-a');

    // Switch synchronously to Owner B while Owner A's request is still in flight
    currentToken = 'owner-b-token';

    // Owner A's stale request comes back 401
    resolveOwnerAResponse(response({}, 401));
    await expect(ownerARequest).rejects.toMatchObject({ kind: 'unauthorized', status: 401 });

    // Owner B's active session must NOT have been invalidated
    expect(onUnauthorized).not.toHaveBeenCalled();
    expect(currentToken).toBe('owner-b-token');

    // Subsequent request uses Owner B's token, never Owner A's token
    fetchMock.mockResolvedValueOnce(response({ ok: true }));
    await apiRequest('/api/Store/GetById/store-b');
    const [, initB] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect((initB.headers as Record<string, string>).Authorization).toBe('Bearer owner-b-token');

    // A 401 on the currently active Owner B token DOES trigger invalidation
    fetchMock.mockResolvedValueOnce(response({}, 401));
    await expect(apiRequest('/api/Store/GetById/store-b')).rejects.toMatchObject({
      kind: 'unauthorized',
      status: 401,
    });
    expect(onUnauthorized).toHaveBeenCalledOnce();
    expect(currentToken).toBeNull();
  });

  it('keeps configureApiAuth cleanup safe under Strict Mode and overlapping remounts', async () => {
    vi.stubGlobal('fetch', fetchMock);

    // Simulate React StrictMode mount -> cleanup -> remount
    const releaseFirst = configureApiAuth({ getToken: () => 'token-strict-1' });
    releaseFirst();
    const releaseSecond = configureApiAuth({ getToken: () => 'token-strict-2' });

    fetchMock.mockResolvedValueOnce(response({ ok: true }));
    await apiRequest('/api/Protected');
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer token-strict-2',
    });

    // Simulate overlapping remount where instance 3 mounts before instance 2 unmounts
    const releaseThird = configureApiAuth({ getToken: () => 'token-remount-3' });
    releaseSecond(); // Must NOT wipe instance 3's active configuration

    fetchMock.mockResolvedValueOnce(response({ ok: true }));
    await apiRequest('/api/Protected');
    expect((fetchMock.mock.calls[1][1] as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer token-remount-3',
    });

    releaseThird();
    await expect(apiRequest('/api/Protected')).rejects.toMatchObject({ kind: 'unauthorized' });
  });

  it('keeps centralized API client URL config intact after resetApiAuth for anonymous calls', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'stale-token' });
    resetApiAuth();

    // Protected calls cannot use the cleared token
    await expect(apiRequest('/api/Protected')).rejects.toMatchObject({ kind: 'unauthorized' });

    // Anonymous login still uses the centralized API_BASE_URL without Authorization
    fetchMock.mockResolvedValueOnce(response({ isSucceeded: true }));
    await apiRequest('/api/Account/Login', { method: 'POST', body: {}, auth: false });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://luqma-api.runasp.net/api/Account/Login');
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('blocks an expired session token before the interval check and triggers unauthorized handling', async () => {
    vi.stubGlobal('fetch', fetchMock);
    let expiresAt = Date.now() + 60_000;
    const onUnauthorized = vi.fn();

    configureApiAuth({
      getToken: () => (Date.now() >= expiresAt ? null : 'live-token'),
      onUnauthorized,
    });

    // Session expires before any background timer ticks
    expiresAt = Date.now() - 1000;

    await expect(apiRequest('/api/Protected')).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });
});
