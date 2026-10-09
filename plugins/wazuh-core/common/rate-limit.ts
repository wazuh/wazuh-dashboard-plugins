/** Status code the Server API answers when it rate limits the requests. */
export const RATE_LIMIT_STATUS_CODE = 429;

/**
 * Whether the error of a Server API request is the rate limiting answer
 * (`429 Too Many Requests`).
 */
export function isRateLimitError(error: unknown): boolean {
  return (
    (error as { response?: { status?: number } } | null | undefined)?.response
      ?.status === RATE_LIMIT_STATUS_CODE
  );
}
