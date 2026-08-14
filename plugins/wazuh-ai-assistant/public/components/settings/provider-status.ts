import { ProviderTestResult } from '../../../common/types';

export type ProviderTestOutcome =
  | { status: 'ok'; latencyMs: number }
  | { status: 'failed'; message: string }
  | { status: 'could-not-verify'; message: string };

const DEFAULT_FAILURE_MESSAGE = 'Connection failed.';
const DEFAULT_COULD_NOT_VERIFY_MESSAGE =
  'Could not verify the provider status.';

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

export function outcomeFromTestError(error: unknown): ProviderTestOutcome {
  return {
    status: 'could-not-verify',
    message: describeHttpError(error, DEFAULT_COULD_NOT_VERIFY_MESSAGE),
  };
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
