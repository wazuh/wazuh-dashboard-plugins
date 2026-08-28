import { schema } from '@osd/config-schema';
import {
  Logger,
  OpenSearchDashboardsRequest,
  OpenSearchDashboardsResponseFactory,
  IOpenSearchDashboardsResponse,
  RequestHandlerContext,
} from '../../../../src/core/server';
import { describeError } from '../../common/errors';

/** Fixed message for every RBAC denial. Not parameterized: any detail from the underlying error is
 * what leaked to unauthorized callers before. */
export const PERMISSION_DENIED_MESSAGE =
  'You do not have permission to perform this action.';

/** Both shapes are read because OpenSearch `ResponseError` exposes the status on either. Not gated
 * on `type === 'security_exception'`: a DLS/FLS 403 carries a different type but the same
 * user-bearing text, and would fall through to the 500 branch.
 *
 * `cause` is followed one level because the settings/providers clients do not always rethrow the
 * client's own error: when the indexer answers with a bare string body, both
 * `AiProvidersClient.fetch` and `IndexSettingsProvider.getSettings` raise
 * `new Error(body.error, { cause: originalError })`, and that wrapper carries no status of its own.
 * Without this the denial would degrade to the 500 branch. */
export function isPermissionDeniedError(error: unknown): boolean {
  const statusOf = (candidate: unknown): unknown => {
    const e = candidate as {
      statusCode?: unknown;
      meta?: { statusCode?: unknown };
    };
    return e?.statusCode ?? e?.meta?.statusCode;
  };
  return (
    statusOf(error) === 403 ||
    statusOf((error as { cause?: unknown })?.cause) === 403
  );
}

/** Best-effort scrub for the 500/503 responses, which still forward the underlying message so
 * operators keep actionable detail. Strips the identity block and internal action names; anything
 * else passes through. The first pattern spans one level of nested brackets so it does not stop at
 * the `]` closing `backend_roles` and leave the roles behind. The logger gets the full message. */
export function redactSensitiveDetail(message: string): string {
  return message
    .replace(/User \[(?:[^[\]]|\[[^\]]*\])*\]/g, 'User [redacted]')
    .replace(/(?:cluster|indices):[^\s\]]+/g, '[action]');
}

/** Route handler shape accepted by `IRouter`'s `get`/`post`/`put`/`delete` methods (params/query/
 * body left generic so `withInternalErrorHandling` below can wrap a handler for any of the
 * `validate` schemas used in server/routes/settings.ts and server/routes/conversations.ts). */
export type RouteHandler<Params = unknown, Query = unknown, Body = unknown> = (
  context: RequestHandlerContext,
  request: OpenSearchDashboardsRequest<Params, Query, Body>,
  response: OpenSearchDashboardsResponseFactory,
) => Promise<IOpenSearchDashboardsResponse>;

/** Wraps a route handler with the outer `try/catch` the mutating routes used to repeat inline. Logs
 * every caught error in full, then maps it: an indexer 403 to a fixed-message 403, anything else
 * to the pre-existing 500. `logger` is required so no call site can regress to an unlogged
 * handler. Handlers' own inner try/catches are untouched. */
export function withInternalErrorHandling<Params, Query, Body>(
  handler: RouteHandler<Params, Query, Body>,
  logger: Logger,
): RouteHandler<Params, Query, Body> {
  return async (context, request, response) => {
    try {
      return await handler(context, request, response);
    } catch (error) {
      const e = error as {
        statusCode?: unknown;
        meta?: { statusCode?: unknown; body?: { error?: { type?: unknown } } };
      };
      const statusCode = e?.statusCode ?? e?.meta?.statusCode;
      const type = e?.meta?.body?.error?.type;
      logger.error(
        `wazuhAiAssistant: route error (${statusCode ?? 'unknown'}, type=${
          type ?? 'unknown'
        }): ${describeError(error)}`,
      );
      if (isPermissionDeniedError(error)) {
        return response.customError({
          statusCode: 403,
          body: { message: PERMISSION_DENIED_MESSAGE },
        });
      }
      return response.customError({
        statusCode: 500,
        body: { message: redactSensitiveDetail(describeError(error)) },
      });
    }
  };
}

/** Pagination CONTRACT (shared by server/routes/settings.ts and server/routes/conversations.ts, and
 * mirrored by public/services/{settings,conversations}_service.ts): `page` defaults to 1,
 * `perPage` defaults to 100. Both are accepted as raw numbers here (no `min`/`max` on the schema
 * itself — an out-of-range value must be CLAMPED, not rejected with a 400) and clamped in
 * `resolvePagination` below. */
export const paginationQuerySchema = schema.object({
  page: schema.number({ defaultValue: 1 }),
  perPage: schema.number({ defaultValue: 100 }),
});

/** Clamps a raw `{page, perPage}` query to the pagination CONTRACT's bounds: `page >= 1`, `1 <=
 * perPage <= 100`. Non-finite/garbage input (e.g. `NaN` from a malformed query string that still
 * parsed as a number) falls back to the same defaults as an absent query param. */
export function resolvePagination(query: { page: number; perPage: number }): {
  page: number;
  perPage: number;
} {
  const rawPage = Number.isFinite(query.page) ? Math.floor(query.page) : 1;
  const rawPerPage = Number.isFinite(query.perPage)
    ? Math.floor(query.perPage)
    : 100;
  return {
    page: Math.max(1, rawPage),
    perPage: Math.min(100, Math.max(1, rawPerPage)),
  };
}
