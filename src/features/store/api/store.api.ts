import { apiRequest } from '../../../lib/api/client';
import { isApiEnvelope } from '../../../lib/api/envelope';
import { ApiError } from '../../../lib/api/errors';
import { createFileFormData } from '../../../lib/api/upload';
import {
  requireOwnerStoreScope,
  isUuid,
  type OwnerStoreScope,
} from '../domain/ownership';
import { mapOwnerStore, type OwnerStore } from '../domain/store';
import type {
  OwnerStoreUpdateRequest,
  PriceLevel,
  SetStoreActiveRequest,
  StoreDetailsResponse,
} from './store.types';

/**
 * GET /api/Store/GetById/{id} — loads only the restaurant associated with the
 * authenticated Owner's trusted Login Store ID. Never calls Store/GetAll.
 */
export async function getStoreById(
  scope: OwnerStoreScope | null | undefined,
  signal?: AbortSignal,
): Promise<OwnerStore> {
  const verifiedScope = requireOwnerStoreScope(scope);
  const response = await apiRequest<StoreDetailsResponse>(
    `/api/Store/GetById/${verifiedScope.storeId}`,
    { signal },
  );

  if (!isApiEnvelope(response)) {
    throw new ApiError('invalid-response', 'GetById returned an invalid envelope.');
  }
  if (!response.isSucceeded) {
    throw new ApiError('business', 'GetById failed.');
  }
  if (!response.data) {
    throw new ApiError('invalid-response', 'GetById returned no restaurant data.');
  }

  return mapOwnerStore(response.data, verifiedScope);
}

function invalidStoreUpdate(): ApiError {
  return new ApiError('invalid-request', 'Store update fields are invalid.');
}

function isFiniteOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function isNonNegativeIntegerOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isInteger(value) && value >= 0);
}

function isStringArrayOrNull(value: unknown): value is string[] | null {
  return (
    value === null ||
    (Array.isArray(value) && value.every((item) => typeof item === 'string'))
  );
}

function isPriceLevel(value: unknown): value is PriceLevel {
  return value === 1 || value === 2 || value === 3;
}

function isNullableUuid(value: unknown): value is string | null {
  return value === null || isUuid(value);
}

function assertStoreUpdate(value: unknown): asserts value is OwnerStoreUpdateRequest {
  if (!value || typeof value !== 'object') {
    throw invalidStoreUpdate();
  }

  const candidate = value as Record<string, unknown>;
  const strings = [
    candidate.nameAr,
    candidate.nameEn,
    candidate.phoneNumber,
    candidate.address,
    candidate.descriptionAr,
    candidate.descriptionEn,
  ];

  if (
    strings.some((item) => typeof item !== 'string') ||
    (candidate.iconUrl !== null && typeof candidate.iconUrl !== 'string') ||
    !isNullableUuid(candidate.mainCategoryId) ||
    (candidate.openTime !== null && typeof candidate.openTime !== 'string') ||
    (candidate.closeTime !== null && typeof candidate.closeTime !== 'string') ||
    !isPriceLevel(candidate.priceLevel) ||
    !isNonNegativeIntegerOrNull(candidate.deliveryTimeMinutes) ||
    !isFiniteOrNull(candidate.deliveryFee) ||
    !isFiniteOrNull(candidate.latitude) ||
    !isFiniteOrNull(candidate.longitude) ||
    !isStringArrayOrNull(candidate.cuisineIds) ||
    !isStringArrayOrNull(candidate.imageUrls)
  ) {
    throw invalidStoreUpdate();
  }

  if (
    (candidate.cuisineIds && !candidate.cuisineIds.every((id) => isUuid(id))) ||
    (candidate.imageUrls && !candidate.imageUrls.every((url) => url.trim() !== ''))
  ) {
    throw invalidStoreUpdate();
  }
}

/**
 * Builds only the documented, non-sensitive Store update properties. The
 * owner identity, password, and activation state are intentionally never read
 * from input and never serialized.
 */
