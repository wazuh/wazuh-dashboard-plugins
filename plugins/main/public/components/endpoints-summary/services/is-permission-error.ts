/**
 * Detects whether an error represents an RBAC permission denial by its
 * message content: the backend wraps permission denials as HTTP 500, so
 * `error.response.status === 403` can't be used as the detection signal.
 * Never throws.
 */
export const isPermissionError = (error: unknown): boolean => {
  try {
    const text =
      (error as any)?.message ??
      (error as any)?.response?.data?.message ??
      String(error ?? '');

    if (typeof text !== 'string' || !text) {
      return false;
    }

    return /permission denied/i.test(text);
  } catch {
    return false;
  }
};
