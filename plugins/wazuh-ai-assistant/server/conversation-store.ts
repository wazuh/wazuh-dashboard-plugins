import { RequestHandlerContext } from '../../../src/core/server';
import {
  CONVERSATION_SESSIONS_INDEX_ALIAS,
  WAZUH_INDEXER_AI_ASSISTANT_SESSIONS_PATH,
} from '../common/constants';
import { PersistedChatMessage } from '../common/types';

/** The real, request-scoped OpenSearch client type — resolved via indexed access from
 * `RequestHandlerContext` rather than imported from `@opensearch-project/opensearch` directly, so
 * this always matches whatever this OSD version's core actually exposes as
 * `context.core.opensearch.client.asCurrentUser`. */
type OpenSearchClient =
  RequestHandlerContext['core']['opensearch']['client']['asCurrentUser'];

/**
 * Document shape as stored in the `wazuh-ai-assistant-sessions` index alias — a data stream
 * managed by an ISM policy on the indexer side (wazuh-indexer-plugins#1422), rotated daily and
 * pruned after 7 days. Field names are snake_case to match that schema exactly.
 * server/routes/conversations.ts maps to/from this shape at the boundary, so the plugin's own
 * camelCase `ConversationRecord`/`ConversationSummary` HTTP contract never has to change.
 *
 * Per-user isolation is enforced twice: OpenSearch Document Level Security on this alias filters
 * every request by `${user.name}` server-side (see the indexer issue's DLS role), and every query
 * built below ALSO filters on this same `user` field explicitly — the app must not depend solely
 * on DLS being correctly configured in every deployment.
 *
 * PRIVACY INTERACTION (important — read before changing this shape): `messages` here are the
 * DISPLAYED chat messages, i.e. already real-valued (de-pseudonymized answers + the model's prose,
 * exactly what message_bubble.tsx rendered). That is inherent to "saving a conversation" and is
 * exactly why owner-scoping (server/routes/conversations.ts's `resolveOwner`) matters — a stored
 * conversation is sensitive at rest the same way any other real-valued Wazuh data is. The per-turn
 * pseudonym MAP (common/types.ts's `PseudonymEntry[]`) is deliberately NOT part of this document
 * and is never persisted anywhere server-side: it is wire-only, per-request state (server/routes/
 * chat.ts constructs a fresh `Pseudonymizer` per request, seeded from whatever the client sends).
 * Resuming a saved conversation therefore starts with an EMPTY client-side pseudonym map — same as
 * starting a brand new conversation — so privacy mode's on-the-wire protection (what reaches the
 * LLM going forward) is completely unaffected by persistence; the already-real digest/table history
 * from before a resume is NOT, in fact, re-sent un-pseudonymized on the next turn — two separate
 * mechanisms guarantee this, at two separate layers, and both matter: (1) resuming a conversation
 * clears `turnHistoryRef` client-side (chat-page.tsx's `applyLoadedConversation`) rather than
 * restoring it from the persisted document, so a resumed conversation has no tool-call history to
 * replay AT ALL (it is still fully READABLE — this only affects what gets resent to the model);
 * (2) independently of resume, `common/chat-history.ts`'s `excludePrivacyOffHistory` (enforced
 * server-side, in server/routes/chat.ts) fails closed on any history entry not explicitly flagged
 * `privacyEnabled: true`, which also covers the same-session "privacy toggled on mid-conversation"
 * case.
 */
export interface ConversationDocument {
  user: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: PersistedChatMessage[];
  /**
   * The data stream's `data_stream.timestamp_field` (the OpenSearch/Elasticsearch data-stream
   * convention), always equal to `created_at`. The indexer's sessions endpoint stamps it, along
   * with `user`, `created_at` and `updated_at`; this plugin only ever READS it back.
   */
  '@timestamp': string;
}

/**
 * One conversation document plus the OpenSearch bookkeeping needed to version it:
 * `seqNo`/`primaryTerm` are the pair `encodeVersion` turns into the opaque `version` token the
 * sessions endpoint's `expected_version` check keys on.
 */
export interface ConversationHit {
  id: string;
  seqNo: number;
  primaryTerm: number;
  source: ConversationDocument;
}

