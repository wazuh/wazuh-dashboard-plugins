/**
 * Duck-types the HTTP status code off an error thrown by OSD's `HttpSetup` (`core.http.get/post/
 * put/delete`) — its rejection (`IHttpFetchError`) puts the raw fetch `Response` on `error.response`
 * (public/components/settings/settings-page.tsx's `describeHttpError` already relies on this same
 * shape for `error.body`). Kept dependency-free and under common/ specifically so unit tests
 * (colocated as http-status.test.ts) can import it directly against a plain fake error object —
 * tsconfig.test.json only includes common/** and server/**, not public/**, so this cannot import
 * `IHttpFetchError`'s type from `src/core/public` (nor does it need to: only the
 * `.response.status` shape matters).
 */
export function getHttpErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }
  const response = (error as { response?: unknown }).response;
  if (!response || typeof response !== 'object') {
    return undefined;
  }
  const status = (response as { status?: unknown }).status;
  return typeof status === 'number' ? status : undefined;
}
