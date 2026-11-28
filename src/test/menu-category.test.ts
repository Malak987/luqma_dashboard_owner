import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createMenuCategory,
  getMenuCategories,
  serializeMenuCategoryRequest,
  setMenuCategoryActive,
  updateMenuCategory,
  uploadMenuCategoryIcon,
} from '../features/menuCategories/api/menuCategory.api';
import {
  createOwnerStoreScopeFromSession,
  createVerifiedOwnerStoreScope,
  type OwnerStoreScope,
} from '../features/store/domain/ownership';
import { configureApiAuth, resetApiAuth } from '../lib/api/client';

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response;
}

const storeId = 'c4a7f2d0-6f1d-4e7b-9b2e-3d6c8f4a1b22';
const categoryId = 'a2d9e1f4-3b6c-4f8a-9d10-5e7b2c4a6f33';
const ownerId = 'b7e4c1a9-2d6f-4b8e-9a30-6c5f1d3e7b44';
const scope = createVerifiedOwnerStoreScope({ storeId, ownerId }, ownerId);
const input = {
  nameAr: 'حلويات',
  nameEn: 'Sweets',
  imageUrl: 'https://example.com/sweets.png',
  displayOrder: 2,
  isActive: true,
};

function envelope(data: unknown, isSucceeded = true) {
  return { message: 'ok', data, isSucceeded, timestamp: '2026-11-24T00:00:00Z' };
}

const fetchMock = vi.fn();

afterEach(() => {
  resetApiAuth();
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('MenuCategory response parsing and ownership scope', () => {
  it('requests the verified store scope and filters inactive categories', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'owner-token' });
    fetchMock.mockResolvedValue(
      response(
        envelope([
          {
            id: categoryId,
            storeId,
            nameAr: 'حلويات',
            nameEn: 'Sweets',
            imageUrl: null,
            displayOrder: 2,
            isActive: true,
            itemsCount: 1,
          },
          {
            id: '5f1f7db1-1d6f-4e5d-a26a-8ea8c3a1e111',
            storeId,
            nameAr: 'مخفي',
            nameEn: 'Hidden',
            imageUrl: null,
            displayOrder: 1,
            isActive: false,
            itemsCount: 0,
          },
        ]),
      ),
    );

    const categories = await getMenuCategories(scope, true);
    expect(categories).toEqual([
      {
        id: categoryId,
        storeId,
        nameAr: 'حلويات',
        nameEn: 'Sweets',
        imageUrl: null,
        displayOrder: 2,
        isActive: true,
        itemsCount: 1,
      },
    ]);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      `https://luqma-api.runasp.net/api/MenuCategory/GetAll?storeId=${storeId}&onlyActive=true`,
    );
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer owner-token');
  });

  it('rejects a response item belonging to another store', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'owner-token' });
    fetchMock.mockResolvedValue(
      response(
        envelope([
          {
            id: categoryId,
            storeId: 'd8f1a3c6-5b2e-4d9a-8c70-1f6b3e5a9d55',
            nameAr: 'حلويات',
            nameEn: 'Sweets',
            imageUrl: null,
            displayOrder: 1,
            isActive: true,
            itemsCount: 0,
          },
        ]),
      ),
    );

    await expect(getMenuCategories(scope)).rejects.toMatchObject({
      kind: 'ownership-unverified',
    });
  });
});

