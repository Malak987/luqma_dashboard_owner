import { afterEach, describe, expect, it, vi } from 'vitest';
import { logout } from '../features/auth/api/auth.api';
import { performLogout } from '../features/auth/domain/logout';
import { resetApiAuth } from '../lib/api/client';

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

describe('logout', () => {
  it('calls POST /api/Account/Logout with the captured bearer token and no body', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(response('', 200));

    await logout('owner-token');
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://luqma-api.runasp.net/api/Account/Logout');
    expect(init.method).toBe('POST');
    expect(init.body).toBeUndefined();
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer owner-token');
    expect((init.headers as Record<string, string>)['Content-Type']).toBeUndefined();
  });

  it('clears local state first even when remote logout fails', async () => {
    const clearLocal = vi.fn();
    const remoteLogout = vi.fn().mockRejectedValue(new Error('network'));
    const result = await performLogout({ clearLocal, remoteLogout });

    expect(clearLocal).toHaveBeenCalledOnce();
    expect(remoteLogout).toHaveBeenCalledOnce();
    expect(result).toBe(false);
  });

  it('reports remote logout success', async () => {
    const clearLocal = vi.fn();
    const remoteLogout = vi.fn().mockResolvedValue(undefined);
    const result = await performLogout({ clearLocal, remoteLogout });

    expect(clearLocal).toHaveBeenCalledBefore(remoteLogout);
    expect(result).toBe(true);
  });

  it('performs local logout when there is no token', async () => {
    const clearLocal = vi.fn();
    const result = await performLogout({ clearLocal });
    expect(clearLocal).toHaveBeenCalledOnce();
    expect(result).toBe(false);
  });
});
