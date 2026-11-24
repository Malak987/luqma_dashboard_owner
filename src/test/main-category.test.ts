import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMainCategories } from '../features/catalog/api/mainCategory.api';
import { configureApiAuth, resetApiAuth } from '../lib/api/client';

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response;
}

function envelope(data: unknown[], isSucceeded = true) {
  return {
    message: 'ok',
    data,
    isSucceeded,
    timestamp: '2026-11-23T17:46:06.8863255Z',
  };
}

const items = [
  {
    id: 'cat-3',
    nameAr: 'حلويات',
    nameEn: 'Desserts',
    iconUrl: null,
    displayOrder: 3,
    isActive: true,
  },
  {
    id: 'cat-1',
    nameAr: 'مشويات',
    nameEn: 'Grills',
    iconUrl: 'https://example.com/grills.png',
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 'cat-2',
    nameAr: 'بيتزا',
    nameEn: 'Pizza',
    iconUrl: null,
    displayOrder: 2,
    isActive: false,
  },
];

const fetchMock = vi.fn();

afterEach(() => {
  resetApiAuth();
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('MainCategory GetAll', () => {
  it('requests onlyActive=true, filters inactive entries and preserves displayOrder', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'owner-token' });
    fetchMock.mockResolvedValue(response(envelope(items)));

    const categories = await getMainCategories(true);
    expect(categories.map((item) => item.id)).toEqual(['cat-1', 'cat-3']);
    expect(categories.map((item) => item.displayOrder)).toEqual([1, 3]);
    expect(categories[0]).toMatchObject({
      nameAr: 'مشويات',
      nameEn: 'Grills',
      iconUrl: 'https://example.com/grills.png',
      isActive: true,
    });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://luqma-api.runasp.net/api/MainCategory/GetAll?onlyActive=true');
  });

  it('can request inactive categories when onlyActive is false', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'owner-token' });
    fetchMock.mockResolvedValue(response(envelope(items)));

    const categories = await getMainCategories(false);
    expect(categories).toHaveLength(3);
    expect(categories.map((item) => item.displayOrder)).toEqual([1, 2, 3]);

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('onlyActive=false');
  });

  it('rejects business failures and malformed lists', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'owner-token' });

    fetchMock.mockResolvedValueOnce(response(envelope([], false)));
    await expect(getMainCategories()).rejects.toMatchObject({ kind: 'business' });

    fetchMock.mockResolvedValueOnce(response({ message: 'ok', data: {}, isSucceeded: true }));
    await expect(getMainCategories()).rejects.toMatchObject({ kind: 'invalid-response' });
  });
});
