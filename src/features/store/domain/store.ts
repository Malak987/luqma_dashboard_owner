import type { Locale } from '../../../i18n/locale';
import { localeTag } from '../../../i18n/locale';
import { ApiError } from '../../../lib/api/errors';
import { isUuid, sameUuid } from '../../../lib/uuid';
import type { OwnerStoreScope } from './ownership';

/** Verified restaurant details returned by GET /api/Store/GetById/{id}. */
export interface OwnerStore {
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
  priceLevel: number | null;
  averageRating: number | null;
  ratingsCount: number | null;
  deliveryTimeMinutes: number | null;
  deliveryFee: number | null;
  isActive: boolean;
  isOpenNow: boolean | null;
  images: string[];
}

function invalidStore(message: string): ApiError {
  return new ApiError('invalid-response', message);
}

function optionalString(value: unknown, field: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string') {
    throw invalidStore(`Store ${field} must be a string.`);
  }
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function optionalNumber(value: unknown, field: string): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  throw invalidStore(`Store ${field} must be a finite number.`);
}

function optionalBoolean(value: unknown, field: string): boolean | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  throw invalidStore(`Store ${field} must be a boolean.`);
}

function parseImages(value: unknown): string[] {
  if (value === null || value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw invalidStore('Store images must be an array.');
  }

  const urls: string[] = [];
  for (const item of value) {
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (trimmed) {
        urls.push(trimmed);
      }
      continue;
    }

    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>;
      const candidate = record.imageUrl ?? record.url;
      if (typeof candidate === 'string' && candidate.trim()) {
        urls.push(candidate.trim());
        continue;
      }
    }

    throw invalidStore('Store images contains an invalid entry.');
  }

  return urls;
}

/**
 * Maps and validates the GET /api/Store/GetById/{id} response payload against
 * the authenticated Owner's trusted Login store scope.
 */
export function mapOwnerStore(data: unknown, scope: OwnerStoreScope): OwnerStore {
  if (!data || typeof data !== 'object') {
    throw invalidStore('GetById returned no restaurant object.');
  }

  const candidate = data as Record<string, unknown>;
  if (!isUuid(candidate.id)) {
    throw invalidStore('GetById returned an invalid store id.');
  }

  if (!sameUuid(candidate.id, scope.storeId)) {
    throw new ApiError(
      'ownership-unverified',
      'The returned restaurant does not match the authenticated Owner scope.',
    );
  }

  const nameAr = optionalString(candidate.nameAr, 'nameAr') ?? '';
  const nameEn = optionalString(candidate.nameEn, 'nameEn') ?? '';
  if (!nameAr && !nameEn) {
    throw invalidStore('GetById returned no restaurant name.');
  }

  if (typeof candidate.isActive !== 'boolean') {
    throw invalidStore('GetById is missing restaurant activation status.');
  }

  return {
    id: candidate.id.trim(),
    nameAr,
    nameEn,
    phoneNumber: optionalString(candidate.phoneNumber, 'phoneNumber'),
    address: optionalString(candidate.address, 'address'),
    iconUrl: optionalString(candidate.iconUrl, 'iconUrl'),
    descriptionAr: optionalString(candidate.descriptionAr, 'descriptionAr'),
    descriptionEn: optionalString(candidate.descriptionEn, 'descriptionEn'),
    mainCategoryNameAr: optionalString(candidate.mainCategoryNameAr, 'mainCategoryNameAr'),
    mainCategoryNameEn: optionalString(candidate.mainCategoryNameEn, 'mainCategoryNameEn'),
    openTime: optionalString(candidate.openTime, 'openTime'),
    closeTime: optionalString(candidate.closeTime, 'closeTime'),
    priceLevel: optionalNumber(candidate.priceLevel, 'priceLevel'),
    averageRating: optionalNumber(candidate.averageRating, 'averageRating'),
    ratingsCount: optionalNumber(candidate.ratingsCount, 'ratingsCount'),
    deliveryTimeMinutes: optionalNumber(candidate.deliveryTimeMinutes, 'deliveryTimeMinutes'),
    deliveryFee: optionalNumber(candidate.deliveryFee, 'deliveryFee'),
    isActive: candidate.isActive,
    isOpenNow: optionalBoolean(candidate.isOpenNow, 'isOpenNow'),
    images: parseImages(candidate.images),
  };
}

export function getStoreName(store: OwnerStore, locale: Locale): string {
  return locale === 'ar' ? store.nameAr || store.nameEn : store.nameEn || store.nameAr;
}

export function getStoreDescription(store: OwnerStore, locale: Locale): string | null {
  return locale === 'ar'
    ? store.descriptionAr || store.descriptionEn
    : store.descriptionEn || store.descriptionAr;
}

export function getStoreMainCategory(store: OwnerStore, locale: Locale): string | null {
  return locale === 'ar'
    ? store.mainCategoryNameAr || store.mainCategoryNameEn
    : store.mainCategoryNameEn || store.mainCategoryNameAr;
}

/** Formats a backend HH:mm[:ss] time string in the active locale safely. */
export function formatStoreTime(time: string | null, locale: Locale): string | null {
  if (!time) {
    return null;
  }
  const match = /^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(time.trim());
  if (!match) {
    return time;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return time;
  }
  return new Intl.DateTimeFormat(localeTag(locale), {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(2026, 0, 1, hours, minutes));
}
