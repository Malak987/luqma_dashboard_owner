/** RFC 4122 / RFC 9562 UUID pattern (v1–v7), rejecting Guid.Empty. */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMPTY_UUID = '00000000-0000-0000-0000-000000000000';

export function isEmptyUuid(value: unknown): boolean {
  return typeof value === 'string' && value.trim().toLowerCase() === EMPTY_UUID;
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value.trim());
}

export function sameUuid(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
