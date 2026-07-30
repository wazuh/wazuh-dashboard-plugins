/**
 * Canonical chat contract shared between public/ (SSE client) and server/ (provider adapters).
 * The intelligence layer (intents, table builder) that produces `table` events is a later
 * phase; the `TableSpec` shape below is the extension point it will populate.
 */

import { ProviderType } from './constants';

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

/**
 * Minimal JSON Schema subset the tool catalog is authored against: flat object schemas whose
 * properties are string/number/boolean/enum, or arrays of those. Enough for every read/mutation
 * tool in the catalog; anything more expressive (nested objects,
 * oneOf, etc.) is deliberately out of scope so the hand-rolled validator can stay small.
 */
export type JsonSchemaPrimitiveType = 'string' | 'number' | 'boolean';

export interface JsonSchemaPrimitive {
  type: JsonSchemaPrimitiveType;
  description?: string;
  enum?: Array<string | number>;
}

export interface JsonSchemaArray {
  type: 'array';
  description?: string;
  items: JsonSchemaPrimitive;
  /**
   * Minimal length-bounds extension (added for the stage-1 router's `route_question.categories`
   * param — server/tools/router.ts — which must express "pick 1-2 categories"). Enforced
   * server-side by schema-validator.ts's `validateArray`; passed through unchanged on both wire
   * formats by wire-schema.ts's `widenNumericTypes` (plain JSON Schema keywords OpenAI's and
   * Anthropic's function/tool parameter schemas both already accept verbatim — no adapter change
   * needed, see wire-schema.ts's comment). Optional so every existing array property (unaffected)
   * keeps compiling and behaving identically.
   */
  minItems?: number;
  maxItems?: number;
}

export type JsonSchemaProperty = JsonSchemaPrimitive | JsonSchemaArray;

export interface JsonSchemaObject {
  type: 'object';
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
}

/** OpenAI-shaped canonical tool definition; each adapter translates it to its own wire format. */
export interface ToolSpec {
  name: string;
  description: string;
  parameters: JsonSchemaObject;
}

/** A fully assembled tool call — arguments are already parsed, never partial JSON. */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export type CanonicalToolChoice =
  | 'auto'
  | 'none'
  | 'required'
  | { name: string };

export interface ChatMessage {
  role: ChatRole;
  content: string;
  /** Set on assistant messages that invoked one or more tools; `content` may be empty then. */
  toolCalls?: ToolCall[];
  /** Set on role:'tool' messages: which ToolCall.id this result answers. */
  toolCallId?: string;
}

/** One client-held pseudonym mapping entry: a real value and
 * the synthetic token ("HOST_1", "IP_2", ...) standing in for it on the wire. Shared shape for the
 * chat request's `privacy.map` (below) and the `privacy_map` StreamEvent's `entries`. */
export interface PseudonymEntry {
  value: string;
  pseudonym: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  providerId: string;
  /**
   * Privacy mode: the pseudonym map is client-held and stateless server-side — every
   * request re-seeds the server's per-request pseudonymizer from `map`, and any NEW entries minted
   * during the turn are streamed back once via the `privacy_map` StreamEvent (below) for the
   * client to fold in before its next request. `enabled` is honored only when the resolved
   * settings (server/saved_objects — `wazuh-ai-assistant-settings`) allow user override; otherwise
   * the server-side default for the request's provider wins regardless of what is sent here.
   */
  privacy?: {
    enabled?: boolean;
    map?: PseudonymEntry[];
  };
}

export interface TableColumn {
  id: string;
  label: string;
}

export interface TableSpec {
  columns: TableColumn[];
  rows: Array<Record<string, unknown>>;
  /** If set, this column's values are rendered as severity EuiBadge instead of plain text. */
  severityColumn?: string;
  /**
   * "Open in Discover" support (result-table.tsx / discover-link.tsx): only ever present for a
   * table built from the Indexer path (server/tools/executor.ts's `executeIndexerRequest`) — the
   * Manager API path has no index/DSL concept, so its tables never carry this field. `index` is the
   * concrete index the search ran against (e.g. "wazuh-findings-v5*"); `dsl` is the executed query
   * clause (the guardrail-clamped `body.query`, not a `{query: ...}` wrapper) that the client
   * rison-encodes verbatim into the Discover link's custom filter.
   */
  discover?: {
    index: string;
    dsl: Record<string, unknown>;
  };
}

export interface StreamUsage {
  inputTokens?: number;
  outputTokens?: number;
}

