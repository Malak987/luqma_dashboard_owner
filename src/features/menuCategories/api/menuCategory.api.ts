import { apiRequest } from '../../../lib/api/client';
import { isApiEnvelope } from '../../../lib/api/envelope';
import { ApiError } from '../../../lib/api/errors';
import { uploadMultipartFile } from '../../../lib/api/upload';
import { sameUuid } from '../../../lib/uuid';
import {
  requireOwnerStoreScope,
  isUuid,
  type OwnerStoreScope,
} from '../../store/domain/ownership';
import type {
  MenuCategoryData,
  MenuCategoryInput,
  MenuCategoryResponse,
  SaveMenuCategoryRequest,
  SetMenuCategoryActiveRequest,
} from './menuCategory.types';

function invalidMenuCategory(): ApiError {
  return new ApiError('invalid-request', 'Menu category fields are invalid.');
}

function categoryId(value: unknown): string {
  if (!isUuid(value)) {
    throw invalidMenuCategory();
  }
  return value;
}

function assertMenuCategoryInput(value: unknown): asserts value is MenuCategoryInput {
  if (!value || typeof value !== 'object') {
    throw invalidMenuCategory();
  }

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.nameAr !== 'string' ||
    candidate.nameAr.trim() === '' ||
    typeof candidate.nameEn !== 'string' ||
    candidate.nameEn.trim() === '' ||
    typeof candidate.imageUrl !== 'string' ||
    typeof candidate.displayOrder !== 'number' ||
    !Number.isInteger(candidate.displayOrder) ||
    candidate.displayOrder < 0 ||
    typeof candidate.isActive !== 'boolean'
  ) {
    throw invalidMenuCategory();
  }
}

export function serializeMenuCategoryRequest(
  scope: OwnerStoreScope | null | undefined,
  request: MenuCategoryInput,
): SaveMenuCategoryRequest {
  const verifiedScope = requireOwnerStoreScope(scope);
  assertMenuCategoryInput(request);

  return {
    storeId: verifiedScope.storeId,
    nameAr: request.nameAr,
    nameEn: request.nameEn,
    imageUrl: request.imageUrl,
    displayOrder: request.displayOrder,
    isActive: request.isActive,
  };
}

function mapMenuCategory(value: unknown, scope: OwnerStoreScope): MenuCategoryData {
  if (!value || typeof value !== 'object') {
    throw new ApiError('invalid-response', 'Menu category item is malformed.');
  }

  const item = value as Record<string, unknown>;
  const storeMatches = isUuid(item.storeId) && sameUuid(item.storeId, scope.storeId);
  if (!storeMatches) {
    // A response for a different store is rejected rather than rendered. The
    // backend must independently enforce the same ownership boundary.
    throw new ApiError('ownership-unverified', 'The category belongs to another restaurant.');
  }

  if (
    !isUuid(item.id) ||
    typeof item.nameAr !== 'string' ||
    typeof item.nameEn !== 'string' ||
    (item.imageUrl !== null && item.imageUrl !== undefined && typeof item.imageUrl !== 'string') ||
    typeof item.displayOrder !== 'number' ||
    !Number.isInteger(item.displayOrder) ||
    typeof item.isActive !== 'boolean' ||
    typeof item.itemsCount !== 'number' ||
    !Number.isInteger(item.itemsCount) ||
    item.itemsCount < 0
  ) {
    throw new ApiError('invalid-response', 'Menu category item is missing required fields.');
  }

  return {
    id: item.id,
    storeId: item.storeId as string,
    nameAr: item.nameAr,
    nameEn: item.nameEn,
    imageUrl: item.imageUrl ?? null,
    displayOrder: item.displayOrder,
    isActive: item.isActive,
    itemsCount: item.itemsCount,
  };
}

