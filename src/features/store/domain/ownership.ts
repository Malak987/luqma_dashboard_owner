import { ApiError } from '../../../lib/api/errors';

/** UUID format required by the Store and MenuCategory path/query schemas. */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type VerifiedStoreId = string & { readonly __verifiedStoreId: unique symbol };

/**
 * A store scope may only be created from a server-authoritative owner-to-store
 * mapping. The current Swagger document does not expose such a mapping, so no
 * production flow creates this value yet. API methods require this type rather
 * than accepting a storeId typed by a form or URL.
 */
export interface OwnerStoreScope {
  readonly storeId: VerifiedStoreId;
  readonly ownerId: string;
  readonly verification: 'backend-owner-mapping';
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
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
    storeId: candidate.storeId as VerifiedStoreId,
    ownerId: candidate.ownerId,
    verification: 'backend-owner-mapping',
  };
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
