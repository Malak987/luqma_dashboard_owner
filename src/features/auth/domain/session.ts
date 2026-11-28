import { isEmptyUuid, isUuid } from '../../../lib/uuid';

export const ALLOWED_ROLES = ['Owner'] as const;
export type DashboardRole = (typeof ALLOWED_ROLES)[number];

export type AuthFailureReason =
  | 'invalid-credentials'
  | 'role-not-allowed'
  | 'missing-store-id'
  | 'invalid-response'
  | 'network'
  | 'timeout'
  | 'server'
  | 'unauthorized'
  | 'forbidden'
  | 'expired'
  | 'invalid-session'
  | 'unknown';

export const AUTH_FAILURE_REASONS: readonly AuthFailureReason[] = [
  'invalid-credentials',
  'role-not-allowed',
  'missing-store-id',
  'invalid-response',
  'network',
  'timeout',
  'server',
  'unauthorized',
  'forbidden',
  'expired',
  'invalid-session',
  'unknown',
];

export function isAuthFailureReason(value: unknown): value is AuthFailureReason {
  return typeof value === 'string' && AUTH_FAILURE_REASONS.includes(value as AuthFailureReason);
}

export class AuthError extends Error {
  readonly reason: AuthFailureReason;

  constructor(reason: AuthFailureReason) {
    super(reason);
    this.name = 'AuthError';
    this.reason = reason;
  }
}

export interface SessionUser {
  userId: string;
  userName: string;
  role: DashboardRole;
}

export interface Session {
  token: string;
  expiresAt: string;
  storeId: string;
  user: SessionUser;
}

export type AccessDecision =
  | { kind: 'allow' }
  | { kind: 'login' }
  | { kind: 'expired' }
  | { kind: 'forbidden' }
  | { kind: 'missing-store-id' };

export function isAllowedRole(role: unknown): role is DashboardRole {
  return role === 'Owner';
}

export function parseExpiresAt(value: unknown): number | null {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isSessionExpired(session: Session, now = Date.now()): boolean {
  const expiresAt = parseExpiresAt(session.expiresAt);
  return expiresAt === null || expiresAt <= now;
}

/**
 * Validates the documented Login `data` object before any authenticated state
 * is created. Missing, empty, malformed, and unsupported roles or missing
 * Store IDs are rejected safely.
 */
export function createSessionFromLogin(data: unknown, now = Date.now()): Session {
  if (!data || typeof data !== 'object') {
    throw new AuthError('invalid-response');
  }

  const candidate = data as Record<string, unknown>;
  if (!isAllowedRole(candidate.role)) {
    throw new AuthError('role-not-allowed');
  }

  const { userId, userName, token, expiresAt, storeId } = candidate;
  if (
    typeof userId !== 'string' ||
    userId.trim() === '' ||
    typeof userName !== 'string' ||
    userName.trim() === '' ||
    typeof token !== 'string' ||
    token.trim() === ''
  ) {
    throw new AuthError('invalid-response');
  }

  const expiry = parseExpiresAt(expiresAt);
  if (expiry === null || expiry <= now) {
    throw new AuthError('invalid-response');
  }

  if (
    storeId === undefined ||
    storeId === null ||
    (typeof storeId === 'string' && (storeId.trim() === '' || isEmptyUuid(storeId)))
  ) {
    throw new AuthError('missing-store-id');
  }

  if (!isUuid(storeId)) {
    throw new AuthError('invalid-response');
  }

  return {
    token,
    expiresAt: new Date(expiry).toISOString(),
    storeId: storeId.trim(),
    user: {
      userId,
      userName,
      role: candidate.role,
    },
  };
}

export function decideAccess(session: Session | null, now = Date.now()): AccessDecision {
  if (!session) {
    return { kind: 'login' };
  }
  if (isSessionExpired(session, now)) {
    return { kind: 'expired' };
  }
  if (!isAllowedRole(session.user.role)) {
    return { kind: 'forbidden' };
  }
  if (!isUuid(session.storeId)) {
    return { kind: 'missing-store-id' };
  }
  return { kind: 'allow' };
}


/** Allows only internal dashboard paths as post-login return targets. */
export function safeReturnPath(value: unknown): string {
  if (
    typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.startsWith('/login')
  ) {
    return value;
  }
  return '/';
}
