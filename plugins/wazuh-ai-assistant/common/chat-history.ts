/**
 * Pure chat-history helpers extracted from public/components/chat/chat-page.tsx (quality pass,
 * port/5.0). Kept dependency-free and under common/ specifically so unit tests (colocated as
 * chat-history.test.ts) can import them directly — tsconfig.test.json only includes common/** and
 * server/**, not public/** (same convention as common/draft-stash.ts and
 * common/conversation-merge.ts).
 *
 * `ChatHistoryMessage` below is a deliberately MINIMAL structural subset of
 * `public/components/chat/message-bubble.tsx`'s `UiChatMessage`: id/role/content/createdAt plus the
 * optional `table`, which is persisted and restored (see `toPersistedMessages`). `isStreaming` and
 * `statusMessage` stay out — they describe a turn in progress, and no function here touches
 * them. Every real `UiChatMessage` the caller passes in already satisfies this shape (it only has
 * MORE optional fields), and every `ChatHistoryMessage` this module hands back satisfies
 * `UiChatMessage` the same way (the extra fields on `UiChatMessage` are all optional) — so
 * chat-page.tsx passes/receives its own `UiChatMessage[]` at every call site with no cast needed,
 * while this module itself never has to import anything from public/.
 *
 * `buildConversationTitle`'s one i18n string (the "Untitled conversation" fallback) is passed in
 * by the caller as `untitledLabel` rather than resolved in here with `i18n.translate` — `@osd/i18n`
 * is a public/OSD-side dependency this module deliberately does not take on, and chat-page.tsx
 * already computes that same translated string via the exact same `i18n.translate(...)` call it
 * always did, just at the call site instead of inside this function. That call has no side effects
 * (no render, no network, no state) beyond producing a string, so evaluating it unconditionally at
 * the call site rather than lazily inside the old inline version changes nothing observable.
 */

import {
  ChatMessage,
  ChatRole,
  PersistedChatMessage,
  TableSpec,
  ToolCall,
} from './types';
import { NavigationType } from './draft-stash';
import {
  CONVERSATION_MAX_MESSAGES,
  CONVERSATION_MAX_MESSAGE_CONTENT_LENGTH,
  CONVERSATION_MAX_SERIALIZED_BYTES,
  CONVERSATION_MAX_TABLE_ROWS,
} from './constants';

/** Minimal shape every function below needs — see the module doc comment for why this, and not
 * public's `UiChatMessage`, is what they're typed against. */
export interface ChatHistoryMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  /** The result table this message was displayed with, when it had one. */
  table?: TableSpec;
  /** The answer was cut short rather than completed — see `PersistedChatMessage.interrupted`. */
  interrupted?: boolean;
  /** The tool calls this turn ran, for display only (message-bubble.tsx's "queries executed"
   * panel). Never persisted from here: `toPersistedMessages` writes the model-facing
   * `[assistant{toolCalls}, tool{digest}]` pairs from the turn records instead, and
   * `reconstructConversation` is what puts them back on the message for display. */
  toolCalls?: ToolCall[];
  /** Wire-proof fix: whether privacy was ON when THIS message's turn ran — only ever set on
   * `role: 'assistant'` prose. See `common/types.ts`'s `ChatMessage.privacyEnabled` doc comment for
   * the full mechanism; `excludePrivacyOffHistory` below is what actually consults it. */
  privacyEnabled?: boolean;
}

let messageCounter = 0;
/** Single shared id generator — moved here (not duplicated) so chat-page.tsx's own direct calls
 * (`handleSend`'s user/assistant messages) and `reconstructUiMessages`'s calls below still draw
 * from the exact same monotonic counter they always did. */
export function nextMessageId(): string {
  messageCounter += 1;
  return `msg-${Date.now()}-${messageCounter}`;
}

