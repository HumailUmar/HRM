/**
 * Null-safe text helpers used across UI components to prevent the
 * `Cannot read properties of undefined (reading 'split'|'toLowerCase')`
 * crashes that occur when synced/imported records have missing fields.
 */

/** Returns a safe string for any input (null/undefined -> fallback). */
export function safeStr(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  return String(value);
}

/** Lowercased string, always defined. */
export function safeLower(value: unknown): string {
  return safeStr(value).toLowerCase();
}

/** Uppercased string, always defined. */
export function safeUpper(value: unknown): string {
  return safeStr(value).toUpperCase();
}

/** Up to `count` uppercase initials from a name, e.g. "John Doe" -> "JD". */
export function getInitials(name: unknown, count = 2, fallback = '?'): string {
  const parts = safeStr(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  return parts.slice(0, count).map(p => safeUpper(p[0])).join('').slice(0, count);
}
