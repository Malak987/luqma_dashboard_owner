import { isApiEnvelope } from './envelope';
import { ApiError } from './errors';
import { apiRequest } from './client';

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
 * Shared multipart transport for the two documented icon-upload endpoints.
 * The response is intentionally not deserialized: neither endpoint currently
 * publishes a response URL schema. A failed known envelope is still honored.
 */
export async function uploadMultipartFile(
  path: string,
  file: unknown,
  signal?: AbortSignal,
): Promise<void> {
  const response = await apiRequest<unknown>(path, {
    method: 'POST',
    body: createFileFormData(file),
    signal,
  });

  if (isApiEnvelope(response) && response.isSucceeded === false) {
    throw new ApiError('business', 'File upload failed.');
  }
}
