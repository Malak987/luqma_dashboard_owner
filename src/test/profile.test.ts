import { afterEach, describe, expect, it, vi } from 'vitest';
import { getProfile, updateProfile } from '../features/profile/api/profile.api';
import { AuthError } from '../features/auth/domain/session';
import { ApiError } from '../lib/api/errors';
import { configureApiAuth, resetApiAuth } from '../lib/api/client';

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response;
}

const profileData = {
  id: '9a5c6d60-97a4-4b46-a8a2-6ae9f2f0a111',
  name: 'malak',
  email: 'owner@example.com',
  phoneNumber: '+20 100 000 0000',
  address: 'Cairo',
  role: 'Owner',
  emailConfirmed: true,
  isArchived: false,
  createAt: '2026-11-11T16:31:10.401025Z',
  updateAt: '0001-01-01T00:00:00',
};

function envelope(overrides: Record<string, unknown> = {}) {
  return {
    message: 'تم جلب الملف الشخصي بنجاح',
    data: { ...profileData, ...overrides },
    isSucceeded: true,
    timestamp: '2026-11-23T17:46:06.8863255Z',
  };
}

const fetchMock = vi.fn();

afterEach(() => {
  resetApiAuth();
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('GetProfile', () => {
  it('parses the supplied profile envelope with the bearer token', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'owner-token' });
    fetchMock.mockResolvedValue(response(envelope()));

    const profile = await getProfile();
    expect(profile).toMatchObject({
      id: profileData.id,
      name: 'malak',
      email: 'owner@example.com',
      phoneNumber: '+20 100 000 0000',
      address: 'Cairo',
      role: 'Owner',
      emailConfirmed: true,
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://luqma-api.runasp.net/api/Account/GetProfile');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer owner-token');
  });

  it('rejects a non-Owner profile role', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'owner-token' });
    fetchMock.mockResolvedValue(response(envelope({ role: 'Admin' })));

    await expect(getProfile()).rejects.toBeInstanceOf(AuthError);
    await expect(getProfile()).rejects.toMatchObject({ reason: 'role-not-allowed' });
  });

  it('rejects malformed profile data', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'owner-token' });
    fetchMock.mockResolvedValue(response({ message: 'ok', data: { role: 'Owner' }, isSucceeded: true }));

    await expect(getProfile()).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('maps business failures safely', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'owner-token' });
    fetchMock.mockResolvedValue(
      response({ message: 'failure', data: null, isSucceeded: false, timestamp: '' }),
    );

    await expect(getProfile()).rejects.toMatchObject({ kind: 'business' });
  });
});

describe('UpdateProfile', () => {
  it('serializes exactly the documented fields and uses PUT with bearer auth', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'owner-token' });
    fetchMock.mockResolvedValue(response('', 200));

    await updateProfile({
      userName: 'Malak Owner',
      email: 'owner@example.com',
      phoneNumber: '+20 100 000 0000',
      address: 'Cairo',
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://luqma-api.runasp.net/api/Account/UpdateProfile');
    expect(init.method).toBe('PUT');
    expect(init.body).toBe(
      JSON.stringify({
        userName: 'Malak Owner',
        email: 'owner@example.com',
        phoneNumber: '+20 100 000 0000',
        address: 'Cairo',
      }),
    );
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer owner-token');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('validates profile fields before touching the network', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'owner-token' });

    await expect(
      updateProfile({ userName: '', email: 'bad', phoneNumber: '', address: '' }),
    ).rejects.toMatchObject({ kind: 'invalid-request' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('surfaces server validation failures without exposing raw text', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'owner-token' });
    fetchMock.mockResolvedValue(response('Validation failed', 400));

    await expect(
      updateProfile({ userName: 'Owner', email: 'owner@example.com', phoneNumber: '', address: '' }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('treats a failed envelope returned with 200 as a business failure', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'owner-token' });
    fetchMock.mockResolvedValue(
      response({ message: 'failed', data: null, isSucceeded: false, timestamp: '' }),
    );

    await expect(
      updateProfile({ userName: 'Malak', email: 'owner@example.com', phoneNumber: '', address: '' }),
    ).rejects.toMatchObject({ kind: 'business' });
  });
});