export function serializeOwnerStoreUpdate(
  scope: OwnerStoreScope | null | undefined,
  request: OwnerStoreUpdateRequest,
): OwnerStoreUpdateRequest {
  requireOwnerStoreScope(scope);
  assertStoreUpdate(request);

  return {
    nameAr: request.nameAr,
    nameEn: request.nameEn,
    phoneNumber: request.phoneNumber,
    address: request.address,
    iconUrl: request.iconUrl,
    descriptionAr: request.descriptionAr,
    descriptionEn: request.descriptionEn,
    mainCategoryId: request.mainCategoryId,
    openTime: request.openTime,
    closeTime: request.closeTime,
    priceLevel: request.priceLevel,
    deliveryTimeMinutes: request.deliveryTimeMinutes,
    deliveryFee: request.deliveryFee,
    latitude: request.latitude,
    longitude: request.longitude,
    cuisineIds: request.cuisineIds,
    imageUrls: request.imageUrls,
  };
}

export type StoreOwnerOperation = 'update' | 'uploadIcon' | 'setActive';

function ownerOperationUnavailable(operation: StoreOwnerOperation): ApiError {
  const labels: Record<StoreOwnerOperation, string> = {
    update: 'Store update',
    uploadIcon: 'Store icon upload',
    setActive: 'Store activation',
  };

  return new ApiError(
    'forbidden',
    `${labels[operation]} is not available for Owner accounts.`,
  );
}

/** The exact body required by PUT /api/Store/SetActive/{id}. */
export function serializeStoreActiveRequest(value: unknown): SetStoreActiveRequest {
  if (!value || typeof value !== 'object' || typeof (value as Record<string, unknown>).isActive !== 'boolean') {
    throw new ApiError('invalid-request', 'Store activation state is invalid.');
  }

  return { isActive: (value as SetStoreActiveRequest).isActive };
}

/**
 * Builds the activation path only from a verified scope. The operation itself
 * remains blocked because the reviewed backend evidence limits it to
 * Admin/SuperAdmin rather than Owner.
 */
export function storeActivePath(scope: OwnerStoreScope | null | undefined): string {
  return `/api/Store/SetActive/${requireOwnerStoreScope(scope).storeId}`;
}

/**
 * PUT /api/Store/SetActive/{id}. No Owner request is sent until the backend
 * explicitly grants this role permission; the current source evidence says
 * Admin/SuperAdmin only.
 */
export async function setOwnerStoreActive(
  scope: OwnerStoreScope | null | undefined,
  isActive: boolean,
  signal?: AbortSignal,
): Promise<void> {
  requireOwnerStoreScope(scope);
  serializeStoreActiveRequest({ isActive });
  void signal;
  throw ownerOperationUnavailable('setActive');
}

/**
 * POST /api/Store/UploadIcon. File validation and multipart construction are
 * shared with MenuCategory uploads, but the Owner operation is deliberately
 * blocked because the reviewed backend source authorizes Store UploadIcon for
 * Admin/SuperAdmin only and the deployed response contract is incomplete.
 */
export async function uploadOwnerStoreIcon(
  scope: OwnerStoreScope | null | undefined,
  file: File,
  signal?: AbortSignal,
): Promise<void> {
  requireOwnerStoreScope(scope);
  createFileFormData(file);
  void signal;
  throw ownerOperationUnavailable('uploadIcon');
}

/**
 * PUT /api/Store/Update/{id}. The safe serializer is retained for a future
 * permissioned Owner contract, but no Owner request is sent under the current
 * Admin/SuperAdmin-only implementation evidence.
 */
export async function updateOwnerStore(
  scope: OwnerStoreScope | null | undefined,
  request: OwnerStoreUpdateRequest,
  signal?: AbortSignal,
): Promise<void> {
  const verifiedScope = requireOwnerStoreScope(scope);
  serializeOwnerStoreUpdate(verifiedScope, request);
  void signal;
  throw ownerOperationUnavailable('update');
}
