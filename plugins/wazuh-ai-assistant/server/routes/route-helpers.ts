import { schema } from '@osd/config-schema';
import {
  OpenSearchDashboardsRequest,
  OpenSearchDashboardsResponseFactory,
  IOpenSearchDashboardsResponse,
  RequestHandlerContext,
} from '../../../../src/core/server';
import { describeError } from '../../common/errors';

/** Route handler shape accepted by `IRouter`'s `get`/`post`/`put`/`delete` methods (params/query/
 * body left generic so `withInternalErrorHandling` below can wrap a handler for any of the
 * `validate` schemas used in server/routes/settings.ts and server/routes/conversations.ts). */
export type RouteHandler<Params = unknown, Query = unknown, Body = unknown> = (
  context: RequestHandlerContext,
  request: OpenSearchDashboardsRequest<Params, Query, Body>,
  response: OpenSearchDashboardsResponseFactory,
) => Promise<IOpenSearchDashboardsResponse>;

/** Wraps a route handler with the byte-identical outer `try/catch` every mutating route in
 * server/routes/settings.ts and server/routes/conversations.ts used to repeat inline: any error
 * thrown by the handler becomes the same 500 `{message: describeError(error)}` customError
 * response. Purely a de-duplication of that boilerplate — no behavior change for callers.
 * Handlers' own inner try/catches (e.g. conversations.ts's get-then-404 pattern) are untouched. */
export function withInternalErrorHandling<Params, Query, Body>(
  handler: RouteHandler<Params, Query, Body>,
): RouteHandler<Params, Query, Body> {
  return async (context, request, response) => {
    try {
      return await handler(context, request, response);
    } catch (error) {
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
