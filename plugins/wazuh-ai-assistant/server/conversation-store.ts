import { RequestHandlerContext } from '../../../src/core/server';
import { CONVERSATION_SESSIONS_INDEX_ALIAS } from '../common/constants';
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
 * LLM going forward) is completely unaffected by persistence; only the already-real digest/table
 * history from before a resume could, in principle, be re-sent un-pseudonymized on the next turn,
 * which is the same behavior privacy-off history always had.
 */
export interface ConversationDocument {
  user: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: PersistedChatMessage[];
  /**
   * Required by the data stream itself: `wazuh-ai-assistant-sessions` maps `@timestamp` as its
   * `data_stream.timestamp_field` (the OpenSearch/Elasticsearch data-stream convention), and a
   * write without it fails indexer-side with a mapping error, not an application-level one. Always
   * set equal to `created_at` (server/routes/conversations.ts stamps both from the same value on
   * create, and re-sends the original `created_at` on update) — this field exists for the data
   * stream's own bookkeeping, not to track "last touched", which `updated_at` already covers.
   */
  '@timestamp': string;
}

/**
 * One conversation document plus the OpenSearch bookkeeping needed to update or delete it again:
 * `index` is the CONCRETE backing index holding the doc (never the alias itself — see
 * `findConversationHit`'s doc comment), `seqNo`/`primaryTerm` are the optimistic-concurrency pair
 * the update API keys its `if_seq_no`/`if_primary_term` checks on.
 */
export interface ConversationHit {
  id: string;
  index: string;
  seqNo: number;
  primaryTerm: number;
  source: ConversationDocument;
}

function client(context: RequestHandlerContext): OpenSearchClient {
  return context.core.opensearch.client.asCurrentUser;
}

interface SearchHit {
  _index: string;
  _id: string;
  _source: ConversationDocument;
  _seq_no?: number;
  _primary_term?: number;
}

function toHit(hit: SearchHit): ConversationHit {
  return {
    id: hit._id,
    index: hit._index,
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
 * currently points to and reports which one actually holds it (`_index` on the hit), which the
 * update/delete calls below need. `seq_no_primary_term: true` is requested so the hit can also
 * drive optimistic-concurrency updates without a second round trip.
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

/**
 * Creates a new conversation document. `op_type: 'create'` is mandatory when writing to a data
 * stream's alias — backing indices only accept appends, never a plain overwrite-by-id `index`
 * request — and, combined with no explicit `id`, is what makes OpenSearch mint a fresh id for it.
 *
 * `refresh: 'wait_for'` on every write function in this file (this one, `updateConversation`,
 * `deleteConversation`): every read here — `listConversations`, `countConversations`,
 * `findConversationHit` — goes through `search`, not a direct get-by-id (this alias is a data
 * stream; see `findConversationHit`'s doc comment for why a plain get can't be used at all). A
 * search only sees a write once the shard has refreshed, which by default happens on its own
 * timer (`index.refresh_interval`, 1s unless configured otherwise) — NOT synchronously with the
 * write. Without `wait_for`, a delete followed immediately by a list (or a create followed by the
 * second-save update the same conversation gets moments later, itself a `search`-based lookup via
 * `findConversationHit`) can race: the write already succeeded, but the very next search still
 * reflects the pre-write state. `wait_for` blocks the response until the next scheduled refresh
 * has incorporated this write, so by the time this function returns, every subsequent search is
 * guaranteed to reflect it — no client-visible race, and (unlike `refresh: true`) no forced
 * out-of-cycle refresh on every write either.
 */
export async function createConversation(
  context: RequestHandlerContext,
  document: ConversationDocument,
): Promise<string> {
  const response = await client(context).index({
    index: CONVERSATION_SESSIONS_INDEX_ALIAS,
    op_type: 'create',
    refresh: 'wait_for',
    body: document,
  });
  const body = response.body as { _id: string };
  return body._id;
}

/**
 * Full overwrite of an already-resolved hit's document. Always targets `hit.index` — the
 * CONCRETE backing index — never the alias: see `findConversationHit`'s doc comment. A document
 * never moves to a different backing index once written, so a `hit` resolved moments earlier in
 * the same request is still valid to update against.
 *
 * Deliberately a full `index` (replace), NOT the partial `_update` API: this alias has OpenSearch
 * Document Level Security configured for per-user isolation (see `ConversationDocument`'s doc
 * comment), and the Security plugin unconditionally rejects `_update` for any role DLS/FLS/
 * field-masking applies to — `security_exception: Update is not supported when FLS or DLS or
 * Fieldmasking is activated` — regardless of what the update itself would touch. A plain `index`
 * overwrite has no such restriction, so the caller must always pass the document's FULL shape
 * (typically `{...previouslyFetchedSource, ...changedFields}`), not a partial patch — there is no
 * server-side merge to fall back on for whatever the caller omits.
 *
 * `occ` is REQUIRED, not optional: a data stream separately rejects a plain (unconditional)
 * `index` request sent directly against one of its backing indices —
 * `illegal_argument_exception: index request with op_type=index and no if_primary_term and
 * if_seq_no set targeting backing indices is disallowed` — so there is no "unconditional
 * overwrite" available here at all, unlike a plain index. When the caller has no
 * client-supplied version to check against, it must still pass the seq_no/primary_term it just
 * read (e.g. from the same request's own `findConversationHit` call) purely to satisfy this
 * requirement — see conversations.ts's PUT route for how the two cases (client-supplied
 * `expectedVersion` vs. this request's own fresh read) are told apart for the 409 message.
 *
 * Rejects with the OpenSearch client's `ResponseError`, whose `.statusCode` getter reads the
 * response body's numeric `status` — 409 on a real conflict — the exact shape
 * `isVersionConflictError` (conversations.ts) already recognizes, so that helper needs no change.
 *
 * `refresh: 'wait_for'` — see `createConversation`'s doc comment for why every write here needs it.
 */
export async function updateConversation(
  context: RequestHandlerContext,
  hit: Pick<ConversationHit, 'id' | 'index'>,
  document: ConversationDocument,
  occ: { ifSeqNo: number; ifPrimaryTerm: number },
): Promise<{ seqNo: number; primaryTerm: number }> {
  const response = await client(context).index({
    index: hit.index,
    id: hit.id,
    if_seq_no: occ.ifSeqNo,
    if_primary_term: occ.ifPrimaryTerm,
    refresh: 'wait_for',
    body: document,
  });
  const body = response.body as { _seq_no: number; _primary_term: number };
  return { seqNo: body._seq_no, primaryTerm: body._primary_term };
}

/** Targets `hit.index` for the same reason `updateConversation` does. `refresh: 'wait_for'` — see
 * `createConversation`'s doc comment for why every write here needs it (without it, a delete
 * followed immediately by the list route's `listConversations` search could still show the
 * just-deleted conversation). */
export async function deleteConversation(
  context: RequestHandlerContext,
  hit: Pick<ConversationHit, 'id' | 'index'>,
): Promise<void> {
  await client(context).delete({
    index: hit.index,
    id: hit.id,
    refresh: 'wait_for',
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
