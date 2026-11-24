import type { ApiEnvelope } from '../../../lib/api/envelope';

/** Fields returned by the supplied MenuCategory example. */
export interface MenuCategoryData {
  id: string;
  storeId: string;
  nameAr: string;
  nameEn: string;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  itemsCount: number;
}

/** Exact non-store fields accepted by SaveMenuCategoryRequest. */
export interface MenuCategoryInput {
  nameAr: string;
  nameEn: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
}

export interface SaveMenuCategoryRequest extends MenuCategoryInput {
  storeId: string;
}

export interface SetMenuCategoryActiveRequest {
  isActive: boolean;
}

export type MenuCategoryResponse = ApiEnvelope<MenuCategoryData[]>;
