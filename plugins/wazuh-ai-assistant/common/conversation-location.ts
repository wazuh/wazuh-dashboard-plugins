/**
 * Where the "which conversation is open" answer lives OUTSIDE React state, so it survives a reload,
 * a deep link, and navigating away to another dashboard app and back.
 *
 * Before this existed, the open conversation was only ever `chat-page.tsx`'s own `useState`. Any
 * page load — a reload, a paste of the app URL, a return from another app — dropped it, and the chat
 * came back empty with no way to tell which conversation the user had been in. Worse, the next turn
 * then created a SECOND saved conversation instead of continuing the one they had been working in.
 *
 * Two records, deliberately:
 *  - The URL hash is the shareable, back/forward-able one, and the one a user can bookmark.
 *  - `sessionStorage` is the per-tab fallback for the case the hash cannot cover: landing on the
 *    app's bare URL (the nav link, which carries no hash) after having been in a conversation
 *    earlier in the same tab.
 *
 * Kept dependency-free under common/ (no DOM, no `window`) so it is directly unit-testable — the
 * caller passes the hash string and a `KeyValueStorage`, the same convention `draft-stash.ts` uses.
 */

import { KeyValueStorage } from './draft-stash';

/** Hash route one conversation is addressed by, e.g. `#/conversation/9f0c...`. */
export const CONVERSATION_ROUTE_PREFIX = '#/conversation/';

/** Route for "no conversation open" (a brand-new, never-saved one). */
export const NEW_CONVERSATION_ROUTE = '#/';

/** Namespaced the same way `draft-stash.ts` namespaces its keys, for the same reason. */
export const LAST_CONVERSATION_STORAGE_KEY =
  'wazuhAiAssistant.lastConversation';

/**
 * Conversation ids are saved-object ids (UUIDs as this plugin creates them). This is a deliberately
 * conservative superset of that: it accepts what a saved-object id can legitimately be and rejects
 * everything else, so a hand-edited hash or a stale storage value can never be interpolated into a
 * request path as `../` or a query string. An id that fails this check is treated exactly like no
 * id at all.
 */
const CONVERSATION_ID_PATTERN = /^[\w.-]{1,128}$/;

export function isConversationId(value: string): boolean {
  return CONVERSATION_ID_PATTERN.test(value);
}

/**
 * Reads the conversation id out of a location hash, or `null` when the hash addresses no
 * conversation (empty, the new-conversation route, some other route, or an id that fails
 * `isConversationId`). Accepts a percent-encoded id; a malformed encoding is treated as no id
 * rather than throwing, since this runs on whatever happens to be in the address bar.
 */
export function parseConversationRoute(hash: string): string | null {
  if (!hash.startsWith(CONVERSATION_ROUTE_PREFIX)) {
    return null;
  }
  const raw = hash.slice(CONVERSATION_ROUTE_PREFIX.length);
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  return isConversationId(decoded) ? decoded : null;
}

/** Inverse of `parseConversationRoute`. `null` builds the new-conversation route. */
export function buildConversationRoute(id: string | null): string {
  return id
    ? `${CONVERSATION_ROUTE_PREFIX}${encodeURIComponent(id)}`
    : NEW_CONVERSATION_ROUTE;
}

/**
 * Last conversation this tab had open, or `null` if none was stored or the stored value is not a
 * usable id. Never throws: `sessionStorage` access itself can throw in locked-down browser contexts
 * (some private-browsing configurations), and losing this fallback is a UX regression, not a bug.
 */
export function readLastConversationId(
  storage: KeyValueStorage,
): string | null {
  try {
    const stored = storage.getItem(LAST_CONVERSATION_STORAGE_KEY);
    return stored && isConversationId(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** Records (or, for `null`, forgets) the conversation this tab has open. Never throws, as above. */
export function writeLastConversationId(
  storage: KeyValueStorage,
  id: string | null,
): void {
  try {
    if (id) {
      storage.setItem(LAST_CONVERSATION_STORAGE_KEY, id);
    } else {
      storage.removeItem(LAST_CONVERSATION_STORAGE_KEY);
    }
  } catch {
    // As above: a storage failure here only costs the same-tab fallback.
  }
}
