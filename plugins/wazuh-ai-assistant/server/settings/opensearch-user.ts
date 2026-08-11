import { RequestHandlerContext } from '../../../../src/core/server';

/**
 * Shared READ/WRITE user split for every settings provider under `server/settings/` (and the
 * AI-provider CRUD in `server/settings-store.ts`, which predates this split but follows the same
 * rule): reads go through the INTERNAL user, writes through the CURRENT one.
 *
 * `.wazuh-ai-assistant-settings` is DLS-restricted to admin/wazuh-admin backend roles
 * indexer-side, but privacy defaults and the resolved default provider must be readable by EVERY
 * authenticated dashboard user for a normal chat turn to work (server/routes/chat.ts), not just
 * admins — so reads cannot depend on the calling user's own OpenSearch identity carrying an admin
 * backend role. Every write instead goes through the current user: the dashboard's own
 * `requireAdministrator` gate (server/routes/settings.ts) is what actually authorizes a mutation,
 * and running the write as the current user keeps it attributable to a real identity rather than
 * the internal/system one.
 */

export type OpenSearchClient =
  RequestHandlerContext['core']['opensearch']['client'];

export function reader(
  context: RequestHandlerContext,
): OpenSearchClient['asInternalUser'] {
  return context.core.opensearch.client.asInternalUser;
}

export function writer(
  context: RequestHandlerContext,
): OpenSearchClient['asCurrentUser'] {
  return context.core.opensearch.client.asCurrentUser;
}

export function isNotFoundError(error: unknown): boolean {
  const candidate = error as { statusCode?: number } | null | undefined;
  return candidate?.statusCode === 404;
}

export function totalOf(total: { value: number } | number | undefined): number {
  if (total === undefined) {
    return 0;
  }
  return typeof total === 'number' ? total : total.value;
}
