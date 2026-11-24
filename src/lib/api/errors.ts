export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'http'
  | 'unauthorized'
  | 'forbidden'
  | 'invalid-response'
  | 'business'
  | 'invalid-request'
  | 'ownership-unverified'
  | 'unknown';

/**
 * Safe, normalized error metadata. Response bodies, tokens, passwords, and
 * server stack traces are deliberately never attached to this error.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}
