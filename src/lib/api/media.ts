import { API_BASE_URL } from './config';

/**
 * Resolves a backend image path (relative or absolute http/https URL) for safe
 * display in `<img>` elements without mutating the stored API path value.
 */
export function resolveAssetUrl(path: string | null | undefined): string | null {
  if (typeof path !== 'string') {
    return null;
  }

  const trimmed = path.trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Reject protocol-relative URLs and non-http schemes (e.g. javascript:, data:).
  if (trimmed.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return null;
  }

  return `${API_BASE_URL}/${trimmed.replace(/^\/+/, '')}`;
}