/** One model-issued tool call this conversation has seen, kept for digest-in-history (below). */
export interface ToolExchange {
  /**
   * REAL-form arguments, exactly as carried by the `tool_call` SSE event: server/routes/chat.ts
   * reverses the model's pseudonym-form arguments to real values before yielding that event
   * (chat.ts's `realArguments`/`toolCallForClient`, built right where the `tool_call` stream event
   * is yielded), unlike the pseudonym-form `ToolCall` chat.ts appends to its OWN in-memory
   * `messages` accumulator for the provider (chat.ts's own comment there: "ORIGINAL
   * (pseudonym-form) toolCall, not toolCallForClient").
   */
  toolCall: ToolCall;
  /**
   * The correlated `digest` event's content (chat.ts's tool-call handling in the orchestration
   * loop, matched by `toolCallId`) — already pseudonym-form when privacy was on for that turn.
   * Stays `undefined` for a tool call that never got a table/digest pair at all (e.g. a guardrail
   * rejection short-circuited before `outcome.tableEvent` was ever set) — such a call is never
   * resent as history.
   */
  digestContent?: string;
  /** Wire-proof fix: whether privacy was ON when THIS exchange's digest was captured — see
   * `common/types.ts`'s `ChatMessage.privacyEnabled` doc comment for the full mechanism. Captured
   * per-exchange (not per-turn) to mirror `digestContent`'s own granularity, even though today every
   * exchange within one turn necessarily shares the same value (privacy is resolved once per HTTP
   * request in `server/routes/chat.ts`, before any tool call runs). */
  privacyEnabled?: boolean;
}

export interface AssistantTurnRecord {
  assistantMessageId: string;
  toolExchanges: ToolExchange[];
}

/**
 * Best-effort client-side heuristic for the wz-token pre-check: the server never
 * surfaces a Manager-call failure to the browser as its own StreamEvent — it is swallowed into a
 * bounded `role:'tool'` error message (server/tools/executor.ts's `executeManagerRequest` catch
 * block, prefixed `"Manager request failed: "`) that only the MODEL sees, so the only place this
 * text can ever reach the client is inside the model's own narrated answer (LLMs commonly quote or
 * paraphrase a tool error when explaining a failure) or, more rarely, a top-level stream `error`
 * event. No new server route is added for a dedicated probe; this
 * scans whatever text IS visible for that prefix plus common HTTP-auth vocabulary and offers the
 * generic "reload / sign in again" remedy that fixes a stale wz-token specifically and is harmless
 * advice for any other Manager-call failure caught by the same net.
 *
 * The needles track server/tools/executor.ts's `mapManagerError` wording: on a 401/403 it emits
 * "Wazuh Manager authentication failed (the dashboard session token is missing or expired) ... Tell
 * the user to reload the page and sign in again", and any other Manager failure keeps the generic
 * "Manager request failed" prefix. This is a BEST-EFFORT match by nature — it matches the MODEL's
 * narration of that server message, not the message itself — so re-verify it whenever
 * `mapManagerError`'s wording changes.
 *
 * Auth vocabulary alone is NOT sufficient evidence, which is why the generic needles are gated on a
 * Manager mention. This runs over the whole narrated answer, and answers about authentication
 * failures are one of the assistant's most common jobs: "42 authentication failed events for user
 * root" must not raise a "your session may have expired" callout on a turn that worked perfectly.
 */
const MANAGER_AUTH_NEEDLES = [
  'manager request failed',
  'reload the page and sign in',
  'dashboard session token',
  'wz-token',
  'wz_token',
];

/** Generic auth-failure vocabulary: only meaningful alongside a MANAGER_CONTEXT_NEEDLE. */
const AUTH_FAILURE_NEEDLES = [
  'authentication failed',
  'missing or expired',
  'jwt expired',
  'token expired',
  'token has expired',
  'invalid token',
  'unauthorized',
];

const MANAGER_CONTEXT_NEEDLES = ['manager', 'wazuh api', 'server api'];

export function detectManagerAuthError(text: string): boolean {
  const haystack = text.toLowerCase();
  if (MANAGER_AUTH_NEEDLES.some(needle => haystack.includes(needle))) {
    return true;
  }
  return (
    MANAGER_CONTEXT_NEEDLES.some(needle => haystack.includes(needle)) &&
    AUTH_FAILURE_NEEDLES.some(needle => haystack.includes(needle))
  );
}

/**
 * The one piece of DOM-dependent evidence `restoreAndClearDraft`
 * (common/draft-stash.ts) needs but deliberately does not read itself, to keep that module
 * pure/dependency-free for unit testing. `performance.getEntriesByType('navigation')` reports exactly
 * one entry for the CURRENT page load's own navigation — `'reload'` only for an actual browser
 * reload (F5 / reload button), never for a plain SPA remount (this app shell's Chat<->Settings tab
 * switch does not touch browser navigation at all) and never for a fresh navigation such as the
 * page load right after a same-tab logout/login. Wrapped in a try/catch: the Navigation Timing API
 * is broadly supported but not guaranteed everywhere, and any failure here should only ever
 * suppress a draft restore (safe default), never throw out of a mount effect.
 */
