/**
 * Shared identifiers and API paths used by both public/ and server/.
 * Keep this the single source of truth so routes and clients never drift.
 */

export const PLUGIN_ID = 'wazuhAiAssistant';
export const PLUGIN_NAME = 'AI Assistant';

export const API_ROOT = '/api/wazuh_ai_assistant';

export const API_PATHS = {
  CHAT: `${API_ROOT}/chat`,
  PROVIDERS: `${API_ROOT}/providers`,
  PROVIDER_BY_ID: (id: string) => `${API_ROOT}/providers/${id}`,
  PROVIDER_TEST: (id: string) => `${API_ROOT}/providers/${id}/test`,
  PROVIDER_SET_DEFAULT: (id: string) => `${API_ROOT}/providers/${id}/default`,
  /** Singleton settings resource — privacy defaults/override/field
   * policy today; GET creates the object with defaults on first access. */
  SETTINGS: `${API_ROOT}/settings`,
  /** Manager-session liveness probe: `{managerSessionOk: boolean, message: string | null,
   * defaultApiHostId: string | null, apiKeyEncryptionEnabled: boolean}`, never 403ing. NOT an
   * authorization check — settings/providers are authorized by the Wazuh indexer's own RBAC on
   * the calling user (see docs/ref/modules/ai-assistant/security.md), not by this probe. Called on
   * app mount and before Manager-path work (public/services/session-heal.ts's
   * `ensureManagerSession`) so a missing/expired `wz-token` can be healed proactively. */
  SETTINGS_ACCESS: `${API_ROOT}/settings/access`,
  /** Persistent conversations: owner-scoped CRUD over the
   * `wazuh-ai-assistant-sessions` index alias (server/routes/conversations.ts,
   * server/conversation-store.ts). GET lists the caller's own conversations (summaries only —
   * id/title/updatedAt, never `messages`); POST creates one; GET/PUT/PATCH/DELETE `{id}` operate on
   * a single conversation and 404 (never 403) when it exists but belongs to a different owner, so
   * existence is never leaked cross-owner. PATCH is title-only (rename); PUT replaces the full
   * title+messages transcript. */
  CONVERSATIONS: `${API_ROOT}/conversations`,
  CONVERSATION_BY_ID: (id: string) => `${API_ROOT}/conversations/${id}`,
} as const;

/** Substring contract between server/routes/settings.ts's Manager-session-expired copy and the
 * client-side session heal/retry (public/services/session-heal.ts) — reword only in both
 * directions at once. */
export const MANAGER_SESSION_EXPIRED_COPY = 'session is missing or expired';

/**
 * Paths (relative to the OpenSearch/Wazuh indexer HTTP root) of the Wazuh indexer Setup plugin's
 * `AI Assistant` endpoints — a REAL, documented contract, not a placeholder: see the `AI
 * Assistant` tag's `/ai_assistant/settings` and `/ai_assistant/providers`{, `/{id}`} paths in the
 * OpenAPI spec at
 * https://github.com/wazuh/wazuh-indexer-plugins/blob/enhancement/1422-create-ai-assistant-indices/plugins/setup/openapi.yml
 * (`getAiAssistantSettings`/`putAiAssistantSettings`/`listAiAssistantProviders`/
 * `createAiAssistantProvider`/`putAiAssistantProvider`/`deleteAiAssistantProvider` operations).
 *
 * The two are genuinely separate resources on the indexer side, each with its own reader/writer
 * here, neither ever calling OpenSearch's raw document APIs against the underlying hidden index
 * directly any more (wazuh-dashboard-plugins#500): `server/settings/index-settings-provider.ts`
 * for `GET`/`PUT {WAZUH_INDEXER_AI_ASSISTANT_SETTINGS_PATH}` (privacy defaults/override/field
 * policy only — no providers in that response), `server/settings/ai-providers-client.ts` for
 * `{WAZUH_INDEXER_AI_ASSISTANT_PROVIDERS_PATH}`{, `/{id}`} (provider CRUD). Both reach it the same
 * way `IsmSettingsProvider` reaches `_plugins/_ism/*`: `context.core.opensearch.client.
 * {asInternalUser, asCurrentUser}.transport.request(...)` — no separate HTTP client, since this is
 * still an OpenSearch-cluster-local endpoint (the Wazuh indexer plugin runs inside the same
 * cluster), not an external service.
 */
export const WAZUH_INDEXER_AI_ASSISTANT_SETTINGS_PATH =
  '/_plugins/_setup/ai_assistant/settings';

/** `GET` lists every provider (no pagination/query of its own — `AiProvidersClient` fetches this
 * whole list and slices/searches it in memory, see that class's doc comment); `POST` creates one
 * (id supplied in the body, validated server-side as a UUID); `PUT`/`DELETE {this path}/{id}`
 * update/delete one. There is no per-id `GET`. */
export const WAZUH_INDEXER_AI_ASSISTANT_PROVIDERS_PATH =
  '/_plugins/_setup/ai_assistant/providers';

/** Namespacing label bound into the AAD of every provider API key's ciphertext
 * (server/crypto/api-key-cipher.ts's `buildAad`) — kept as its own named constant purely so that
 * derivation can't silently drift if this string is ever referenced from a second place. Its
 * decrypt-time role only needs its VALUE to stay byte-for-byte identical to what a given ciphertext
 * was encrypted with, so this string itself must never change once anything has been encrypted
 * against it. */
export const PROVIDER_API_KEY_AAD_NAMESPACE = 'wazuh-ai-assistant-provider';

