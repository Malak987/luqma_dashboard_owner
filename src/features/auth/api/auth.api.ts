import { apiRequest } from '../../../lib/api/client';
import { isApiEnvelope } from '../../../lib/api/envelope';
import { ApiError } from '../../../lib/api/errors';
import type { Session } from '../domain/session';
import { AuthError, createSessionFromLogin } from '../domain/session';
import type { LoginRequest, LoginResponse } from './types';

function toAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) {
    return error;
  }

  if (error instanceof ApiError) {
    switch (error.kind) {
      case 'network':
        return new AuthError('network');
      case 'timeout':
        return new AuthError('timeout');
      case 'unauthorized':
        return new AuthError('invalid-credentials');
      case 'forbidden':
        return new AuthError('forbidden');
      case 'invalid-response':
        return new AuthError('invalid-response');
      case 'http':
        return new AuthError((error.status ?? 0) >= 500 ? 'server' : 'invalid-credentials');
      default:
        return new AuthError('unknown');
    }
  }

  return new AuthError('unknown');
}

/**
 * POST /api/Account/Login — the only Account endpoint whose full request and
 * response contract was supplied. The returned token is treated as opaque.
 */
export async function login(request: LoginRequest): Promise<Session> {
  let response: LoginResponse;
  try {
    response = await apiRequest<LoginResponse>('/api/Account/Login', {
      method: 'POST',
      body: request,
      auth: false,
    });
  } catch (error) {
    throw toAuthError(error);
  }

  if (!isApiEnvelope(response)) {
    throw new AuthError('invalid-response');
  }

  if (!response.isSucceeded) {
    throw new AuthError('invalid-credentials');
  }

  return createSessionFromLogin(response.data);
}

/**
 * POST /api/Account/Logout — Swagger documents no parameters, no request body,
 * and HTTP 200 with no response schema. The token is captured before local
 * state is cleared and is passed explicitly so the request can still complete.
 * A 401 here must not invalidate the session a second time.
 */
export async function logout(token: string): Promise<void> {
  await apiRequest<unknown>('/api/Account/Logout', {
    method: 'POST',
    accessToken: token,
    notifyUnauthorized: false,
  });
}

/*
 * These Account endpoints remain unimplemented because the supplied Swagger
 * does not provide enough request/response detail to do so safely:
 *
 * POST /api/Account/ForgotPassword — request and response schema missing
 * POST /api/Account/ResetPassword  — request fields, validation and token rules missing
 * GET  /api/Account/GetUserById/{id} — response schema missing
 */