export function detectNavigationType(): NavigationType {
  try {
    const [entry] = performance.getEntriesByType(
      'navigation',
    ) as PerformanceNavigationTiming[];
    if (
      entry &&
      (entry.type === 'reload' ||
        entry.type === 'navigate' ||
        entry.type === 'back_forward' ||
        entry.type === 'prerender')
    ) {
      return entry.type;
    }
  } catch {
    // Treated as 'unknown' below, same as a browser with no Navigation Timing support at all.
  }
  return 'unknown';
}

/** Title truncation length for an auto-saved conversation's title (first user message). */
export const CONVERSATION_TITLE_MAX_LENGTH = 60;

/**
 * Auto-save title: the first USER message, truncated to `CONVERSATION_TITLE_MAX_LENGTH`
 * chars. Recomputed on every auto-save (not just at creation) — idempotent, since the first user
 * message of an already-created conversation never changes, and there is no rename UI yet that
 * this could ever clobber.
 *
 * `untitledLabel` is the already-i18n-translated "Untitled conversation" string — see the module
 * doc comment above for why the translation itself happens at the call site, not in here.
 */
export function buildConversationTitle(
  messages: ChatHistoryMessage[],
  untitledLabel: string,
): string {
  const firstUserMessage = messages.find(message => message.role === 'user');
  const raw = firstUserMessage?.content.trim() ?? '';
  if (!raw) {
    return untitledLabel;
  }
  return raw.length > CONVERSATION_TITLE_MAX_LENGTH
    ? `${raw.slice(0, CONVERSATION_TITLE_MAX_LENGTH - 1)}…`
    : raw;
}

/** UTF-8 byte length of a JSON payload, which is what a request body is actually measured in. */
function serializedBytes(value: unknown): number {
  const json = JSON.stringify(value);
  return typeof TextEncoder === 'function'
    ? new TextEncoder().encode(json).length
    : // No TextEncoder (a very old runtime): the character count is a lower bound, which errs
      // toward trimming more rather than less.
      json.length;
}

/** Row-caps a table for persistence; `undefined` in, `undefined` out. */
function toPersistedTable(table?: TableSpec): TableSpec | undefined {
  if (!table) {
    return undefined;
  }
  return table.rows.length > CONVERSATION_MAX_TABLE_ROWS
    ? { ...table, rows: table.rows.slice(0, CONVERSATION_MAX_TABLE_ROWS) }
    : table;
}

/**
 * Reduces a UI message list, plus the tool exchanges recorded for its assistant turns, to the shape
 * a saved conversation persists.
 *
 * Everything a resumed conversation needs to BE that conversation is included: `role`/`content` as
 * before, plus each message's real `createdAt`, its result `table` (row-capped), and the
 * `[assistant{toolCalls}, tool{digest}]` pairs for each turn's tool calls — interleaved before that
 * turn's prose message, the same ordering `buildOutgoingMessages` uses on the wire, so
 * `reconstructConversation` can rebuild both halves. `statusMessage`/`isStreaming` stay unpersisted:
 * they describe a turn IN PROGRESS and are meaningless once it has ended.
 *
 * (server/conversation-store.ts's PRIVACY INTERACTION doc comment still governs what this
 * means at rest: these messages are real-valued, and the pseudonym map is never persisted.)
 *
 * Everything is trimmed to what the server accepts (`common/constants.ts`) BEFORE the payload is
 * built. Without this the two sides disagreed and produced a silent, PERMANENT failure: once a
 * conversation exceeded a limit the route rejected the write with a 400/413, while auto-save (which
 * treats a failed save as a non-fatal hiccup, with no error banner) resent the same, now
 * permanently-oversized array on the next turn. Every later save failed too, so the user kept
 * chatting believing history was still being persisted when it had silently stopped.
 *
 * The trim is deliberately lossy-but-working rather than a hard failure. Each message's content is
 * clamped and the oldest messages roll off, first to `CONVERSATION_MAX_MESSAGES` and then to
 * whatever prose fits `CONVERSATION_MAX_SERIALIZED_BYTES`; tables and tool history are then added
 * back only while they still fit, tables first (they are what the user saw, and the prose describes
 * them) and tool history last (a model-side aid, of which `buildOutgoingMessages` resends only the
 * newest turns anyway).
 */
