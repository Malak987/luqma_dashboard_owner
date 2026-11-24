import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  serializeOwnerStoreUpdate,
  serializeStoreActiveRequest,
  setOwnerStoreActive,
  storeActivePath,
  updateOwnerStore,
  uploadOwnerStoreIcon,
} from '../features/store/api/store.api';
import { createVerifiedOwnerStoreScope } from '../features/store/domain/ownership';
import type { OwnerStoreUpdateRequest } from '../features/store/api/store.types';
import { configureApiAuth, resetApiAuth } from '../lib/api/client';

const storeId = 'c4a7f2d0-6f1d-4e7b-9b2e-3d6c8f4a1b22';
const ownerId = 'b7e4c1a9-2d6f-4b8e-9a30-6c5f1d3e7b44';
const scope = createVerifiedOwnerStoreScope({ storeId, ownerId }, ownerId);
const request: OwnerStoreUpdateRequest = {
  nameAr: 'لقمة',
  nameEn: 'Luqma',
  phoneNumber: '+20 100 000 0000',
  address: 'Sohag',
  iconUrl: 'https://example.com/icon.png',
  descriptionAr: 'وصف',
  descriptionEn: 'Description',
  mainCategoryId: 'd8f1a3c6-5b2e-4d9a-8c70-1f6b3e5a9d55',
  openTime: '09:00:00',
  closeTime: '23:00:00',
  priceLevel: 2,
  deliveryTimeMinutes: 35,
  deliveryFee: 15,
  latitude: 26.56,
  longitude: 31.7,
  cuisineIds: ['e6b2d4f8-7a1c-4e9b-8d30-2f5c6a1b7e66'],
  imageUrls: ['https://example.com/cover.png'],
};

const fetchMock = vi.fn();

afterEach(() => {
  resetApiAuth();
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('safe Store Update serialization', () => {
  it('never serializes owner identity, owner password, or activation state', () => {
    const serialized = serializeOwnerStoreUpdate(scope, request);
    expect(serialized).toEqual(request);
    expect(serialized).not.toHaveProperty('ownerId');
    expect(serialized).not.toHaveProperty('ownerEmail');
    expect(serialized).not.toHaveProperty('ownerPassword');
    expect(serialized).not.toHaveProperty('isActive');
  });

  it('strips sensitive runtime keys even when an unsafe caller object contains them', () => {
    const unsafe = {
      ...request,
      ownerId,
      ownerEmail: 'owner@example.com',
      ownerPassword: 'never-send-this',
      isActive: false,
    } as unknown as OwnerStoreUpdateRequest;

    const serialized = serializeOwnerStoreUpdate(scope, unsafe);
    expect(serialized).toEqual(request);
    expect(JSON.stringify(serialized)).not.toContain('never-send-this');
    expect(serialized).not.toHaveProperty('ownerId');
    expect(serialized).not.toHaveProperty('ownerEmail');
    expect(serialized).not.toHaveProperty('ownerPassword');
    expect(serialized).not.toHaveProperty('isActive');
  });

  it('builds the SetActive route/body from a verified scope without hardcoding an id', () => {
    expect(storeActivePath(scope)).toBe(`/api/Store/SetActive/${storeId}`);
    expect(serializeStoreActiveRequest({ isActive: true })).toEqual({ isActive: true });
    expect(serializeStoreActiveRequest({ isActive: false })).toEqual({ isActive: false });
  });

  it('blocks all Owner Store mutations before fetch when permission is not confirmed', async () => {
    vi.stubGlobal('fetch', fetchMock);
    configureApiAuth({ getToken: () => 'owner-token' });

    await expect(updateOwnerStore(scope, request)).rejects.toMatchObject({ kind: 'forbidden' });
    await expect(setOwnerStoreActive(scope, true)).rejects.toMatchObject({ kind: 'forbidden' });
    await expect(
      uploadOwnerStoreIcon(scope, new File(['icon'], 'store.png', { type: 'image/png' })),
    ).rejects.toMatchObject({ kind: 'forbidden' });
    await expect(updateOwnerStore(undefined, request)).rejects.toMatchObject({
      kind: 'ownership-unverified',
    });
    await expect(setOwnerStoreActive(undefined, false)).rejects.toMatchObject({
      kind: 'ownership-unverified',
    });
    await expect(
      uploadOwnerStoreIcon(undefined, new File(['icon'], 'store.png', { type: 'image/png' })),
    ).rejects.toMatchObject({ kind: 'ownership-unverified' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
