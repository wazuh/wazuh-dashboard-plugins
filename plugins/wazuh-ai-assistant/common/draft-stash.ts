/**
 * Session-expiry recovery UX (the 15-minute
 * dashboard session TTL vs fully-quiescent idle tabs — a user who idles out gets an unexplained
 * 401 on their next question). Stashes/restores the chat input draft across the reload the "Your
 * session expired" callout (public/components/chat/chat-page.tsx) asks the user to perform, so
 * reloading never silently discards whatever they were mid-typing.
 *
 * Kept dependency-free and under common/ specifically so unit tests (colocated as
 * draft-stash.test.ts) can import it directly — tsconfig.test.json only includes common/** and
 * server/**, not public/** (same convention as common/discover-url.ts and
 * common/conversation-merge.ts). `KeyValueStorage` below
 * is a minimal structural subset of the DOM `Storage` interface (which `window.sessionStorage`
 * satisfies as-is, with no adapter needed at the call site in chat-page.tsx) — narrow enough that
 * a unit test can pass a plain in-memory fake instead of requiring a real browser global.
 *
 * Restoring a stashed draft requires positive evidence that this mount IS the genuine reload the
 * stash was written for. Two ways a naive "restore any key under this plugin's prefix on mount"
 * would hand a draft to the wrong reader:
 *  - Cross-user: sessionStorage is per-tab and per-origin, NOT per-user, and a same-origin
 *    logout/login does not clear it. On a shared workstation, analyst A's stashed draft would be
 *    handed straight to analyst B the moment B's ChatPage mounted.
 *  - Cross-conversation: ChatPage mounts with its active conversation id still null (a conversation
 *    named by the URL/session pointer is only resolved asynchronously, see
 *    common/conversation-location.ts) — the same starting point a real reload produces — so a
 *    fallback scan would fire on ANY mount, not only a genuine reload.
 *
 * There is no client-side identity to key the stash on, and adding one would mean a new server
 * route: `GET /settings/access` (server/routes/settings.ts, wrapped by
 * `services/settings-service.ts#getSettingsAccess`) returns only `{administrator, message,
 * defaultApiHostId}`, and `plugin.ts` declares no `requiredPlugins`/`optionalPlugins` on the
 * platform `security` plugin, so there is no `core.security`/`authc` surface to read either.
 * Instead of inventing an identity, this module:
 *   (a) only restores when the current mount carries positive evidence of being that one genuine
 *       reload (see `NavigationType`/`reloadExpected` below). Every other call — a plain remount, a
 *       fresh navigation after a same-tab logout/login, a back/forward nav, an unrelated reload
 *       days later — clears EVERY `wazuhAiAssistant.chatDraft.*` key and restores nothing; and
 *   (b) handles a fresh session start through that same branch: a fresh login is by construction a
 *       case with no genuine-reload evidence, so it is wiped rather than needing its own path.
 */

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string | null;
  readonly length: number;
}

/** Namespaced so this plugin's stash keys can never collide with another plugin's sessionStorage
 * use, and so `restoreAndClearDraft`'s scan (below) and its clear-everything branch know which
 * keys are "ours" to consider. */
const DRAFT_STASH_PREFIX = 'wazuhAiAssistant.chatDraft';

/** Stand-in for `ConversationRecord['id']` when no conversation has been saved yet — ChatPage's
 * `activeConversationId` is `null` for a brand-new conversation, and `null` cannot be interpolated
 * into a storage key directly. */
const NEW_CONVERSATION_SENTINEL = '_new';

/**
 * Sibling marker key, written alongside a draft at the exact moment `stashDraft` is called (i.e.
 * exactly when chat-page.tsx shows the "reload to sign in" callout) and consumed (removed) by the
 * very next `restoreAndClearDraft` call regardless of outcome. Its presence is this module's only
 * record of "a reload was solicited"; combined with `navigationType` evidence from the caller, it
 * is what lets `restoreAndClearDraft` tell a genuinely-requested reload apart from a plain remount
 * or a fresh post-login page load that merely happens to land on the same key.
 */
const RELOAD_EXPECTED_KEY = `${DRAFT_STASH_PREFIX}.reloadExpected`;

/**
 * Mirrors the subset of `PerformanceNavigationTiming['type']` this module cares about. Deliberately
 * injected as a plain parameter (rather than this module reading `performance` itself) so the
 * pure/dependency-free contract its unit tests rely on still holds — see `restoreAndClearDraft`'s own
 * doc comment for how the caller (chat-page.tsx) is expected to derive it.
 */
export type NavigationType =
  | 'reload'
  | 'navigate'
  | 'back_forward'
  | 'prerender'
  | 'unknown';

/** Builds the namespaced sessionStorage key for one open conversation's draft stash. */
export function buildDraftStashKey(conversationId: string | null): string {
  return `${DRAFT_STASH_PREFIX}.${conversationId ?? NEW_CONVERSATION_SENTINEL}`;
}