export function toPersistedMessages(
  messages: ChatHistoryMessage[],
  turnRecords: AssistantTurnRecord[] = [],
): PersistedChatMessage[] {
  // Keep the NEWEST messages: the tail is what a resumed conversation needs, so the oldest turns
  // roll off first.
  const recent =
    messages.length > CONVERSATION_MAX_MESSAGES
      ? messages.slice(messages.length - CONVERSATION_MAX_MESSAGES)
      : messages;

  const exchangesByMessageId = new Map(
    turnRecords.map(turn => [turn.assistantMessageId, turn.toolExchanges]),
  );

  // Each message's three possible parts, built and measured ONCE. Everything below is arithmetic
  // over these sizes rather than repeated build-and-serialize passes — a 1000-message conversation
  // of maximum-length messages is ~100 MB, and re-serializing that per candidate made the trim
  // itself the slowest thing in the app.
  const parts = recent.map(message => {
    const prose: PersistedChatMessage = {
      role: message.role,
      content:
        message.content.length > CONVERSATION_MAX_MESSAGE_CONTENT_LENGTH
          ? message.content.slice(0, CONVERSATION_MAX_MESSAGE_CONTENT_LENGTH)
          : message.content,
      createdAt: message.createdAt,
      ...(message.interrupted ? { interrupted: true } : {}),
      // Wire-proof fix: persists whether privacy was ON for this message's own turn, so a LATER
      // resume/reload can still fail-closed-exclude a privacy-off turn's prose from history —
      // see ChatMessage.privacyEnabled's doc comment (common/types.ts). Only ever set on
      // role:'assistant' (ChatHistoryMessage.privacyEnabled's own doc comment); `undefined` for
      // 'user' is intentional, not an omission.
      ...(message.privacyEnabled !== undefined
        ? { privacyEnabled: message.privacyEnabled }
        : {}),
    };
    const table = toPersistedTable(message.table);
    const toolEntries: PersistedChatMessage[] = [];
    if (message.role === 'assistant') {
      for (const exchange of exchangesByMessageId.get(message.id) ?? []) {
        if (!exchange.digestContent) {
          continue;
        }
        toolEntries.push({
          role: 'assistant',
          content: '',
          toolCalls: [exchange.toolCall],
        });
        toolEntries.push({
          role: 'tool',
          toolCallId: exchange.toolCall.id,
          content: exchange.digestContent,
          // Wire-proof fix: the flag the digest itself was captured under — see
          // ToolExchange.privacyEnabled's doc comment.
          ...(exchange.privacyEnabled !== undefined
            ? { privacyEnabled: exchange.privacyEnabled }
            : {}),
        });
      }
    }
    return {
      prose,
      table,
      toolEntries,
      // `+ 1` per array element for the separating comma.
      proseBytes: serializedBytes(prose) + 1,
      tableBytes: table ? serializedBytes({ table }) : 0,
      toolBytes: toolEntries.reduce(
        (sum, entry) => sum + serializedBytes(entry) + 1,
        0,
      ),
    };
  });

  // The `[]` the entries live in.
  const ENVELOPE_BYTES = 2;

  // Newest-first walk: keep the longest suffix of prose that fits. The tail is what a resumed
  // conversation needs, so the oldest turns are what roll off.
  let from = recent.length;
  let proseTotal = ENVELOPE_BYTES;
  for (let index = recent.length - 1; index >= 0; index -= 1) {
    if (
      proseTotal + parts[index].proseBytes >
      CONVERSATION_MAX_SERIALIZED_BYTES
    ) {
      break;
    }
    proseTotal += parts[index].proseBytes;
    from = index;
  }

  const kept = parts.slice(from);
  const tableTotal = kept.reduce((sum, part) => sum + part.tableBytes, 0);
  const toolTotal = kept.reduce((sum, part) => sum + part.toolBytes, 0);

  // Add back what still fits, in order of what a resumed conversation loses most by not having.
  // Tables come first: they are what the user SAW, and the model's prose describes them. Tool
  // history is a model-side aid, and `buildOutgoingMessages` only ever resends the newest turns of
  // it anyway, so it is the cheapest thing to drop.
  const withTables =
    proseTotal + tableTotal <= CONVERSATION_MAX_SERIALIZED_BYTES;
  const withToolHistory =
    proseTotal + (withTables ? tableTotal : 0) + toolTotal <=
    CONVERSATION_MAX_SERIALIZED_BYTES;

  const out: PersistedChatMessage[] = [];
  for (const part of kept) {
    if (withToolHistory) {
      out.push(...part.toolEntries);
    }
    out.push(
      withTables && part.table
        ? { ...part.prose, table: part.table }
        : part.prose,
    );
  }
  return out;
}

