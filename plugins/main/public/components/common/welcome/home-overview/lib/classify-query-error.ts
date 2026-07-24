import { ErrorDataSourceNotFound } from '../../../../../utils/errors';

/**
 * Buckets a Home overview query failure so the UI can show something more
 * useful than a generic "could not load data": a missing index pattern (with
 * the already-crafted remediation message from the data-source layer), a
 * permission-denied response, or anything else.
 */
export type QueryErrorKind =
  | 'index-pattern-missing'
  | 'permission-denied'
  | 'unknown';

export interface ClassifiedQueryError {
  kind: QueryErrorKind;
  message: string;
}

const PERMISSION_DENIED_MESSAGE =
  "You don't have permission to view this data.";

function getHttpStatus(error: unknown): number | undefined {
  const err = error as {
    status?: number;
    statusCode?: number;
    response?: { status?: number };
    body?: { statusCode?: number };
  };
  return (
    err?.status ?? err?.statusCode ?? err?.response?.status ?? err?.body?.statusCode
  );
}

/** Best-effort extraction of a human-readable message from an unknown error. */
export function describeError(error: unknown): string {
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

export function classifyQueryError(error: unknown): ClassifiedQueryError {
  if ((error as { type?: string })?.type === ErrorDataSourceNotFound.type) {
    return { kind: 'index-pattern-missing', message: describeError(error) };
  }
  if (getHttpStatus(error) === 403) {
    return { kind: 'permission-denied', message: PERMISSION_DENIED_MESSAGE };
  }
  return { kind: 'unknown', message: describeError(error) };
}
