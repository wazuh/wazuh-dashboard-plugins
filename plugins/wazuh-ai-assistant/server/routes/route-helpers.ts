import { schema } from '@osd/config-schema';
import {
  Logger,
  OpenSearchDashboardsRequest,
  OpenSearchDashboardsResponseFactory,
  IOpenSearchDashboardsResponse,
  RequestHandlerContext,
} from '../../../../src/core/server';
import { describeError } from '../../common/errors';

/** Fixed opening line for every RBAC denial. */
export const PERMISSION_DENIED_MESSAGE =
  'You do not have permission to perform this action.';

/** Guards what the message below can quote: an indexer action name, nothing else. The identity
 * block's `name=...` and `backend_roles=[...]` do not match. */
const INDEXER_ACTION_SHAPE = /^(?:cluster|indices):[\w/*.-]+$/;

/**
 * Fixed line, plus the denied action name when the reason carries one.
 *
 * The action name is the remediation: `plugin:wazuh/ai_assistant/settings/write` and
 * `cluster:admin/opendistro/ism/policy/get` are granted separately and deny the same route, so
 * without it an admin cannot tell which one to add. The username, backend roles, tenant and
 * exception type stay out: the only text taken from the error is a bracketed entry passing
 * `INDEXER_ACTION_SHAPE`, and the pattern stops at the first `]`, ahead of the `and User [...]`
 * tail. An unrecognized reason yields the fixed line alone.
 */
export function permissionDeniedMessage(error: unknown): string {
  // Follows `cause` for the same reason `isPermissionDeniedError` does: the clients rethrow a bare
  // `Error` that may not carry the reason itself.
  const messageOf = (candidate: unknown): string =>
    String((candidate as { message?: unknown })?.message ?? '');
  const reason = [
    messageOf(error),
    messageOf((error as { cause?: unknown })?.cause),
  ].find(text => /no permissions for \[[^\]]/.test(text));
  const actions = [
    ...new Set(
      (/no permissions for \[([^\]]*)\]/.exec(reason ?? '')?.[1] ?? '')
        .split(',')
        .map(action => action.trim())
        .filter(action => INDEXER_ACTION_SHAPE.test(action)),
    ),
  ];
  return actions.length > 0
    ? `${PERMISSION_DENIED_MESSAGE} Missing indexer permission: ${actions.join(
        ', ',
      )}.`
    : PERMISSION_DENIED_MESSAGE;
}

/** Reads both shapes because OpenSearch `ResponseError` exposes the status on either, and does not
 * gate on `type === 'security_exception'`: a DLS/FLS 403 carries a different type.
 *
 * Follows `cause` one level because `AiProvidersClient.fetch` and
 * `IndexSettingsProvider.getSettings` raise `new Error(body.error, { cause })` for a string body,
 * and that wrapper has no status of its own. */
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

/** Removes the identity block and action names from the 500/503 bodies, which still carry the
 * underlying message so operators keep the operational detail. The rest passes through. The first
 * pattern spans one level of nested brackets, so it does not stop at the `]` closing
 * `backend_roles`. The logger receives the message unscrubbed. */
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
          body: { message: permissionDeniedMessage(error) },
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