/**
 * A saved conversation, restored into the two things chat-page.tsx needs to continue it: the visible
 * message list and the per-turn tool-call bookkeeping a follow-up question is built from.
 */
export interface RestoredConversation {
  messages: ChatHistoryMessage[];
  turnRecords: AssistantTurnRecord[];
}

/**
 * Inverse of `toPersistedMessages`: splits a persisted transcript back into the messages that are
 * DISPLAYED and the `[assistant{toolCalls}, tool{digest}]` pairs that are not (they belong to the
 * model's view of the conversation, and are re-sent as history by `buildOutgoingMessages`).
 *
 * Restoring the tool history is what makes a resumed conversation continuable rather than merely
 * readable: without it the model saw only prose on the next turn, had no record of the queries whose
 * results that prose described, and typically re-ran them.
 *
 * Ids are freshly minted — a message id is a client-side render key, never persisted — and each
 * restored turn record is keyed to the new id of the assistant message it belongs to. `createdAt`
 * falls back to now only for a conversation saved before timestamps were persisted.
 */
export function reconstructConversation(
  persisted: PersistedChatMessage[],
): RestoredConversation {
  const messages: ChatHistoryMessage[] = [];
  const turnRecords: AssistantTurnRecord[] = [];
  let pendingExchanges: ToolExchange[] = [];

  for (const message of persisted) {
    // The model-facing half: an assistant message that only carries tool calls, immediately followed
    // by the `role:'tool'` result for each of them. Neither is ever displayed.
    if (message.role === 'assistant' && message.toolCalls?.length) {
      for (const toolCall of message.toolCalls) {
        pendingExchanges.push({ toolCall });
      }
      continue;
    }
    if (message.role === 'tool') {
      const exchange = pendingExchanges.find(
        candidate => candidate.toolCall.id === message.toolCallId,
      );
      if (exchange) {
        exchange.digestContent = message.content;
        // Wire-proof fix: restores the flag this digest was captured under, so a resumed/reloaded
        // conversation's history-replay decision (excludePrivacyOffHistory) still fails closed on
        // a digest captured with privacy off, exactly as it does within one live session. Only
        // assigned when present on the persisted message -- an explicit `privacyEnabled: undefined`
        // own property (vs. the key being simply absent) is indistinguishable for every real
        // consumer of this object, but IS distinguishable to a strict deep-equality check, so a
        // conditional assignment keeps a pre-fix-persisted (flag-less) exchange object shaped
        // exactly as it always was.
        if (message.privacyEnabled !== undefined) {
          exchange.privacyEnabled = message.privacyEnabled;
        }
      }
      continue;
    }
    if (message.role !== 'user' && message.role !== 'assistant') {
      continue;
    }

    const id = nextMessageId();
    messages.push({
      id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt ?? Date.now(),
      ...(message.table ? { table: message.table } : {}),
      ...(message.interrupted ? { interrupted: true } : {}),
      // Wire-proof fix: restores which turn's prose this was, for the same reason as above —
      // only ever meaningful (and only ever set by toPersistedMessages) on role:'assistant'.
      ...(message.privacyEnabled !== undefined
        ? { privacyEnabled: message.privacyEnabled }
        : {}),
    });
    if (message.role === 'assistant' && pendingExchanges.length > 0) {
      turnRecords.push({
        assistantMessageId: id,
        toolExchanges: pendingExchanges,
      });
      // Also handed back for DISPLAY, so a resumed answer still shows the queries behind it rather
      // than only replaying them to the model.
      messages[messages.length - 1].toolCalls = pendingExchanges.map(
        exchange => exchange.toolCall,
      );
    }
    // Tool pairs belong to the turn they precede, so they never carry over past one.
    pendingExchanges = [];
  }

  return { messages, turnRecords };
}