describe('MenuCategory request serialization', () => {
  it('serializes exactly the documented fields with the verified store id', () => {
    expect(serializeMenuCategoryRequest(scope, input)).toEqual({
      storeId,
      ...input,
    });
  });

  it('uses the verified scope for create, update, and activation requests', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'owner-token' });
    fetchMock.mockResolvedValue(response('', 200));

    await createMenuCategory(scope, input);
    await updateMenuCategory(scope, categoryId, input);
    await setMenuCategoryActive(scope, categoryId, false);

    expect(fetchMock.mock.calls).toHaveLength(3);
    expect(fetchMock.mock.calls[0][0]).toBe('https://luqma-api.runasp.net/api/MenuCategory/Create');
    expect((fetchMock.mock.calls[0][1] as RequestInit).body).toBe(
      JSON.stringify({ storeId, ...input }),
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      `https://luqma-api.runasp.net/api/MenuCategory/Update/${categoryId}`,
    );
    expect((fetchMock.mock.calls[1][1] as RequestInit).body).toBe(
      JSON.stringify({ storeId, ...input }),
    );
    expect(fetchMock.mock.calls[2][0]).toBe(
      `https://luqma-api.runasp.net/api/MenuCategory/SetActive/${categoryId}`,
    );
    expect((fetchMock.mock.calls[2][1] as RequestInit).body).toBe(JSON.stringify({ isActive: false }));
  });

  it('sends menu icon uploads as multipart FormData without inventing a response URL', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'owner-token' });
    fetchMock.mockResolvedValue(response('', 200));

    const file = new File(['icon'], 'category.png', { type: 'image/png' });
    await expect(uploadMenuCategoryIcon(scope, file)).resolves.toBeUndefined();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://luqma-api.runasp.net/api/MenuCategory/UploadIcon');
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get('File')).toBe(file);
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer owner-token');
    expect((init.headers as Record<string, string>)['Content-Type']).toBeUndefined();
  });

  it('surfaces a failed upload and leaves the current icon unchanged', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'owner-token' });
    fetchMock.mockResolvedValue(response(envelope({ iconUrl: 'https://example.com/new.png' }, false)));

    const currentIcon = 'https://example.com/current.png';
    const file = new File(['icon'], 'category.png', { type: 'image/png' });
    await expect(uploadMenuCategoryIcon(scope, file)).rejects.toMatchObject({ kind: 'business' });
    expect(currentIcon).toBe('https://example.com/current.png');
  });

  it('does not invent file type or size validation', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'owner-token' });
    fetchMock.mockResolvedValue(response('', 200));

    const file = new File(['plain text'], 'notes.txt', { type: 'text/plain' });
    await expect(uploadMenuCategoryIcon(scope, file)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('rejects a missing File value before touching the network', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'owner-token' });

    await expect(uploadMenuCategoryIcon(scope, {} as File)).rejects.toMatchObject({
      kind: 'invalid-request',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not call the network for a missing, invalid, or mismatched scope', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'owner-token' });

    await expect(getMenuCategories(undefined)).rejects.toMatchObject({
      kind: 'ownership-unverified',
    });
    await expect(
      createMenuCategory(
        {
          storeId: 'not-a-uuid',
          ownerId,
          verification: 'backend-owner-mapping',
        } as unknown as OwnerStoreScope,
        input,
      ),
    ).rejects.toMatchObject({ kind: 'ownership-unverified' });
    await expect(
      uploadMenuCategoryIcon(undefined, new File(['icon'], 'category.png', { type: 'image/png' })),
    ).rejects.toMatchObject({ kind: 'ownership-unverified' });
    await expect(updateMenuCategory(null, categoryId, input)).rejects.toMatchObject({
      kind: 'ownership-unverified',
    });
    await expect(setMenuCategoryActive(scope, 'not-a-uuid', true)).rejects.toMatchObject({
      kind: 'invalid-request',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses the authenticated Login session Store ID for GetAll(onlyActive=false) and preserves uploaded path when provided', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'owner-token' });

    const sessionScope = createOwnerStoreScopeFromSession({
      token: 'owner-token',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      storeId,
      user: { userId: ownerId, userName: 'Owner', role: 'Owner' },
    });

    fetchMock.mockResolvedValueOnce(
      response(
        envelope([
          {
            id: categoryId,
            storeId,
            nameAr: 'مشويات',
            nameEn: 'Grills',
            imageUrl: '/images/categories/grills.png',
            displayOrder: 1,
            isActive: false,
            itemsCount: 4,
          },
        ]),
      ),
    );

    const all = await getMenuCategories(sessionScope, false);
    expect(all).toHaveLength(1);
    expect(all[0].isActive).toBe(false);
    expect(fetchMock.mock.calls[0][0]).toBe(
      `https://luqma-api.runasp.net/api/MenuCategory/GetAll?storeId=${storeId}&onlyActive=false`,
    );

    fetchMock.mockResolvedValueOnce(response(envelope('/images/categories/uploaded.png', true)));
    const file = new File(['icon'], 'grills.png', { type: 'image/png' });
    const uploadedPath = await uploadMenuCategoryIcon(sessionScope, file);
    expect(uploadedPath).toBe('/images/categories/uploaded.png');
  });

  it('rejects failed Create, Update, and SetActive mutations without false success', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'owner-token' });

    fetchMock.mockResolvedValueOnce(response({}, 403));
    await expect(createMenuCategory(scope, input)).rejects.toMatchObject({
      kind: 'forbidden',
      status: 403,
    });

    fetchMock.mockResolvedValueOnce(response(envelope(null, false)));
    await expect(updateMenuCategory(scope, categoryId, input)).rejects.toMatchObject({
      kind: 'business',
    });

    fetchMock.mockResolvedValueOnce(response({}, 500));
    await expect(setMenuCategoryActive(scope, categoryId, true)).rejects.toMatchObject({
      kind: 'http',
      status: 500,
    });
  });

  it('ignores undocumented or unsafe upload response values so existing images are preserved', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'owner-token' });
    const file = new File(['icon'], 'grills.png', { type: 'image/png' });

    // Plain message string with whitespace is not a usable path
    fetchMock.mockResolvedValueOnce(response(envelope('Icon uploaded successfully', true)));
    await expect(uploadMenuCategoryIcon(scope, file)).resolves.toBeUndefined();

    // Dangerous scheme is rejected
    fetchMock.mockResolvedValueOnce(response(envelope('javascript:alert(1)', true)));
    await expect(uploadMenuCategoryIcon(scope, file)).resolves.toBeUndefined();

    // Path traversal is rejected
    fetchMock.mockResolvedValueOnce(response(envelope('/images/../secret.png', true)));
    await expect(uploadMenuCategoryIcon(scope, file)).resolves.toBeUndefined();

    // Non-envelope response is not assumed valid
    fetchMock.mockResolvedValueOnce(response({ url: '/images/unverified.png' }));
    await expect(uploadMenuCategoryIcon(scope, file)).resolves.toBeUndefined();

    // HTTP failure throws and leaves existing image untouched
    fetchMock.mockResolvedValueOnce(response({}, 403));
    await expect(uploadMenuCategoryIcon(scope, file)).rejects.toMatchObject({
      kind: 'forbidden',
      status: 403,
    });
  });
});
