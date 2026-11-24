import { apiRequest } from '../../../lib/api/client';
import { isApiEnvelope } from '../../../lib/api/envelope';
import { ApiError } from '../../../lib/api/errors';
import type { MainCategoryData, MainCategoryResponse } from './mainCategory.types';

export interface OwnerMainCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  iconUrl: string;
  displayOrder: number;
  isActive: boolean;
}

function mapMainCategory(value: unknown): OwnerMainCategory {
  if (!value || typeof value !== 'object') {
    throw new ApiError('invalid-response', 'MainCategory item is malformed.');
  }
  const item = value as Record<string, unknown>;
  if (
    typeof item.id !== 'string' ||
    item.id.trim() === '' ||
    typeof item.nameAr !== 'string' ||
    typeof item.nameEn !== 'string' ||
    (item.iconUrl !== null && typeof item.iconUrl !== 'string') ||
    typeof item.displayOrder !== 'number' ||
    !Number.isInteger(item.displayOrder) ||
    typeof item.isActive !== 'boolean'
  ) {
    throw new ApiError('invalid-response', 'MainCategory item is missing required fields.');
  }

  return {
    id: item.id,
    nameAr: item.nameAr,
    nameEn: item.nameEn,
    iconUrl: item.iconUrl ?? '',
    displayOrder: item.displayOrder,
    isActive: item.isActive,
  };
}

/**
 * GET /api/MainCategory/GetAll?onlyActive=true — read-only. No UI consumer is
 * wired yet because the Owner's store mapping is not documented; the service
 * and parsing are ready for the restaurant form when that contract exists.
 */
export async function getMainCategories(
  onlyActive = true,
  signal?: AbortSignal,
): Promise<OwnerMainCategory[]> {
  const query = new URLSearchParams({ onlyActive: String(onlyActive) });
  const response = await apiRequest<MainCategoryResponse>(
    `/api/MainCategory/GetAll?${query.toString()}`,
    { signal },
  );

  if (!isApiEnvelope(response)) {
    throw new ApiError('invalid-response', 'MainCategory returned an invalid envelope.');
  }
  if (!response.isSucceeded) {
    throw new ApiError('business', 'MainCategory request failed.');
  }
  if (!Array.isArray(response.data)) {
    throw new ApiError('invalid-response', 'MainCategory data is not a list.');
  }

  return response.data
    .map((item: MainCategoryData) => mapMainCategory(item))
    .filter((item) => (onlyActive ? item.isActive : true))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}