/**
 * `reconstructConversation`'s message half alone, for the callers that only replace what is on
 * screen (the merge-conflict path reflecting a server-side merge back into the visible chat).
 */
export function reconstructUiMessages(
  messages: PersistedChatMessage[],
): ChatHistoryMessage[] {
  return reconstructConversation(messages).messages;
}

/** History budget: only the last N assistant turns' tool exchanges are resent —
 * older turns send prose only. */
export const TOOL_HISTORY_MAX_TURNS = 2;
/** Total resent digest content across all included turns is capped at ~this many chars. */
export const TOOL_HISTORY_CHAR_BUDGET = 8000;

/**
 * Digest-in-history: reconstructs the `[assistant{toolCalls}, tool{content}]`
 * message pairs the server itself appended to its own `messages` accumulator during a past turn
 * (server/routes/chat.ts's orchestration loop, right after each tool call resolves), so a later
 * turn's history round-trips exactly what the model saw for its own prior tool calls — required
 * for any provider that validates tool_call/tool_result pairing (OpenAI, Anthropic).
 *
 * toolCalls-args-form decision: `exchange.toolCall` (see the `ToolExchange` doc comment above) is
 * REAL-form. Sending real-form args back up here is safe ONLY because server/routes/chat.ts's
 * `scrubMessagesForProvider` re-scrubs EVERY outbound message before it ever reaches the provider
 * on a later turn — including `toolCalls[].arguments` (via
 * `pseudonymizer.applyToObject(call.arguments)`) — using whatever pseudonym map that request's
 * `privacy.map` reseeds the server's per-request `Pseudonymizer` with.
 * As long as the client keeps sending its full held `pseudonymMap` on every request (see
 * `privacyPayload` in chat-page.tsx's `handleSend`), that reseeded map contains the exact same
 * value/pseudonym pairs the server minted when this tool call first ran, so the re-scrub reproduces
 * the identical pseudonym-form arguments the model originally saw — the client never has to
 * reconstruct or store the pseudonym-form arguments itself. `content` is the `digest` event's
 * content verbatim (already pseudonym-form when privacy was on for that turn), so the tool-result
 * half needs no transform at all. This reliance is the crux of the whole scheme: it only holds if
 * the client-held `pseudonymMap` is never silently dropped or truncated (it isn't — the map is
 * never budget-capped, only the digest content is; see the budget notes below).
 *
 * History budget: `TOOL_HISTORY_MAX_TURNS` newest assistant turns are eligible at all; older turns
 * never carry their tool exchanges (prose only). Among the eligible turns, the total resent digest
 * content is capped at `TOOL_HISTORY_CHAR_BUDGET` chars: walking turns newest-first, the first turn
 * that would push the running total over budget stops the walk entirely, so the included turns are
 * always a newest-contiguous window (never a newer turn dropped while an older one still gets in) —
 * turn granularity (not per call), simpler than a stable per-call recency order.
 *
 * Order within a turn mirrors the server's own append order (chat.ts's orchestration loop): for each kept tool
 * exchange, `[assistant{toolCalls}, tool{digest}]`, placed immediately before that turn's own prose
 * `assistant` message in the returned array.
 *
 * These reconstructed messages exist ONLY in the array this function returns (the POST body) —
 * `uiMessages` (and the `messages` React state it is derived from) is never mutated to include
 * them, so message_bubble.tsx/message_list.tsx need no changes to keep them off-screen.
 *
 * Wire-proof fix (AI/qa/wire-proof-v35/capture.jsonl): `currentPrivacyEnabled` is THIS turn's own
 * privacy state — the same value `chat-page.tsx`'s `startTurn` already resolves before calling this
 * function. Once every message above is assembled (unchanged from before this fix), the whole array
 * is run through `excludePrivacyOffHistory` below, which fails closed on any privacy-OFF-captured
 * digest/prose once privacy is ON for the turn being sent NOW — see that function's own doc comment
 * for the exact mechanism and why history captured under privacy OFF can never simply be shape-
 * scanned safe (a bare, non-dotted real value like an agent name has no shape a regex can single
 * out). This is the CLIENT side of a two-layer defense: `server/routes/chat.ts` runs the identical
 * function again on whatever this sends, since the server must never depend on the client having
 * done this correctly.
 */
