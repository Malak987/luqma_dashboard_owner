import { apiRequest } from '../../../lib/api/client';
import { isApiEnvelope } from '../../../lib/api/envelope';
import { ApiError } from '../../../lib/api/errors';
import type { OwnerProfile } from '../domain/profile';
import { mapOwnerProfile } from '../domain/profile';
import type { ProfileResponse, UpdateProfileRequest } from './profile.types';

/** GET /api/Account/GetProfile — Bearer token is attached centrally. */
export async function getProfile(signal?: AbortSignal): Promise<OwnerProfile> {
  const response = await apiRequest<ProfileResponse>('/api/Account/GetProfile', { signal });

  if (!isApiEnvelope(response)) {
    throw new ApiError('invalid-response', 'GetProfile returned an invalid envelope.');
  }
  if (!response.isSucceeded) {
    throw new ApiError('business', 'GetProfile failed.');
  }
  if (!response.data) {
    throw new ApiError('invalid-response', 'GetProfile returned no data.');
  }

  return mapOwnerProfile(response.data);
}

function assertUpdateProfileRequest(
  value: unknown,
): asserts value is UpdateProfileRequest {
  if (!value || typeof value !== 'object') {
    throw new ApiError('invalid-request', 'Profile fields are invalid.');
  }

  const request = value as Record<string, unknown>;
  const email = typeof request.email === 'string' ? request.email.trim() : '';
  if (
    typeof request.userName !== 'string' ||
    request.userName.trim() === '' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof request.phoneNumber !== 'string' ||
    typeof request.address !== 'string'
  ) {
    throw new ApiError('invalid-request', 'Profile fields are invalid.');
  }
}

/** PUT /api/Account/UpdateProfile — exact documented request fields. */
export async function updateProfile(request: UpdateProfileRequest): Promise<void> {
  assertUpdateProfileRequest(request);

  const response = await apiRequest<unknown>('/api/Account/UpdateProfile', {
    method: 'PUT',
    body: {
      userName: request.userName,
      email: request.email,
      phoneNumber: request.phoneNumber,
      address: request.address,
    },
  });

  // Swagger documents 200 with no body. If a body is returned and is a failed
  // envelope, treat it as a business failure without inventing fields.
  if (isApiEnvelope(response) && response.isSucceeded === false) {
    throw new ApiError('business', 'UpdateProfile failed.');
  }
}
