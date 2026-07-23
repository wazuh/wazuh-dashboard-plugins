import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../../react-services/error-management';

/**
 * Coalesces Home overview query failures into a single toast.
 *
 * Each data group that fails calls `reportQueryError(label, error)`. Failures
 * that arrive within the same tick are keyed by `label` (a repeat overwrites
 * with the freshest error) and flushed as one toast, so a broad outage (e.g.
 * every manager / index call failing at once) doesn't spam a toast per widget.
 * The toast lists which widgets failed AND the underlying error message for
 * each, and carries a real error (with its stack) so the toast's "see full
 * error" detail is useful for debugging, not just a label.
 *
 * Self-contained on purpose: the only caller is `useDataGroup`, so widgets never
 * couple to one another's error handling.
 */
const pendingFailures = new Map<string, unknown>();
let flushScheduled = false;

function describeError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error) {
    return error;
  }
  if (error && typeof error === 'object') {
    const { message, data } = error as {
      message?: unknown;
      data?: { message?: unknown };
    };
    if (typeof message === 'string' && message) {
      return message;
    }
    if (typeof data?.message === 'string' && data.message) {
      return data.message;
    }
  }
  return 'Unknown error';
}

function flush(): void {
  const failures = [...pendingFailures.entries()];
  pendingFailures.clear();
  flushScheduled = false;
  if (failures.length === 0) {
    return;
  }

  const labels = failures.map(([label]) => label).join(', ');
  const detail = failures
    .map(([label, error]) => `${label}: ${describeError(error)}`)
    .join('\n');
  const title = `Home overview: could not load ${labels}`;

  const lastError = failures[failures.length - 1][1];
  const representativeError =
    lastError instanceof Error ? lastError : new Error(detail);

  ErrorHandler.handleError(
    ErrorFactory.create(HttpError, {
      error: representativeError,
      message: detail,
    }),
    { title, message: detail },
  );
}

export function reportQueryError(label: string, error?: unknown): void {
  pendingFailures.set(label, error);
  if (flushScheduled) {
    return;
  }
  flushScheduled = true;
  setTimeout(flush, 0);
}
