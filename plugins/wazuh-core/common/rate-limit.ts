export const RATE_LIMIT_STATUS_CODE = 429;

export function isRateLimitError(error: unknown): boolean {
  return (
    (error as { response?: { status?: number } } | null | undefined)?.response
      ?.status === RATE_LIMIT_STATUS_CODE
  );
}
