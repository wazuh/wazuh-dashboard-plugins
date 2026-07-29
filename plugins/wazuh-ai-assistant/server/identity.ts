import {
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from '../../../src/core/server';

/**
 * Shared identity-resolution core for `server/routes/conversations.ts`'s `resolveOwner` and
 * `server/routes/chat.ts`'s `resolveChatStreamUser`. Both would otherwise carry identical bodies
 * (same untyped-context cast, same `context.wazuh.security.getCurrentUser` call, same
 * string-vs-object narrowing, same defensive try/catch) plus duplicated
 * `WazuhSecurityUser`/`WazuhMainRequestContext` types — this file is the single copy of all of
 * that. It deliberately does NOT decide what an unresolved identity means: it always returns
 * `undefined` in that case, and it is up to each CALLER to pick a fallback. That choice is a real
 * security property and the two current callers make OPPOSITE choices on purpose:
 *
 * - `resolveOwner` (conversations.ts) fails CLOSED: `undefined` propagates out, and the four
 *   owner-CHECKING conversation routes (list/get/put/delete) turn that into a 403 rather than
 *   ever comparing against a shared bucket value. It also treats
 *   a resolved username that is EXACTLY the `CONVERSATION_OWNER_FALLBACK` sentinel as unresolved
 *   — see that function's own doc comment in conversations.ts for why.
 * - `resolveChatStreamUser` (chat.ts) falls back to the `CONVERSATION_OWNER_FALLBACK` sentinel:
 *   safe ONLY because that value is used exclusively as a rate-limit bucket KEY for the
 *   concurrent-stream cap, never as an authorization decision — see that function's own doc
 *   comment in chat.ts for the accepted availability tradeoff this implies.
 *
 * Do not "simplify" these two call sites toward a single shared fallback — that would either
 * fail open on the owner side, or turn a rate-limit bucket key into something that pretends to
 * be an authenticated identity (chat side). The fallback difference is the whole point.
 *
 * Platform facts this relies on (verified against a live 5.0 stack, not
 * re-derived here): the `wazuh` MAIN plugin (not `wazuh-core`, which server/wazuh-core.d.ts
 * already types) registers its own route-handler context and exposes
 * `context.wazuh.security.getCurrentUser(request, context)` to resolve the authenticated
 * dashboard username. Unlike `wazuh-core.d.ts`'s fuller ambient-module augmentation, this one
 * surface is read through an inline, hand-written cast instead of its own `.d.ts` file — i.e.
 * genuinely untyped. The call is wrapped defensively because it can legitimately throw or resolve
 * to `undefined` (main plugin not finished initializing, security disabled, no request-scoped
 * user yet).
 */
export interface WazuhSecurityUser {
  username?: string;
}

export type WazuhMainRequestContext = {
  wazuh?: {
    security?: {
      getCurrentUser?: (
        request: OpenSearchDashboardsRequest,
        context: RequestHandlerContext,
      ) => Promise<WazuhSecurityUser | string | undefined>;
    };
  };
};

/**
 * Resolves the authenticated dashboard username for this request, or `undefined` when one cannot
 * be determined (main plugin/security not ready, `getCurrentUser` throws, or it resolves to
 * nothing/an empty username). Applies NO fallback of its own — see this file's top doc comment
 * for why that decision is deliberately left to each caller (`resolveOwner` vs.
 * `resolveChatStreamUser`), and each of THOSE functions' own doc comments for their respective
 * fallback and its rationale.
 *
 * Exported for server/routes/conversations-owner-resolution.test.ts only — not part of either
 * route file's public HTTP contract.
 */
export async function resolveWazuhUsername(
  context: RequestHandlerContext,
  request: OpenSearchDashboardsRequest,
): Promise<string | undefined> {
  try {
    const wazuhContext = (context as WazuhMainRequestContext).wazuh;
    const currentUser = await wazuhContext?.security?.getCurrentUser?.(
      request,
      context,
    );
    const username =
      typeof currentUser === 'string' ? currentUser : currentUser?.username;
    if (username) {
      return username;
    }
  } catch {
    // Any throw here (main plugin/security not ready, etc.) falls through to the "unresolved"
    // signal below rather than failing the whole request at this layer — callers decide.
  }
  return undefined;
}