export function buildOutgoingMessages(
  uiMessages: ChatHistoryMessage[],
  turnRecords: AssistantTurnRecord[],
  currentPrivacyEnabled: boolean,
): ChatMessage[] {
  const eligibleTurns = turnRecords.slice(-TOOL_HISTORY_MAX_TURNS);

  const turnsToInclude = new Set<string>();
  let runningChars = 0;
  // Newest-eligible-turn-first: the first turn that would exceed the budget stops the walk (not
  // just that one turn) — every OLDER turn is necessarily dropped too, keeping the included set a
  // newest-contiguous window rather than a scattered pick of whichever turns happened to fit.
  for (const turn of [...eligibleTurns].reverse()) {
    const turnChars = turn.toolExchanges.reduce(
      (sum, exchange) => sum + (exchange.digestContent?.length ?? 0),
      0,
    );
    if (turnChars === 0) {
      continue;
    }
    if (runningChars + turnChars > TOOL_HISTORY_CHAR_BUDGET) {
      break;
    }
    runningChars += turnChars;
    turnsToInclude.add(turn.assistantMessageId);
  }

  const outgoing: ChatMessage[] = [];
  for (const uiMessage of uiMessages) {
    if (uiMessage.role === 'assistant' && turnsToInclude.has(uiMessage.id)) {
      const turn = turnRecords.find(
        candidate => candidate.assistantMessageId === uiMessage.id,
      );
      for (const exchange of turn?.toolExchanges ?? []) {
        if (!exchange.digestContent) {
          continue;
        }
        outgoing.push({
          role: 'assistant',
          content: '',
          toolCalls: [exchange.toolCall],
        });
        outgoing.push({
          role: 'tool',
          toolCallId: exchange.toolCall.id,
          content: exchange.digestContent,
          // Wire-proof fix: carried through so excludePrivacyOffHistory (below) can fail closed
          // on this pair once privacy is on for the CURRENT turn.
          ...(exchange.privacyEnabled !== undefined
            ? { privacyEnabled: exchange.privacyEnabled }
            : {}),
        });
      }
    }
    outgoing.push({
      role: uiMessage.role,
      content: uiMessage.content,
      // Wire-proof fix: only ever set on role:'assistant' (ChatHistoryMessage.privacyEnabled's own
      // doc comment) — carried through for the same reason as the tool-message flag above.
      ...(uiMessage.privacyEnabled !== undefined
        ? { privacyEnabled: uiMessage.privacyEnabled }
        : {}),
    });
  }
  return excludePrivacyOffHistory(outgoing, currentPrivacyEnabled);
}

/**
 * True when a history entry's own `privacyEnabled` flag is trustworthy enough to resend once the
 * CURRENT turn's privacy is `currentPrivacyEnabled`. Fails CLOSED: if privacy is currently off,
 * everything is eligible (no behavior change from before this fix); if privacy is currently on,
 * only an entry EXPLICITLY flagged `privacyEnabled === true` is eligible — `false` (captured with
 * privacy off) and `undefined` (unknown: a conversation persisted before this field existed, or an
 * entry this code never bothered to stamp) are both excluded, deliberately treated identically.
 */
function isHistoryEntryEligible(
  entryPrivacyEnabled: boolean | undefined,
  currentPrivacyEnabled: boolean,
): boolean {
  return !currentPrivacyEnabled || entryPrivacyEnabled === true;
}

