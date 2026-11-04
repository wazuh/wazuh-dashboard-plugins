import type {
  OpenSearchDashboardsResponseFactory,
  RequestHandlerContext,
} from 'opensearch-dashboards/server';

interface OpenSearchError {
  statusCode?: number;
  message?: string;
  meta?: {
    statusCode?: number;
    body?: { error?: { type?: string; reason?: string } | string };
  };
}

const MAX_REASON_LENGTH = 300;

/**
 * Replies with the status OpenSearch gave (403 when the user cannot read the
 * index, 404 when it does not exist) and names the index, so the view can mark
 * that one section and still render the others. Only the error type and reason
 * leave the server, never the stack or the request.
 */
export function catalogErrorResponse(
  response: OpenSearchDashboardsResponseFactory,
  error: unknown,
  index: string,
) {
  const { statusCode, message, meta } = (error ?? {}) as OpenSearchError;
  const bodyError = meta?.body?.error;
  const type = typeof bodyError === 'object' ? bodyError?.type : undefined;
  const reason =
    (typeof bodyError === 'object' ? bodyError?.reason : bodyError) ||
    message ||
    'Unknown error';
  const status = meta?.statusCode ?? statusCode;

  return response.customError({
    statusCode: status && status >= 400 && status < 600 ? status : 500,
    body: {
      message: `Could not read ${index}: ${String(reason).slice(
        0,
        MAX_REASON_LENGTH,
      )}`,
      attributes: { index, ...(type ? { reason: type } : {}) },
    },
  });
}

/** `hits.total` as a number, whichever shape the indexer replied with. */
export function getHitsTotal(total: unknown): number {
  if (typeof total === 'number') {
    return total;
  }
  const value = (total as { value?: unknown } | undefined)?.value;
  return typeof value === 'number' ? value : 0;
}

/** An integer page between 0 and `max`, for `@osd/config-schema` `validate`. */
export const validatePage = (max: number) => (value: number) =>
  Number.isInteger(value) && value >= 0 && value <= max
    ? undefined
    : `must be an integer between 0 and ${max}`;

/** Rejects text that is empty once trimmed. */
export const validateNotBlank = (value: string) =>
  value.trim().length > 0 ? undefined : 'must not be blank';

export interface CatalogSearchHit<T> {
  _id: string;
  _source?: T;
}

export interface CatalogSearchBody<T> {
  hits?: { total?: unknown; hits?: Array<CatalogSearchHit<T>> };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aggregations?: Record<string, any>;
}

/** Searches `index` as the signed-in user, so their own privileges apply. */
export async function searchCatalog<T>(
  context: RequestHandlerContext,
  index: string,
  body: Record<string, unknown>,
): Promise<CatalogSearchBody<T>> {
  const response = await context.core.opensearch.client.asCurrentUser.search({
    index,
    body,
  });
  return (response.body ?? {}) as CatalogSearchBody<T>;
}
