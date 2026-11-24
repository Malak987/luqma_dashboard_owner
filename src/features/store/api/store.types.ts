import type { ApiEnvelope } from '../../../lib/api/envelope';

export type PriceLevel = 1 | 2 | 3;

/**
 * The safe Owner-editable subset of Swagger's UpdateStoreRequest. The
 * sensitive ownerId, ownerEmail, ownerPassword, and isActive properties are
 * deliberately absent and can never be supplied by the dashboard form.
 */
export interface OwnerStoreUpdateRequest {
  nameAr: string;
  nameEn: string;
  phoneNumber: string;
  address: string;
  iconUrl: string | null;
  descriptionAr: string;
  descriptionEn: string;
  mainCategoryId: string | null;
  openTime: string | null;
  closeTime: string | null;
  priceLevel: PriceLevel;
  deliveryTimeMinutes: number | null;
  deliveryFee: number | null;
  latitude: number | null;
  longitude: number | null;
  cuisineIds: string[] | null;
  imageUrls: string[] | null;
}

export interface SetStoreActiveRequest {
  isActive: boolean;
}

/** Swagger documents no response schema for Store Update. */
export type StoreUpdateResponse = ApiEnvelope<unknown>;
