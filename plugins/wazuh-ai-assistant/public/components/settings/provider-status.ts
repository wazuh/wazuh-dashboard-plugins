import { ProviderTestResult } from '../../../common/types';

/**
 * Client-side status a provider row can be in (issue #8854). Not part of `ProviderSummary` —
 * `handleTest` derives it fresh every time a test runs and keeps it in `settings-page.tsx`'s own
 * React state, so no saved-object schema change is needed.
 *
 *  - `ok` / `failed` come from a completed test: the server's `/providers/{id}/test` route ran
 *    the real provider round-trip and returned a `ProviderTestResult`.
 *  - `could-not-verify` is different in kind, not just in severity: the test route never reached
 *    the provider at all (e.g. the admin-gate check failed, or the request itself errored) — see
 *    `outcomeFromTestError` below. Badging that the same red "Failed" as a real connectivity
 *    failure blames the provider for something that was never actually tested.
 */
export type ProviderTestOutcome =
  | { status: 'ok'; latencyMs: number }
  | { status: 'failed'; message: string }
  | { status: 'could-not-verify'; message: string };

const DEFAULT_FAILURE_MESSAGE = 'Connection failed.';
const DEFAULT_COULD_NOT_VERIFY_MESSAGE =
  'Could not verify the provider status.';

/**
 * A completed `ProviderTestResult` (the test route ran to completion, HTTP 200) maps 1:1 to
 * `ok`/`failed` — there is no ambiguity to resolve here, unlike `outcomeFromTestError` below.
 */
export function outcomeFromTestResult(
  result: ProviderTestResult,
): ProviderTestOutcome {
  if (result.success) {
    return { status: 'ok', latencyMs: result.latencyMs };
  }
  return {
    status: 'failed',
    message: result.message ?? DEFAULT_FAILURE_MESSAGE,
  };
}

/**
 * `service.test()` throwing (rather than resolving with `{success:false}`) means the test route
 * itself never completed — the admin-gate check rejected the request (HTTP 403, e.g. the Wazuh
 * Manager session used to check "is this user an administrator" was missing/expired), or some
 * other transport-level failure happened. Either way, the PROVIDER was never actually contacted,
 * so this is "could not verify", not "failed": the row's own configuration may be perfectly fine.
 *
 * `describeHttpError` extracts the server's own explanation the same way every other mutation on
 * this page already does (`error.body.message` first, then `error.message`, then the fallback) —
 * duplicated here rather than imported from `settings-page.tsx` so this stays a standalone,
 * dependency-free module other call sites can use without pulling in the whole page component.
 */
export function outcomeFromTestError(error: unknown): ProviderTestOutcome {
  return {
    status: 'could-not-verify',
    message: describeHttpError(error, DEFAULT_COULD_NOT_VERIFY_MESSAGE),
  };
}

/**
 * Extracts a human-readable message from an OSD `http` client rejection. OSD's `HttpFetchError`
 * carries the real server explanation in `error.body.message`, while `error.message` is a generic
 * "Internal Server Error"/"Forbidden" restated from the HTTP status text — preferring `body`
 * first is what surfaces the actual reason (e.g. "Administrator privileges are required...")
 * instead of a useless generic phrase.
 */
export function describeHttpError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const body = (error as { body?: unknown }).body;
    if (body && typeof body === 'object') {
      const message = (body as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
