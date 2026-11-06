/**
 * Helpers for the errors `core.http` rejects with (`HttpFetchError`). Their
 * `message` is only the status text (e.g. "Conflict"): the server's
 * explanation travels in the parsed response, as `body.message`.
 */

const getNonBlankString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value : undefined;

const getProperty = (value: unknown, key: string): unknown =>
  value && typeof value === 'object'
    ? (value as Record<string, unknown>)[key]
    : undefined;

/** The server's message of a failed request, when its response carries one. */
export function getHttpErrorBodyMessage(error: unknown): string | undefined {
  return getNonBlankString(getProperty(getProperty(error, 'body'), 'message'));
}

/**
 * The most useful message of a failed request: the server's one, or else the
 * error's own message. Blank messages count as absent.
 */
export function getHttpErrorMessage(error: unknown): string | undefined {
  return (
    getHttpErrorBodyMessage(error) ??
    getNonBlankString(getProperty(error, 'message'))
  );
}

/**
 * The error to report in a toast: the error toast shows `error.message` both in
 * the toast and in its full error dialog, so a failed request is reported with
 * the server's message instead of the status text. The name, stack and body of
 * the original error are kept for the dialog.
 */
export function withHttpErrorBodyMessage(error: unknown): Error {
  const bodyMessage = getHttpErrorBodyMessage(error);
  if (!bodyMessage) {
    return error instanceof Error ? error : new Error(String(error));
  }

  const reported: Error & { body?: unknown } = new Error(bodyMessage);
  if (error instanceof Error) {
    reported.name = error.name;
    reported.stack = error.stack;
  }
  reported.body = getProperty(error, 'body');
  return reported;
}