export type StreamEvent =
  | { type: 'delta'; content: string }
  | { type: 'table'; spec: TableSpec }
  /** Emitted once per call, fully assembled server-side; the browser never sees partial JSON. */
  | { type: 'tool_call'; toolCall: ToolCall }
  /**
   * Transient progress line (e.g. "querying Wazuh") shown between deltas while the engine works.
   */
  | { type: 'status'; message: string }
  /**
   * Privacy mode: every NEW pseudonym-map entry minted server-side this turn (not the ones
   * already seeded from the request's `privacy.map`), streamed once per turn before `done` so the
   * client's held map stays complete for its next request.
   */
  | { type: 'privacy_map'; entries: PseudonymEntry[] }
  /**
   * Digest-in-history support: the bounded digest JSON the model actually saw for one tool call
   * (pseudonym-form when privacy mode is on), emitted right after that call's `table` event so the
   * client can reconstruct the `[assistant{toolCalls}, tool{content}]` message pair this
   * `toolCallId` belongs to and re-send it as history on a later turn.
   */
  | { type: 'digest'; toolCallId: string; content: string }
  | { type: 'done'; usage?: StreamUsage }
  | { type: 'error'; message: string }
  /**
   * Session-expiry recovery UX (the dashboard's
   * 15-minute session TTL vs fully-quiescent idle tabs — an idle-out reader's next question 401s
   * with no explanation). Manufactured entirely CLIENT-side (public/services/chat-service.ts) when
   * the initial `POST /chat` itself returns HTTP 401 — the server never emits this as an actual SSE
   * frame, since a 401 on the request fails before the route handler starts streaming anything at
   * all; it exists in this shared union purely so chat-page.tsx's stream-consuming loop can treat
   * it as one more `StreamEvent` variant alongside the ones the server truly sends, instead of a
   * separate one-off signal. Carries no message: chat-page.tsx renders one fixed, translated
   * callout for every occurrence, unlike the free-form `error` variant above.
   */
  | { type: 'auth_expired' };

/**
 * Persistent conversations (server/routes/conversations.ts + server/saved_objects/
 * conversation.ts). `ConversationSummary` is what GET /conversations (the list route) returns per
 * item — deliberately WITHOUT `messages`, so listing a user's conversations never pulls every
 * transcript over the wire. `ConversationRecord` is the full shape returned by POST/GET-by-id/PUT.
 * Neither carries `owner`: it is a server-only, never-client-supplied stamp (see
 * server/routes/conversations.ts's `resolveOwner` doc comment) that the public API never echoes
 * back, so there is nothing here a client could tamper with.
 */
export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

/**
 * One message as a saved conversation stores it: a `ChatMessage` plus the two presentation fields a
 * resumed conversation needs in order to be the SAME conversation rather than a summary of one.
 *
 * Both are optional, and deliberately so: conversations saved before they existed simply lack them
 * and resume exactly as they did before (no migration — `messages` is an `enabled: false` opaque
 * object in the saved-object mappings, see server/saved_objects/conversation.ts).
 *
 * What was lost without them: `createdAt` meant every message in a resumed conversation was stamped
 * with the moment of the resume, so a conversation from last week read as seconds old; and dropping
 * `table` meant the result tables disappeared, leaving the model's prose describing tables that were
 * no longer on screen (and taking "Open in Discover" with them).
 *
 * The MODEL-facing half of a turn is not a new field: the `[assistant{toolCalls}, tool{content}]`
 * pairs are persisted as ordinary `ChatMessage`s interleaved before the assistant's prose message,
 * exactly the shape `common/chat-history.ts`'s `buildOutgoingMessages` already sends on the wire, so
 * a resumed conversation can rebuild the tool history a follow-up question depends on.
 */
export interface PersistedChatMessage extends ChatMessage {
  /** Epoch milliseconds, as `Date.now()` produced it when the message was first shown. */
  createdAt?: number;
  /** The result table this message was displayed with, row-capped at save time. */
  table?: TableSpec;
  /** The answer was cut short (Stop, navigation, a dropped connection) rather than completed, so a
   * resumed conversation can label it instead of presenting a partial answer as a finished one. */
  interrupted?: boolean;
}

export interface ConversationRecord extends ConversationSummary {
  createdAt: string;
  messages: PersistedChatMessage[];
  /**
   * Optimistic-concurrency token (two tabs on the
   * same conversation previously overwrote each other, last-write-wins). Opaque, OSD-assigned
   * (the underlying saved object's own `version`) — never parsed or compared client-side, only
   * round-tripped: the client remembers the value from the last GET/POST/PUT response it saw for
   * this conversation and sends it back as `expectedVersion` on its next PUT (server/routes/
   * conversations.ts) so a write against a since-changed row 409s instead of silently overwriting
   * it. `undefined` only in the defensive case where the saved-objects client itself omits a
   * version (does not happen in practice on this OSD version, but the type stays honest about it).
   * Deliberately absent from `ConversationSummary` — the list route never needed a version before
   * this fix and still doesn't (only single-conversation GET/POST/PUT round-trip it).
   */
  version?: string;
}

/**
 * Provider configuration as stored (server side). `apiKey` is never sent back to the browser;
 * see ProviderSummary for the shape exposed over the public CRUD API.
 */
export interface ProviderConfig {
  id: string;
  name: string;
  type: ProviderType;
  baseUrl: string;
  model: string;
  apiKey?: string;
  isDefault?: boolean;
}

/** Shape returned to the browser: apiKey is redacted to a boolean presence flag. */
export interface ProviderSummary {
  id: string;
  name: string;
  type: ProviderType;
  baseUrl: string;
  model: string;
  hasApiKey: boolean;
  isDefault: boolean;
}

export interface ProviderInput {
  name: string;
  type: ProviderType;
  baseUrl: string;
  model: string;
  /** Empty string on update means "keep the existing key". */
  apiKey?: string;
  isDefault?: boolean;
}

export interface ProviderTestResult {
  success: boolean;
  latencyMs: number;
  message?: string;
}