function client(context: RequestHandlerContext): OpenSearchClient {
  return context.core.opensearch.client.asCurrentUser;
}

interface SearchHit {
  _id: string;
  _source: ConversationDocument;
  _seq_no?: number;
  _primary_term?: number;
}

function toHit(hit: SearchHit): ConversationHit {
  return {
    id: hit._id,
    seqNo: hit._seq_no ?? 0,
    primaryTerm: hit._primary_term ?? 0,
    source: hit._source,
  };
}

function totalOf(total: { value: number } | number | undefined): number {
  if (total === undefined) {
    return 0;
  }
  return typeof total === 'number' ? total : total.value;
}

/**
 * Lists one user's conversations, most-recently-updated first. Filtering (the `user` term query)
 * and sorting both run server-side in this one call for the same reason the saved-objects
 * predecessor's single `find()` call did: splitting either step out to run in JS afterwards would
 * make `total`/pagination meaningless, since page N would then mix in every other user's rows.
 * `track_total_hits: true` because route-helpers.ts's pagination contract needs an exact count,
 * not an approximation.
 */
export async function listConversations(
  context: RequestHandlerContext,
  user: string,
  page: number,
  perPage: number,
): Promise<{ hits: ConversationHit[]; total: number }> {
  const response = await client(context).search({
    index: CONVERSATION_SESSIONS_INDEX_ALIAS,
    body: {
      query: { term: { user } },
      sort: [{ updated_at: { order: 'desc' } }],
      from: (page - 1) * perPage,
      size: perPage,
      track_total_hits: true,
    },
  });
  const body = response.body as {
    hits: { total: { value: number } | number; hits: SearchHit[] };
  };
  return {
    hits: body.hits.hits.map(toHit),
    total: totalOf(body.hits.total),
  };
}

/** Same scoping as `listConversations`, but only the count — used by the per-owner conversation
 * cap on CREATE (see conversations.ts's `MAX_CONVERSATIONS_PER_OWNER`). `size: 0` skips fetching
 * any actual hits; only `track_total_hits` is needed. */
export async function countConversations(
  context: RequestHandlerContext,
  user: string,
): Promise<number> {
  const response = await client(context).search({
    index: CONVERSATION_SESSIONS_INDEX_ALIAS,
    body: {
      query: { term: { user } },
      size: 0,
      track_total_hits: true,
    },
  });
  const body = response.body as {
    hits: { total: { value: number } | number };
  };
  return totalOf(body.hits.total);
}

/**
 * Resolves one conversation by id, owned by `user`, or `undefined` if it does not exist or belongs
 * to someone else (conversations.ts turns both into an identical 404 — see that file's own doc
 * comment on why existence is never leaked cross-owner).
 *
 * A plain `GET <alias>/_doc/<id>` cannot be used here: `wazuh-ai-assistant-sessions` is a data
 * stream whose backing index rolls over daily (wazuh-indexer-plugins#1422), and the get-by-id API
 * can only target one concrete index — it has no way to know which backing index holds a given id
 * without being told. A `search` filtered on `_id` fans out across every backing index the alias
 * currently points to. `seq_no_primary_term: true` is requested so the hit also carries the
 * version the write endpoints check against, without a second round trip.
 */
export async function findConversationHit(
  context: RequestHandlerContext,
  user: string,
  id: string,
): Promise<ConversationHit | undefined> {
  const response = await client(context).search({
    index: CONVERSATION_SESSIONS_INDEX_ALIAS,
    body: {
      query: {
        bool: { filter: [{ ids: { values: [id] } }, { term: { user } }] },
      },
      seq_no_primary_term: true,
      size: 1,
    },
  });
  const body = response.body as { hits: { hits: SearchHit[] } };
  const [hit] = body.hits.hits;
  return hit ? toHit(hit) : undefined;
}

