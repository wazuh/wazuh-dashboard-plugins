import { i18n } from '@osd/i18n';
import { PROVIDER_TEST_TIMEOUT_MS } from '../../../common/constants';
import { ProviderTestResult } from '../../../common/types';

export type ProviderTestOutcome =
  | { status: 'ok'; latencyMs: number }
  | { status: 'failed'; message: string }
  | { status: 'could-not-verify'; message: string };

const DEFAULT_FAILURE_MESSAGE = 'Connection failed.';
const DEFAULT_COULD_NOT_VERIFY_MESSAGE =
  'Could not verify the provider status.';

/** From this time to first response on, a passing test is shown as "Slow" instead of "OK". */
export const SLOW_TEST_LATENCY_MS = 5_000;

export function outcomeFromTestResult(
  result: ProviderTestResult,
): ProviderTestOutcome {
  if (result.success) {
    return { status: 'ok', latencyMs: result.latencyMs };
  }
  if (result.timedOut) {
    return {
      status: 'failed',
      message: i18n.translate('wazuhAiAssistant.settings.testTimedOut', {
        defaultMessage:
          'No response within {seconds} s. Reasoning models can take a long time to start answering.',
        values: { seconds: PROVIDER_TEST_TIMEOUT_MS / 1000 },
      }),
    };
  }
  return {
    status: 'failed',
    message: result.message ?? DEFAULT_FAILURE_MESSAGE,
  };
}

export function outcomeFromTestError(error: unknown): ProviderTestOutcome {
  return {
    status: 'could-not-verify',
    message: describeHttpError(error, DEFAULT_COULD_NOT_VERIFY_MESSAGE),
  };
}

/**
 * Prefix every SSRF/URL-policy rejection carries, minted by `ProviderUrlRejectedError` in
 * server/providers/url-guard.ts and surfaced verbatim as the 400 body message by the save/test
 * routes (server/routes/settings.ts). Matching on it is what lets the UI title that failure
 * "Endpoint blocked" instead of the generic "Something went wrong": the reason sentence the server
 * sends is already specific ("this host is a blocked cloud-metadata endpoint"), so the only thing
 * the generic title added was a wrong first impression — the admin reads "something went wrong" as
 * a transient glitch worth retrying, when the URL was in fact refused by policy and retrying it
 * will never work.
 *
 * Deliberately a prefix match on the message rather than a status code: a 400 from these routes can
 * equally be a blank name or a bad payload, and no dedicated error code is carried on the wire.
 */
export const PROVIDER_URL_REJECTED_PREFIX = 'Provider request rejected';

export function isEndpointBlockedError(message: string | null): boolean {
  return Boolean(message?.trimStart().startsWith(PROVIDER_URL_REJECTED_PREFIX));
}

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
