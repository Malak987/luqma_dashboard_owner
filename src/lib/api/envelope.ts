export interface ApiEnvelope<T> {
  message: unknown;
  data: T | null;
  isSucceeded: boolean;
  timestamp: unknown;
}

export function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.isSucceeded === 'boolean' && 'data' in candidate;
}
