import { RequestHandlerContext } from '../../../../src/core/server';

/**
 * Shared READ/WRITE user for every settings provider under `server/settings/`: both run as the
 * CURRENT user against the Wazuh indexer's own `/_plugins/_setup/ai_assistant/...` endpoints. The
 * indexer's own `plugin:wazuh/ai_assistant/settings/{read,write}` permissions on the calling
 * user's backend role authorize each read and write (see
 * docs/ref/modules/ai-assistant/security.md), so running both as the current user keeps every
 * request attributable to a real identity and correctly scoped to what that identity is
 * indexer-side permitted to do.
 */

export type OpenSearchClient =
  RequestHandlerContext['core']['opensearch']['client'];

export function reader(
  context: RequestHandlerContext,
): OpenSearchClient['asCurrentUser'] {
  return context.core.opensearch.client.asCurrentUser;
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
