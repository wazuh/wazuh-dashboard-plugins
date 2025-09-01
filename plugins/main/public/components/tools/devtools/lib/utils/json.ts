/**
 * Safely parse JSON. Returns `{}` on failure by default.
 */
export function safeJsonParse<T = any>(raw: string | undefined | null, fallback: T = {} as T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Remove common DevTools-only flags from payload.
 */
export function stripReservedFlags<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  const copy: any = { ...obj };
  if (typeof copy.pretty !== 'undefined') delete copy.pretty;
  return copy as T;
}