/**
 * Wire-proof fix (AI/qa/wire-proof-v35/capture.jsonl, live capture on build 7d822b465): with
 * privacy OFF, a user's conversation accumulates REAL-valued tool digests and assistant prose —
 * completely correctly, that is what privacy off means. The proven leak was in what happens the
 * FIRST time privacy is then turned ON mid-conversation (the shipped default is off, so this is the
 * ordinary first-use flow, not an edge case): that entire real-valued history was still being
 * resent as "history" on the very next turn, and the outbound shape scan (`prescanAndMint`/
 * `prescanAndMintToolContent` in privacy.ts) only recognizes IPv4/IPv6 addresses and DOTTED
 * hostnames — a bare, non-dotted value like a Wazuh agent name (`wazuh-aio-5` in the captured
 * proof) has no shape a regex can single out, and the FIELD POLICY that would normally anonymize
 * `wazuh.agent.name` only ever runs when a digest is CREATED (`applyFieldPolicy` in privacy.ts),
 * never when a client-supplied one is REPLAYED. Two prior fixes in this same file (F1-F4, then the
 * replay-leak fixes) closed every OTHER client-replay gap this same boundary has, but a bare
 * identifier surviving a privacy-off-to-on toggle was missed by all of them, because none of them
 * questioned whether privacy-off history should be resent AT ALL once privacy is on.
 *
 * OWNER'S CHOSEN FIX, implemented here: do not replay real-valued history once privacy is ON. Fail
 * closed — this is a DENYLIST-of-safety, not an allowlist-of-danger, so anything not proven safe
 * (an explicit `privacyEnabled === true`) is excluded. Operates on the FINAL, wire-shaped
 * `ChatMessage[]` (not `ChatHistoryMessage[]`/`AssistantTurnRecord[]`) specifically so the identical
 * function can run on BOTH sides of the client/server boundary: `buildOutgoingMessages` (above)
 * calls it as a client-side courtesy (saves the round-trip entirely for excluded turns), and
 * `server/routes/chat.ts` calls it again on whatever the client actually sent, which is the real
 * enforcement — the server must never depend on the client having done this correctly, the same
 * trust assumption that caused the original bug in the first place.
 *
 * Removes two shapes, matched by walking `messages` in order:
 * 1. A `[assistant{content:'', toolCalls:[one call]}, tool{toolCallId: that call's id}]` pair (the
 *    exact shape both `buildOutgoingMessages` above and `toPersistedMessages` produce for one tool
 *    exchange) is dropped WHOLE when the `tool` message's `privacyEnabled` is not eligible — half a
 *    pair (an assistant message with tool_calls but no matching result, or vice versa) would break
 *    tool_call/tool_result pairing validation on every provider that enforces it (OpenAI,
 *    Anthropic), so this only ever drops complete pairs, never one side of one.
 * 2. A standalone `role:'assistant'` message with no `toolCalls` (real prose, not a history marker)
 *    is dropped when its own `privacyEnabled` is not eligible — the "assess separately" residual
 *    from the same investigation: a bare hostname in the model's OWN past narration has the exact
 *    same shape-scan blind spot as a digest field does, and dropping it is cheap (unlike dropping
 *    ALL prose, which would wreck conversation continuity) because the corresponding tool digest
 *    for that same privacy-off turn is already being dropped by rule 1 above — there is very little
 *    LEFT to lose by also dropping that turn's own answer text.
 *
 * `role:'user'` messages are NEVER dropped by this function, on purpose: the user's own question
 * text has the same theoretical blind spot, but removing a user's own words from history is a much
 * larger continuity cost for a residual that is separately documented (see
 * `scrubMessagesForProvider`'s doc comment in chat.ts) rather than newly introduced here — the
 * wire-proof this function closes is specifically about REPLAYED history, not fresh input.
 * `role:'system'` is never part of this array in the first place (chat.ts filters it out before
 * this function ever runs, and `buildOutgoingMessages` above never emits one).
 */
export function excludePrivacyOffHistory(
  messages: ChatMessage[],
  currentPrivacyEnabled: boolean,
): ChatMessage[] {
  if (!currentPrivacyEnabled) {
    return messages;
  }
  const result: ChatMessage[] = [];
  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    if (
      message.role === 'assistant' &&
      message.content === '' &&
      message.toolCalls?.length === 1
    ) {
      const next = messages[index + 1];
      const toolCallId = message.toolCalls[0].id;
      if (next && next.role === 'tool' && next.toolCallId === toolCallId) {
        if (isHistoryEntryEligible(next.privacyEnabled, currentPrivacyEnabled)) {
          result.push(message, next);
        }
        index += 1; // Consumes the paired `tool` message too, whether kept or dropped.
        continue;
      }
    }
    if (
      message.role === 'assistant' &&
      !(message.toolCalls && message.toolCalls.length > 0) &&
      !isHistoryEntryEligible(message.privacyEnabled, currentPrivacyEnabled)
    ) {
      continue;
    }
    result.push(message);
  }
  return result;
}
