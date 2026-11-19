/**
 * The one canonical runtime guard for parsed JSON objects.
 *
 * It proves "this is a non-null, non-array object" and nothing more — field
 * checks stay explicit at the boundary that parses them (see parseBackup).
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
