import { ApiError } from '../../../lib/api/errors';
import { isUuid } from '../../../lib/uuid';
import type { Session } from '../../auth/domain/session';

export { isUuid };

export type VerifiedStoreId = string & { readonly __verifiedStoreId: unique symbol };

/**
 * A store scope may only be created from a server-authoritative owner-to-store
 * mapping (such as the verified `data.storeId` returned by POST /api/Account/Login).
 * API methods require this type rather than accepting a storeId typed by a form
 * or URL.
 */
export interface OwnerStoreScope {
  readonly storeId: VerifiedStoreId;
  readonly ownerId: string;
  readonly verification: 'backend-owner-mapping';
}

function ownershipError(): ApiError {
  return new ApiError(
    'ownership-unverified',
    'The authenticated owner restaurant could not be verified.',
  );
}

/**
 * Converts a mapping returned by an explicitly owner-scoped backend endpoint
 * into the scope accepted by restaurant APIs. It intentionally requires the
 * authenticated owner id to match the mapping and rejects all other shapes.
 *
 * This is not a substitute for backend authorization. Every request must still
 * be authorized and ownership-checked by the API.
 */
export function createVerifiedOwnerStoreScope(
  mapping: unknown,
  authenticatedOwnerId: unknown,
): OwnerStoreScope {
  if (
    !mapping ||
    typeof mapping !== 'object' ||
    typeof authenticatedOwnerId !== 'string' ||
    authenticatedOwnerId.trim() === ''
  ) {
    throw ownershipError();
  }

  const candidate = mapping as Record<string, unknown>;
  if (
    !isUuid(candidate.storeId) ||
    typeof candidate.ownerId !== 'string' ||
    candidate.ownerId.trim() === '' ||
    candidate.ownerId !== authenticatedOwnerId
  ) {
    throw ownershipError();
  }

  return {
    storeId: candidate.storeId.trim() as VerifiedStoreId,
    ownerId: candidate.ownerId,
    verification: 'backend-owner-mapping',
  };
}

/**
 * Derives the Owner's verified store scope exclusively from the authenticated
 * Login session. Never accepts arbitrary client-provided store IDs.
 */
export function createOwnerStoreScopeFromSession(
  session: Session | null | undefined,
): OwnerStoreScope {
  if (!session || session.user.role !== 'Owner') {
    throw ownershipError();
  }

  return createVerifiedOwnerStoreScope(
    {
      storeId: session.storeId,
      ownerId: session.user.userId,
    },
    session.user.userId,
  );
}

/** Rejects missing, forged, malformed, or unverified scopes before any request. */
export function requireOwnerStoreScope(
  scope: OwnerStoreScope | null | undefined,
): OwnerStoreScope {
  if (
    !scope ||
    scope.verification !== 'backend-owner-mapping' ||
    !isUuid(scope.storeId) ||
    typeof scope.ownerId !== 'string' ||
    scope.ownerId.trim() === ''
  ) {
    throw ownershipError();
  }

  return scope;
}

export function isOwnershipError(value: unknown): value is ApiError {
  return value instanceof ApiError && value.kind === 'ownership-unverified';
}