// Every write below goes through the indexer's sessions endpoint
// (`WAZUH_INDEXER_AI_ASSISTANT_SESSIONS_PATH`) as the current user, never straight against the
// index: the caller's role holds no index-level `write` on the sessions alias, only the cluster
// permission that authorizes this endpoint. The indexer stamps `user` from the authenticated
// principal and owns `created_at`, `updated_at` and `@timestamp`, so none of those are sent, and
// the functions return what it replied rather than anything derived from this server's clock. A
// write is visible to the very next `search` when the endpoint answers, so no read here races it.
//
// Failures reject with the OpenSearch client's `ResponseError` (`.statusCode` set): 403 when the
// role lacks the write permission, 404 for a session that is missing or not the caller's, 409 for
// a version conflict on `updateConversation` or the per-user session cap on `createConversation`.

function sessionPath(id?: string): string {
  return id === undefined
    ? WAZUH_INDEXER_AI_ASSISTANT_SESSIONS_PATH
    : `${WAZUH_INDEXER_AI_ASSISTANT_SESSIONS_PATH}/${encodeURIComponent(id)}`;
}

/** What the sessions endpoint replies with once it has stored a session. `version` is already in
 * the `encodeVersion` format. */
export interface StoredSession {
  title: string;
  created_at: string;
  updated_at: string;
  messages: PersistedChatMessage[];
  version: string;
}

/** Creates a new conversation; the indexer mints its id. */
export async function createConversation(
  context: RequestHandlerContext,
  document: Pick<ConversationDocument, 'title' | 'messages'>,
): Promise<StoredSession & { id: string }> {
  const response = await client(context).transport.request({
    method: 'POST',
    path: sessionPath(),
    body: { title: document.title, messages: document.messages },
  });
  return response.body as StoredSession & { id: string };
}

/**
 * Full replace of an existing conversation's `messages`, checked against `expectedVersion` (the
 * `encodeVersion` token): a write since that version rejects with a 409 instead of applying. An
 * absent `title` keeps the stored one, so an auto-save never reverts a rename.
 */
export async function updateConversation(
  context: RequestHandlerContext,
  id: string,
  document: Pick<ConversationDocument, 'messages'> & { title?: string },
  expectedVersion: string,
): Promise<StoredSession> {
  const response = await client(context).transport.request({
    method: 'PUT',
    path: sessionPath(id),
    body: {
      messages: document.messages,
      title: document.title,
      expected_version: expectedVersion,
    },
  });
  return response.body as StoredSession;
}

/** Title-only update. The indexer trims the title and leaves `updated_at` alone, since a rename
 * is not conversation activity. */
export async function renameConversation(
  context: RequestHandlerContext,
  id: string,
  title: string,
): Promise<Pick<StoredSession, 'title' | 'updated_at' | 'version'>> {
  const response = await client(context).transport.request({
    method: 'PATCH',
    path: sessionPath(id),
    body: { title },
  });
  return response.body as Pick<
    StoredSession,
    'title' | 'updated_at' | 'version'
  >;
}

export async function deleteConversation(
  context: RequestHandlerContext,
  id: string,
): Promise<void> {
  await client(context).transport.request({
    method: 'DELETE',
    path: sessionPath(id),
  });
}

/**
 * Opaque optimistic-concurrency token round-tripped through `ConversationRecord.version` (see that
 * type's doc comment in common/types.ts) — encodes the seq_no/primary_term pair the update API
 * actually keys its checks on, since OpenSearch has no single "row version" the way saved objects
 * did. Never parsed or compared client-side; `decodeVersion` below is this file's own inverse, used
 * only when a PUT request supplies `expectedVersion` back.
 */
export function encodeVersion(seqNo: number, primaryTerm: number): string {
  return `${seqNo}:${primaryTerm}`;
}

/** Inverse of `encodeVersion`. Returns `undefined` for anything that isn't exactly that shape
 * (e.g. a stale token from a build that emitted saved-objects opaque version strings) — the PUT
 * route treats that the same as no `expectedVersion` at all, matching `encodeVersion`'s own
 * "opaque, never validated beyond round-tripping" contract. */
export function decodeVersion(
  token: string,
): { seqNo: number; primaryTerm: number } | undefined {
  const match = /^(\d+):(\d+)$/.exec(token);
  if (!match) {
    return undefined;
  }
  return { seqNo: Number(match[1]), primaryTerm: Number(match[2]) };
}
