import { isApiEnvelope } from './envelope';
import { ApiError } from './errors';
import { apiRequest } from './client';
import { resolveAssetUrl } from './media';

function invalidUploadFile(): ApiError {
  return new ApiError('invalid-request', 'The selected file is invalid.');
}

/**
 * Creates the documented multipart payload without imposing undocumented file
 * type or size limits. The backend remains responsible for those constraints.
 */
export function createFileFormData(file: unknown): FormData {
  if (typeof File === 'undefined' || !(file instanceof File)) {
    throw invalidUploadFile();
  }

  const formData = new FormData();
  formData.append('File', file);
  return formData;
}

/**
 * Accepts only a well-formed http/https URL or clean relative image path.
 * Plain status messages (containing whitespace), protocol-relative URLs,
 * traversal segments, and non-http schemes are rejected so an existing valid
 * image path can never be overwritten with an invalid value.
 */
export function isUsableUploadedImagePath(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed) || trimmed.includes('..')) {
    return false;
  }

  if (resolveAssetUrl(trimmed) === null) {
    return false;
  }

  if (/^https?:\/\/[^/\s]+/i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  // Relative backend asset path (e.g. "/images/categories/foo.png" or "uploads/foo.png")
  return trimmed.startsWith('/') || trimmed.includes('/');
}

function extractUploadedPath(response: unknown): string | undefined {
  if (!isApiEnvelope(response) || !response.isSucceeded) {
    return undefined;
  }

  const { data } = response;
  if (isUsableUploadedImagePath(data)) {
    return data.trim();
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const candidate = record.imageUrl ?? record.iconUrl;
    if (isUsableUploadedImagePath(candidate)) {
      return candidate.trim();
    }
  }

  return undefined;
}

/**
 * Shared multipart transport for documented icon-upload endpoints.
 * Swagger documents the multipart `File` field with HTTP 200 and no response
 * schema. This helper appends exactly `File`, delegates Bearer handling to
 * `apiRequest`, honors failed envelopes, and returns a path only when a
 * succeeded envelope explicitly carries a validated image path — never
 * fabricating an image URL or overwriting an existing image with invalid data.
 */
export async function uploadMultipartFile(
  path: string,
  file: unknown,
  signal?: AbortSignal,
): Promise<string | undefined> {
  const response = await apiRequest<unknown>(path, {
    method: 'POST',
    body: createFileFormData(file),
    signal,
  });

  if (isApiEnvelope(response) && response.isSucceeded === false) {
    throw new ApiError('business', 'File upload failed.');
  }

  return extractUploadedPath(response);
}
