import { schema } from '@osd/config-schema';
import {
  Logger,
  OpenSearchDashboardsRequest,
  OpenSearchDashboardsResponseFactory,
  IOpenSearchDashboardsResponse,
  RequestHandlerContext,
} from '../../../../src/core/server';
import { describeError } from '../../common/errors';

/** Single neutral message for every RBAC-denied indexer call (issue #9057). Deliberately NOT
 * parameterized with the action name, subsystem, or any detail from the underlying error: any
 * such detail is exactly what leaked to unauthorized callers before this fix. The full error is
 * still logged server-side — see `withInternalErrorHandling` below. */
export const PERMISSION_DENIED_MESSAGE =
  'You do not have permission to perform this action.';

/** Any indexer 403 is an authorization failure. Read from BOTH shapes: the plugin's own
 * `isNotFoundError`-style helpers read `error.statusCode`, wazuh-elastic.ts reads
 * `error.meta.statusCode`. Deliberately NOT gated on `meta.body.error.type ===
 * 'security_exception'`: a DLS/FLS 403 carries a different `type` yet the same user/role-bearing
 * text, and would fall through to the leaking 500 branch. `type` is logged, never returned. */
export function isPermissionDeniedError(error: unknown): boolean {
  const e = error as { statusCode?: unknown; meta?: { statusCode?: unknown } };
  return (e?.statusCode ?? e?.meta?.statusCode) === 403;
}

/** Route handler shape accepted by `IRouter`'s `get`/`post`/`put`/`delete` methods (params/query/
 * body left generic so `withInternalErrorHandling` below can wrap a handler for any of the
 * `validate` schemas used in server/routes/settings.ts and server/routes/conversations.ts). */
export type RouteHandler<Params = unknown, Query = unknown, Body = unknown> = (
  context: RequestHandlerContext,
  request: OpenSearchDashboardsRequest<Params, Query, Body>,
  response: OpenSearchDashboardsResponseFactory,
) => Promise<IOpenSearchDashboardsResponse>;

/** Wraps a route handler with the byte-identical outer `try/catch` every mutating route in
 * server/routes/settings.ts and server/routes/conversations.ts used to repeat inline. Every
 * caught error is logged in FULL (issue #9057's `security_exception` action name/username/backend
 * roles must stay available to operators server-side), then mapped to a response: an indexer 403
 * (`isPermissionDeniedError`) becomes a sanitized `403 { message: PERMISSION_DENIED_MESSAGE }` —
 * never the raw error text — and everything else keeps the pre-existing `500
 * {message: describeError(error)}`. `logger` is REQUIRED so no call site can silently regress to
 * an unlogged/unsanitized handler. Handlers' own inner try/catches (e.g. conversations.ts's
 * get-then-404 pattern, settings.ts's PUT SETTINGS ISM-503 mapping) are untouched. */
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
        body: { message: describeError(error) },
      });
    }
  };
}

/** Pagination CONTRACT (shared by server/routes/settings.ts and server/routes/conversations.ts,
 * and mirrored by public/services/{settings,conversations}_service.ts): `page` defaults to 1,
 * `perPage` defaults to 100. Both are accepted as raw numbers here (no `min`/`max` on the schema
 * itself — an out-of-range value must be CLAMPED, not rejected with a 400) and clamped in
 * `resolvePagination` below. */
export const paginationQuerySchema = schema.object({
  page: schema.number({ defaultValue: 1 }),
  perPage: schema.number({ defaultValue: 100 }),
});

/** Clamps a raw `{page, perPage}` query to the pagination CONTRACT's bounds: `page >= 1`,
 * `1 <= perPage <= 100`. Non-finite/garbage input (e.g. `NaN` from a malformed query string that
 * still parsed as a number) falls back to the same defaults as an absent query param. */
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
