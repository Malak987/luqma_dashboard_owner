import type { ApiEnvelope } from '../../../lib/api/envelope';

export type PriceLevel = 1 | 2 | 3;

/** Verified response payload returned by GET /api/Store/GetById/{id}. */
export interface StoreDetailsData {
  id: string;
  nameAr: string;
  nameEn: string;
  phoneNumber: string | null;
  address: string | null;
  iconUrl: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  mainCategoryNameAr: string | null;
  mainCategoryNameEn: string | null;
  openTime: string | null;
  closeTime: string | null;
  priceLevel: PriceLevel | number | null;
  averageRating: number | null;
  ratingsCount: number | null;
  deliveryTimeMinutes: number | null;
  deliveryFee: number | null;
  isActive: boolean;
  isOpenNow: boolean | null;
  images: unknown;
}

export type StoreDetailsResponse = ApiEnvelope<StoreDetailsData>;

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
