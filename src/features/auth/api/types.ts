import type { ApiEnvelope } from '../../../lib/api/envelope';

/** Documented request body for POST /api/Account/Login. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Documented `data` object returned by POST /api/Account/Login. */
export interface LoginData {
  userId: string;
  userName: string;
  role: string;
  token: string;
  expiresAt: string;
  storeId: string;
}

export type LoginResponse = ApiEnvelope<LoginData>;
