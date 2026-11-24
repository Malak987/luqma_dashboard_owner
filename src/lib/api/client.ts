import { API_BASE_URL, API_TIMEOUT_MS } from './config';
import { ApiError } from './errors';

type TokenProvider = () => string | null;
type UnauthorizedHandler = () => void;

interface ApiAuthConfiguration {
  getToken: TokenProvider;
  onUnauthorized?: UnauthorizedHandler;
}

let getToken: TokenProvider = () => null;
let onUnauthorized: UnauthorizedHandler | null = null;

/**
 * Single point where the authenticated session token and the 401 handler are
 * registered. Components and feature services never build Authorization headers.
 */
export function configureApiAuth(configuration: ApiAuthConfiguration): void {
  getToken = configuration.getToken;
  onUnauthorized = configuration.onUnauthorized ?? null;
}

export function resetApiAuth(): void {
  getToken = () => null;
  onUnauthorized = null;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Defaults to true. Set to false only for documented anonymous endpoints. */
  auth?: boolean;
  /** Explicit token for sign-out after local state has been cleared. */
  accessToken?: string;
  /** Set to false when a 401 should not invalidate the session again (logout). */
  notifyUnauthorized?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

function buildUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * The one HTTP entry point for the dashboard. It normalizes transport, HTTP,
 * timeout, and malformed-response failures; callers map them to localized UI.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    body,
    auth = true,
    accessToken,
    notifyUnauthorized = true,
    signal,
    timeoutMs = API_TIMEOUT_MS,
    headers: extraHeaders,
  } = options;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...extraHeaders,
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = accessToken ?? getToken();
    if (!token) {
      onUnauthorized?.();
      throw new ApiError('unauthorized', 'No authenticated session token is available.');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const forwardAbort = () => controller.abort();
  signal?.addEventListener('abort', forwardAbort);

  try {
    let response: Response;
    try {
      response = await fetch(buildUrl(path), {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      if (timedOut || (error instanceof Error && error.name === 'AbortError')) {
        throw new ApiError('timeout', 'The request timed out.');
      }
      if (error instanceof TypeError) {
        throw new ApiError('network', 'The API could not be reached.');
      }
      throw new ApiError('unknown', 'The request failed unexpectedly.');
    }

    if (response.status === 401) {
      if (auth && notifyUnauthorized) {
        onUnauthorized?.();
      }
      throw new ApiError('unauthorized', 'The session is not authorized.', 401);
    }

    if (response.status === 403) {
      throw new ApiError('forbidden', 'The session is not allowed to perform this action.', 403);
    }

    if (!response.ok) {
      throw new ApiError('http', 'The API returned an error.', response.status);
    }

    let text: string;
    try {
      text = await response.text();
    } catch {
      throw new ApiError('invalid-response', 'The API response could not be read.', response.status);
    }

    if (!text.trim()) {
      return undefined as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new ApiError('invalid-response', 'The API returned an invalid response.', response.status);
    }
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', forwardAbort);
  }
}
