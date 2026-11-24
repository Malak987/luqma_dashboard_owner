import type { ApiEnvelope } from '../../../lib/api/envelope';

/** Supplied successful GetProfile example. Swagger itself has no response schema. */
export interface ProfileData {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  address: string | null;
  role: string;
  emailConfirmed: boolean;
  isArchived: boolean;
  createAt: string;
  updateAt: string;
}

/** Exact fields from Swagger's UpdateProfileRequest. */
export interface UpdateProfileRequest {
  userName: string;
  email: string;
  phoneNumber: string;
  address: string;
}

export type ProfileResponse = ApiEnvelope<ProfileData>;