/** Index alias backing persisted (resumable) conversations — one document per conversation: `user`
 * + title + timestamps + the full `ChatMessage[]` transcript. It is a data stream managed by an
 * ISM policy on the indexer side (wazuh-indexer-plugins#1422), rotated daily and pruned after 7
 * days; OpenSearch Document Level Security on it restricts each document to the `user` it belongs
 * to. Reached only through server/routes/conversations.ts's owner-scoped CRUD and
 * server/conversation-store.ts's query/document helpers — never a raw client call elsewhere. */
export const CONVERSATION_SESSIONS_INDEX_ALIAS = 'wazuh-ai-assistant-sessions';

/** Id of the ISM policy governing `CONVERSATION_SESSIONS_INDEX_ALIAS`'s retention, provisioned
 * indexer-side (wazuh-indexer-plugins#1422) — `server/settings/ism-settings-provider.ts` is the
 * only reader/writer. */
export const CONVERSATION_SESSIONS_ISM_POLICY_ID =
  'ai-assistant-sessions-policy';

/** Sentinel owner value used when the authenticated username cannot be resolved (main plugin/
 * security not ready, or `context.wazuh` absent).
 * server/routes/conversations.ts's `resolveOwner` never returns this any more — it fails closed
 * with `undefined` instead, and the four owner-CHECKING routes (list/get/put/delete) 403 on that
 * rather than ever comparing against a shared bucket value. The ONLY remaining writer is that
 * file's CREATE route, which still stamps this sentinel on a document's `user` field when identity
 * can't be resolved (see that route's comment for why that is still safe) — but since no route can
 * subsequently list, get, update, or delete a document stamped with it, this is now a create-only
 * dead end: the document persists but is otherwise unreachable through this API.
 * Separately and unrelatedly, server/routes/chat.ts's `resolveChatStreamUser` reuses this same
 * string as its own fallback bucket KEY for the per-user concurrent-stream rate limit (not an
 * authorization-relevant `user` value at all) — see that function's doc comment for the
 * availability tradeoff this implies when identity resolution is unavailable deployment-wide.
 * NOTE: eval/run_persistence.js cannot import this (plain CommonJS, no TypeScript/ts-node in that
 * harness) — it only ever verifies owner-scoping BEHAVIOR (a session sees only its own rows),
 * never this literal string. */
export const CONVERSATION_OWNER_FALLBACK = '_shared';

export const PROVIDER_TYPES = ['openai_compatible', 'anthropic'] as const;

export type ProviderType = (typeof PROVIDER_TYPES)[number];

/** Re-exported from `wazuh-fields.ts`, the single source of truth for the severity vocabulary. */
export { SEVERITY_LEVELS } from './wazuh-fields';
export type { SeverityLevel } from './wazuh-fields';

// 16384, not the API's old 4096 default: the model suggestions now lead with claude-sonnet-5 /
// claude-opus-5, which have adaptive "extended thinking" ON by default whenever `thinking` is
// omitted from the request (as this adapter does -- see anthropic.ts), and `max_tokens` on the
// Anthropic Messages API caps thinking tokens AND the visible answer together. At 4096 a model
// that spends a chunk of the budget thinking can truncate the user-visible answer mid-sentence.
// Raising the cap does not touch the thinking parameter itself (adaptive thinking stays on --
// that is wanted for answer quality); it only removes the shared-budget truncation risk.
export const DEFAULT_ANTHROPIC_MAX_TOKENS = 16384;
export const DEFAULT_ANTHROPIC_VERSION = '2023-06-01';

/**
 * Persisted-conversation size limits, shared by the SERVER route schemas that enforce them
 * (`server/routes/conversations.ts`) and the CLIENT helper that shapes the payload
 * (`common/chat-history.ts`'s `toPersistedMessages`).
 *
 * They live here, in common, specifically because having them in only one of those two places was
 * a real bug: the server rejected oversized payloads with a 400 while the client kept resending the
 * whole (still-oversized, ever-growing) message array on every turn. Auto-save treats a failure as
 * a non-fatal hiccup, so once a conversation crossed a limit its saves failed SILENTLY and could
 * never recover — the user kept chatting, believing history was being saved. The client now trims
 * to these exact numbers before sending, so a save can't be rejected for size at all.
 */
export const CONVERSATION_MAX_TITLE_LENGTH = 200;
export const CONVERSATION_MAX_MESSAGE_CONTENT_LENGTH = 100_000;
export const CONVERSATION_MAX_MESSAGES = 1000;

/**
 * Rows kept when a result table is persisted alongside the message it was shown with
 * (`PersistedChatMessage.table`). The live table is already capped at 500 rows server-side
 * (server/tools/digest.ts's `TABLE_ROW_CAP`); this second, tighter cap exists because a saved
 * conversation multiplies that by every table-bearing turn it holds.
 */
export const CONVERSATION_MAX_TABLE_ROWS = 100;

/**
 * Total serialized budget for a conversation's `messages` payload, enforced CLIENT-side before the
 * request is built (`common/chat-history.ts`'s `toPersistedMessages`).
 *
 * The per-message and per-conversation counts above bound the array's SHAPE but not its size: 1000
 * messages of 100k characters is a ~100 MB payload on paper, while OSD's default
 * `server.maxPayloadBytes` is 1 MB — so a conversation could satisfy every limit above and still be
 * rejected with a 413, which auto-save treats as a non-fatal hiccup and therefore fails silently
 * and permanently. Persisting tables and tool-call history makes that ceiling much easier to reach,
 * so the trim now also drops content (oldest and least essential first) until the payload fits.
 * Set well below 1 MB to leave room for the title, the JSON envelope and multi-byte characters.
 */
export const CONVERSATION_MAX_SERIALIZED_BYTES = 700_000;