/**
 * Writes `draft` under `conversationId`'s key, and arms `RELOAD_EXPECTED_KEY` so the very next
 * `restoreAndClearDraft` call knows a reload was genuinely solicited right now (see that marker's
 * own doc comment). A blank/whitespace-only draft CLEARS the slot instead of stashing an empty
 * string — there is nothing useful to restore, so the marker is disarmed too, rather than left
 * armed for a reload that would have nothing to restore anyway.
 */
export function stashDraft(
  storage: KeyValueStorage,
  conversationId: string | null,
  draft: string,
): void {
  const key = buildDraftStashKey(conversationId);
  if (draft.trim().length === 0) {
    storage.removeItem(key);
    storage.removeItem(RELOAD_EXPECTED_KEY);
    return;
  }
  // ENFORCE the "at most one draft is ever waiting" invariant this module documents, rather than
  // assuming it. It previously held only because `handleSessionExpired` was expected to fire once
  // before the reload. If it fired twice for two DIFFERENT conversations (the user keeps working
  // while the callout is up, switches conversation, hits a second 401), the first key was never
  // cleared — and `restoreAndClearDraft`'s fallback scan returns whichever key storage enumerates
  // FIRST, i.e. the STALE one. That restored an old draft into the wrong conversation and orphaned
  // the current one. Clearing first makes the newest stash authoritative.
  clearAllDraftKeys(storage);
  storage.setItem(key, draft);
  storage.setItem(RELOAD_EXPECTED_KEY, '1');
}

/**
 * Removes every `wazuhAiAssistant.chatDraft.*` key (drafts AND the reload-expected marker). Collects
 * matching keys before removing any of them — `KeyValueStorage.key(index)` is only well-defined
 * against a stable key set, and removing mid-scan could skip a key as the underlying collection
 * shrinks out from under the loop.
 */
function clearAllDraftKeys(storage: KeyValueStorage): void {
  const keysToClear: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key && key.startsWith(DRAFT_STASH_PREFIX)) {
      keysToClear.push(key);
    }
  }
  keysToClear.forEach(key => storage.removeItem(key));
}

/**
 * Finds and removes the one stashed draft, but ONLY when `navigationType` is a genuine `'reload'`
 * AND `stashDraft` armed `RELOAD_EXPECTED_KEY` for this exact restore attempt (see that marker's
 * doc comment) — i.e. only across the one reload the "Your session expired" callout itself asked
 * for. `navigationType` defaults to `'unknown'` so a call site that omits it fails safe: clears,
 * never restores.
 *
 * Callers should derive `navigationType` from `performance.getEntriesByType('navigation')[0]?.type`
 * (a real DOM API, kept out of this module to preserve its pure/dependency-free contract — see
 * chat-page.tsx's `detectNavigationType` helper). A plain SPA remount (e.g. the app shell's
 * Chat<->Settings tab switch, which resets `activeConversationId` back to `null` exactly like a
 * reload does) does NOT change what that API reports for the current page load, which is what
 * makes it a usable signal. Requiring the marker on top covers the cross-user case: a same-tab
 * logout/login is a fresh navigation rather than a reload, so it never carries reload evidence
 * even though sessionStorage itself survived the login.
 *
 * On anything OTHER than that one genuine, solicited reload, this clears every stashed key
 * (drafts and the marker) and returns `null` — see `clearAllDraftKeys` and the module's own doc
 * comment for why "clear when evidence is missing" is also what covers a fresh session start.
 *
 * When evidence IS present: checks `conversationId`'s own key first, then falls back to scanning
 * for any remaining stashed draft under this plugin's prefix — safe here specifically because
 * every non-qualifying call already wiped everything else, so at most one entry can be waiting.
 * Always clears whatever slot it restores from (and the marker), so a later call never re-restores
 * the same draft twice.
 */
export function restoreAndClearDraft(
  storage: KeyValueStorage,
  conversationId: string | null,
  navigationType: NavigationType = 'unknown',
): string | null {
  const reloadWasExpected = storage.getItem(RELOAD_EXPECTED_KEY) !== null;
  const isSolicitedReload = navigationType === 'reload' && reloadWasExpected;

  if (!isSolicitedReload) {
    clearAllDraftKeys(storage);
    return null;
  }

  // Consumed here: good for exactly the one restore attempt it was armed for.
  storage.removeItem(RELOAD_EXPECTED_KEY);

  const preferredKey = buildDraftStashKey(conversationId);
  const preferred = storage.getItem(preferredKey);
  if (preferred !== null) {
    storage.removeItem(preferredKey);
    return preferred;
  }

  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (
      key &&
      key !== RELOAD_EXPECTED_KEY &&
      key.startsWith(DRAFT_STASH_PREFIX)
    ) {
      const value = storage.getItem(key);
      storage.removeItem(key);
      return value;
    }
  }
  return null;
}
