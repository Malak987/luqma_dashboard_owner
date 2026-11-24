import { ApiError } from '../../../lib/api/errors';
import { AuthError } from '../../auth/domain/session';

export interface OwnerProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  role: 'Owner';
  emailConfirmed: boolean;
  isArchived: boolean;
  createAt: string;
  updateAt: string;
}

/**
 * Maps the supplied GetProfile example. Swagger provides no response schema, so
 * only the identity fields are strict; optional display fields fall back safely.
 * A non-Owner role is an authorization failure, not a parse failure.
 */
export function mapOwnerProfile(data: unknown): OwnerProfile {
  if (!data || typeof data !== 'object') {
    throw new ApiError('invalid-response', 'GetProfile returned no profile object.');
  }

  const candidate = data as Record<string, unknown>;
  if (candidate.role !== 'Owner') {
    throw new AuthError('role-not-allowed');
  }

  if (
    typeof candidate.id !== 'string' ||
    candidate.id.trim() === '' ||
    typeof candidate.name !== 'string' ||
    candidate.name.trim() === '' ||
    typeof candidate.email !== 'string' ||
    candidate.email.trim() === ''
  ) {
    throw new ApiError('invalid-response', 'GetProfile is missing required identity fields.');
  }

  return {
    id: candidate.id,
    name: candidate.name,
    email: candidate.email,
    phoneNumber: typeof candidate.phoneNumber === 'string' ? candidate.phoneNumber : '',
    address: typeof candidate.address === 'string' ? candidate.address : '',
    role: 'Owner',
    emailConfirmed: candidate.emailConfirmed === true,
    isArchived: candidate.isArchived === true,
    createAt: typeof candidate.createAt === 'string' ? candidate.createAt : '',
    updateAt: typeof candidate.updateAt === 'string' ? candidate.updateAt : '',
  };
}
