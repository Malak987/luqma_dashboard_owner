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
});
