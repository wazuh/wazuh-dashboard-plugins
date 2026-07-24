import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../../react-services/error-management';
import { describeError } from './classify-query-error';

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

const MAX_TOAST_MESSAGE_LINES = 6;

function truncateForToast(message: string, maxLines: number): string {
  const lines = message.split('\n');
  if (lines.length <= maxLines) {
    return message;
  }
  const shown = lines.slice(0, maxLines - 1);
  const hiddenCount = lines.length - shown.length;
  return [...shown, `… and ${hiddenCount} more`].join('\n');
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
  const toastMessage = truncateForToast(detail, MAX_TOAST_MESSAGE_LINES);

  const lastError = failures[failures.length - 1][1];
  const representativeError =
    lastError instanceof Error ? lastError : new Error(detail);

  ErrorHandler.handleError(
    ErrorFactory.create(HttpError, {
      error: representativeError,
      message: toastMessage,
    }),
    { title, message: toastMessage },
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