export function parseMenuCategoryResponse(
  response: unknown,
  scope: OwnerStoreScope,
  onlyActive: boolean,
): MenuCategoryData[] {
  const verifiedScope = requireOwnerStoreScope(scope);
  if (!isApiEnvelope(response)) {
    throw new ApiError('invalid-response', 'MenuCategory returned an invalid envelope.');
  }
  if (!response.isSucceeded) {
    throw new ApiError('business', 'MenuCategory request failed.');
  }
  if (!Array.isArray(response.data)) {
    throw new ApiError('invalid-response', 'MenuCategory data is not a list.');
  }

  return response.data
    .map((item) => mapMenuCategory(item, verifiedScope))
    .filter((item) => (onlyActive ? item.isActive : true))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/** GET /api/MenuCategory/GetAll for a backend-verified owner store scope. */
export async function getMenuCategories(
  scope: OwnerStoreScope | null | undefined,
  onlyActive = false,
  signal?: AbortSignal,
): Promise<MenuCategoryData[]> {
  const verifiedScope = requireOwnerStoreScope(scope);
  const query = new URLSearchParams({
    storeId: verifiedScope.storeId,
    onlyActive: String(onlyActive),
  });
  const response = await apiRequest<MenuCategoryResponse>(
    `/api/MenuCategory/GetAll?${query.toString()}`,
    { signal },
  );
  return parseMenuCategoryResponse(response, verifiedScope, onlyActive);
}

function assertOptionalBusinessFailure(response: unknown, action: string): void {
  // The Swagger document gives these operations only HTTP 200 with no body
  // schema. Do not invent a response model; honor a known failed envelope if
  // one is returned.
  if (isApiEnvelope(response) && response.isSucceeded === false) {
    throw new ApiError('business', `Menu category ${action} failed.`);
  }
}

/** POST /api/MenuCategory/Create. */
export async function createMenuCategory(
  scope: OwnerStoreScope | null | undefined,
  request: MenuCategoryInput,
  signal?: AbortSignal,
): Promise<void> {
  const verifiedScope = requireOwnerStoreScope(scope);
  const body = serializeMenuCategoryRequest(verifiedScope, request);
  const response = await apiRequest<unknown>('/api/MenuCategory/Create', {
    method: 'POST',
    body,
    signal,
  });
  assertOptionalBusinessFailure(response, 'creation');
}

/** PUT /api/MenuCategory/Update/{id}; the backend must verify category ownership. */
export async function updateMenuCategory(
  scope: OwnerStoreScope | null | undefined,
  id: string,
  request: MenuCategoryInput,
  signal?: AbortSignal,
): Promise<void> {
  const verifiedScope = requireOwnerStoreScope(scope);
  const verifiedId = categoryId(id);
  const body = serializeMenuCategoryRequest(verifiedScope, request);
  const response = await apiRequest<unknown>(`/api/MenuCategory/Update/${verifiedId}`, {
    method: 'PUT',
    body,
    signal,
  });
  assertOptionalBusinessFailure(response, 'update');
}

/** PUT /api/MenuCategory/SetActive/{id}; the backend must verify ownership. */
export async function setMenuCategoryActive(
  scope: OwnerStoreScope | null | undefined,
  id: string,
  isActive: boolean,
  signal?: AbortSignal,
): Promise<void> {
  requireOwnerStoreScope(scope);
  const verifiedId = categoryId(id);
  if (typeof isActive !== 'boolean') {
    throw invalidMenuCategory();
  }

  const body: SetMenuCategoryActiveRequest = { isActive };
  const response = await apiRequest<unknown>(`/api/MenuCategory/SetActive/${verifiedId}`, {
    method: 'PUT',
    body,
    signal,
  });
  assertOptionalBusinessFailure(response, 'activation update');
}

/**
 * POST /api/MenuCategory/UploadIcon. Sends the exact multipart `File` field
 * and returns the backend-supplied image path when present. Never fabricates
 * an image URL when the response omits one.
 */
export async function uploadMenuCategoryIcon(
  scope: OwnerStoreScope | null | undefined,
  file: File,
  signal?: AbortSignal,
): Promise<string | undefined> {
  requireOwnerStoreScope(scope);
  return uploadMultipartFile('/api/MenuCategory/UploadIcon', file, signal);
}
