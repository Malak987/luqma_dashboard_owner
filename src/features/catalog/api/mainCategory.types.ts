import type { ApiEnvelope } from '../../../lib/api/envelope';

/** Fields supplied by the task example; Swagger has no response schema. */
export interface MainCategoryData {
  id: string;
  nameAr: string;
  nameEn: string;
  iconUrl: string | null;
  displayOrder: number;
  isActive: boolean;
}

export type MainCategoryResponse = ApiEnvelope<MainCategoryData[]>;
