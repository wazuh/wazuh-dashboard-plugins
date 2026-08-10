import { schema } from '@osd/config-schema';
import {
  IRouter,
  Logger,
  OpenSearchDashboardsRequest,
  OpenSearchDashboardsResponseFactory,
  IOpenSearchDashboardsResponse,
  RequestHandlerContext,
} from '../../../../src/core/server';
import {
  API_PATHS,
  CONVERSATION_MAX_MESSAGES,
  CONVERSATION_MAX_MESSAGE_CONTENT_LENGTH,
  CONVERSATION_MAX_TABLE_ROWS,
  CONVERSATION_MAX_TITLE_LENGTH,
  CONVERSATION_OWNER_FALLBACK,
} from '../../common/constants';
import {
  ConversationRecord,
  ConversationSummary,
  PersistedChatMessage,
} from '../../common/types';
import {
  ConversationDocument,
  ConversationHit,
  countConversations,
  createConversation,
  decodeVersion,
  deleteConversation,
  encodeVersion,
  findConversationHit,
  listConversations,
  updateConversation,
} from '../conversation-store';
import { resolveWazuhUsername } from '../identity';
import {
  paginationQuerySchema,
  resolvePagination,
  withInternalErrorHandling,
} from './route-helpers';

/**
 * Owner resolution. "One conversation per user" is enforced at two layers: OpenSearch Document
 * Level Security on the `wazuh-ai-assistant-sessions` index alias restricts each document to the
 * `user` it was written with (wazuh-indexer-plugins#1422), and every query/write below ALSO scopes
 * itself by that same value explicitly — this app must stay correct even where DLS isn't
 * configured, so it never relies on DLS alone.
 *
 * The shared `context.wazuh.security.getCurrentUser` lookup (untyped cast, string-vs-object
 * narrowing, defensive try/catch) lives in `server/identity.ts`'s `resolveWazuhUsername` — see that
 * file's doc comment for the platform facts and for why it deliberately returns `undefined`, with
 * no fallback of its own, on every "can't resolve an identity" path.
 *
 * `resolveOwner` (below) therefore returns `undefined` on that path: an explicit "could not
 * resolve a real user" signal, left for each CALLER to act on. It must never fall back to
 * `CONVERSATION_OWNER_FALLBACK` (common/constants.ts, the `'_shared'` sentinel) the way the chat
 * route does — bucketing every unresolved-identity caller into one shared owner would let them
 * read, overwrite and delete each other's saved conversations. The four
 * owner-CHECKING routes below (list/get/put/delete) fail closed (403, `ownerUnresolvedResponse`)
 * on `undefined` rather than ever comparing against a shared bucket value. `create` has nothing
 * to check yet (only to stamp) and is deliberately NOT in that fail-closed set — see its call site
 * for why falling back to `CONVERSATION_OWNER_FALLBACK` there is still safe.
 *
 * Fallback-difference pointer (the part that must never drift): unlike `server/routes/chat.ts`'s
 * `resolveChatStreamUser` — which falls back to `CONVERSATION_OWNER_FALLBACK` because that value
 * is only ever a rate-limit bucket key there — `resolveOwner` here fails CLOSED to `undefined`
 * because the resolved value gates actual read/write/delete access to another user's data.
 *
 * Exported for unit testing only; not part of this file's public contract.
 *
 * A resolved username that is EXACTLY `CONVERSATION_OWNER_FALLBACK` ('_shared') is treated as
 * UNRESOLVED, not as a real identity. Without this, the only path to a document stamped
 * with the shared fallback sentinel (create's own unresolved-identity fallback, see that route's
 * comment) is a real dashboard account literally named `_shared` -- logging in as that literal
 * username would resolve here and pass every owner check below, reading/overwriting/deleting every
 * unresolved-identity caller's shared-bucket documents. Closing that off costs nothing for any
 * legitimate username (no real deployment names an account `_shared`), and keeps a caller who
 * really is named that failing closed (403) rather than silently inheriting the shared bucket. */
export async function resolveOwner(
  context: RequestHandlerContext,
  request: OpenSearchDashboardsRequest,
): Promise<string | undefined> {
  const username = await resolveWazuhUsername(context, request);
  if (username !== undefined && username !== CONVERSATION_OWNER_FALLBACK) {
    return username;
  }
  return undefined;
}

/** Exact 403 body every owner-CHECKING route below returns when `resolveOwner` signals
 * it could not determine a real user, factored out so the four call sites (list/get/put/delete)
 * can't drift out of sync — mirrors this file's existing convention of factoring out an exact
 * repeated shape (e.g. `toSummary`/`toRecord` below). */
function ownerUnresolvedResponse(
  response: OpenSearchDashboardsResponseFactory,
): IOpenSearchDashboardsResponse {
  return response.forbidden({
    body: {
      message:
        'Could not determine your user identity; conversation history is unavailable.',
    },
  });
}

/** Per-owner conversation COUNT cap, enforced on CREATE only (see that route's call site
 * for why PUT must never be blocked by it). */
const MAX_CONVERSATIONS_PER_OWNER = 500;

/** Exact 409 body the CREATE route returns when the caller is already at
 * `MAX_CONVERSATIONS_PER_OWNER`. 409 (not 400): the request itself is well-formed, it's the
 * caller's current STATE (already owning the maximum) that conflicts with creating one more —
 * the same conflict-with-current-state semantics this file's version-conflict 409 (below) uses,
 * kept distinct from that one only by message/call site. */
function conversationLimitReachedResponse(
  response: OpenSearchDashboardsResponseFactory,
): IOpenSearchDashboardsResponse {
  return response.customError({
    statusCode: 409,
    body: {
      message:
        `You have reached the maximum of ${MAX_CONVERSATIONS_PER_OWNER} saved conversations. ` +
        'Delete one or more old conversations before creating a new one.',
    },
  });
}

function toSummary(
  id: string,
  document: ConversationDocument,
): ConversationSummary {
  return { id, title: document.title, updatedAt: document.updated_at };
}

/** `version` is optional here (not read off `document`) because it comes from the OpenSearch
 * write/read response's own seq_no/primary_term pair (`conversation-store.ts`'s `encodeVersion`),
 * not from anything stored in `_source` — every call site below passes whatever its own hit/write
 * response actually carried. See `ConversationRecord`'s doc comment (common/types.ts) for what the
 * client does with it. */
function toRecord(
  id: string,
  document: ConversationDocument,
  version?: string,
): ConversationRecord {
  return {
    id,
    title: document.title,
    createdAt: document.created_at,
    updatedAt: document.updated_at,
    messages: document.messages,
    version,
  };
}

/**
 * Version-conflict detection for the optimistic-concurrency PUT below: when the request carries
 * `expectedVersion` and it no longer matches what is stored, `updateConversation`'s `occ` option
 * makes OpenSearch reject the write with a `ResponseError` instead of applying it. That error's
 * `.statusCode` getter reads the response body's numeric `status` (see
 * `@opensearch-project/opensearch`'s `lib/errors.js`), which is 409 for a real
 * `version_conflict_engine_exception`. Duck-typed rather than importing that error class, purely
 * so this same helper keeps working unchanged against a plain object shaped like one (as the tests
 * for this function already do) without adding a hard dependency on the OpenSearch client package
 * from this file.
 */
export function isVersionConflictError(error: unknown): boolean {
  const candidate = error as
    | { output?: { statusCode?: number }; statusCode?: number }
    | null
    | undefined;
  return candidate?.output?.statusCode === 409 || candidate?.statusCode === 409;
}

/**
 * Unbounded conversation storage: an
 * authenticated user could previously create unlimited conversation documents with unbounded
 * title/message sizes. These constants bound that WITHOUT breaking real usage — each is generous
 * relative to legitimate traffic, just no longer infinite. Every limit lives here, named, so the
 * schemas below and `MAX_CONVERSATIONS_PER_OWNER` can't drift out of sync.
 */
/** These three are re-exported from `common/constants.ts` rather than defined here because the
 * CLIENT must trim to the exact same numbers before it builds a payload; keeping them server-only
 * would let the two drift. That drift is silent and unrecoverable: this route answers an oversized
 * array with a 400 while auto-save resends the same ever-growing array on every turn, so a
 * conversation that crosses a limit simply stops being saved, with no visible error. See
 * `common/chat-history.ts`'s `toPersistedMessages`.
 *
 * public/ truncates the client-typed title to ~60 chars before sending, so 200 is generous headroom;
 * a single real answer/question is far below 100k; and a long working session is nowhere near 1000
 * messages — each bound exists to stop an UNBOUNDED document, not to constrain real use. */
const MAX_TITLE_LENGTH = CONVERSATION_MAX_TITLE_LENGTH;
const MAX_MESSAGE_CONTENT_LENGTH = CONVERSATION_MAX_MESSAGE_CONTENT_LENGTH;
const MAX_MESSAGES_PER_CONVERSATION = CONVERSATION_MAX_MESSAGES;

/** Longest column id/label and index name a persisted table may carry. Generous for real field
 * names and index patterns; the point is only that they are bounded. */
const MAX_TABLE_LABEL_LENGTH = 256;
/** A displayed table has a handful of columns, never dozens. */
const MAX_TABLE_COLUMNS = 50;

/**
 * The result table a message was displayed with (`common/types.ts`'s `TableSpec`), persisted so a
 * resumed conversation still shows it. Row VALUES are `any` — they are whatever fields the query
 * projected — but the row and column COUNTS are bounded here, and the client row-caps to the same
 * `CONVERSATION_MAX_TABLE_ROWS` before sending (`common/chat-history.ts`'s `toPersistedMessages`),
 * so the two sides cannot disagree about what is acceptable.
 *
 * Exported so `conversations-table-schema.test.ts` can validate against it directly -- otherwise
 * this is the only place a new `TableSpec` field's persistence acceptance could be checked at all.
 */
export const tableSpecSchema = schema.object({
  columns: schema.arrayOf(
    schema.object({
      id: schema.string({ maxLength: MAX_TABLE_LABEL_LENGTH }),
      label: schema.string({ maxLength: MAX_TABLE_LABEL_LENGTH }),
    }),
    { maxSize: MAX_TABLE_COLUMNS },
  ),
  rows: schema.arrayOf(schema.recordOf(schema.string(), schema.any()), {
    maxSize: CONVERSATION_MAX_TABLE_ROWS,
  }),
  severityColumn: schema.maybe(
    schema.string({ maxLength: MAX_TABLE_LABEL_LENGTH }),
  ),
  discover: schema.maybe(
    schema.object({
      index: schema.string({ maxLength: MAX_TABLE_LABEL_LENGTH }),
      dsl: schema.recordOf(schema.string(), schema.any()),
    }),
  ),
  /** "Open in Security Analytics" (common/types.ts's `TableSpec.securityAnalyticsLink`) --
   * `discover`'s sibling for wazuh-threatintel-* content with no OSD index-pattern. `url` is
   * already fully built (app path + hash route + resolved space) by the time it reaches here. */
  securityAnalyticsLink: schema.maybe(
    schema.object({
      label: schema.string({ maxLength: MAX_TABLE_LABEL_LENGTH }),
      url: schema.string({ maxLength: MAX_TABLE_LABEL_LENGTH }),
    }),
  ),
});

/** Mirrors server/routes/chat.ts's inline `messages` body schema (role/content/toolCalls/
 * toolCallId) plus the two persistence-only fields `common/types.ts`'s `PersistedChatMessage` adds
 * (`createdAt`, `table`) — duplicated here rather than imported so this file (and chat.ts) can each
 * evolve independently; both must be kept in sync with common/types.ts if that ever changes shape.
 * `content` carries `maxLength: MAX_MESSAGE_CONTENT_LENGTH` (chat.ts's own copy is intentionally NOT
 * bounded the same way here — only what gets PERSISTED needs this bound).
 *
 * `createdAt` and `table` are BOTH optional, so a client that predates them — or a conversation
 * saved by one — is accepted unchanged. */
const chatMessageSchema = schema.object({
  role: schema.oneOf([
    schema.literal('system'),
    schema.literal('user'),
    schema.literal('assistant'),
    schema.literal('tool'),
  ]),
  content: schema.string({ maxLength: MAX_MESSAGE_CONTENT_LENGTH }),
  toolCalls: schema.maybe(
    schema.arrayOf(
      schema.object({
        id: schema.string(),
        name: schema.string(),
        arguments: schema.recordOf(schema.string(), schema.any()),
      }),
    ),
  ),
  toolCallId: schema.maybe(schema.string()),
  /** Epoch milliseconds. `min: 0` only rejects a nonsensical negative instant; no upper bound, since
   * a client's clock is its own and this value is display-only. */
  createdAt: schema.maybe(schema.number({ min: 0 })),
  table: schema.maybe(tableSpecSchema),
  interrupted: schema.maybe(schema.boolean()),
});

const createOrReplaceBodySchema = schema.object({
  title: schema.string({ minLength: 1, maxLength: MAX_TITLE_LENGTH }),
  messages: schema.arrayOf(chatMessageSchema, {
    maxSize: MAX_MESSAGES_PER_CONVERSATION,
  }),
});

/** PUT-only body: everything `createOrReplaceBodySchema` has, plus the optional
 * optimistic-concurrency token. A brand-new conversation (POST) has no prior version to conflict
 * with, so this field only ever makes sense on an update. */
const updateBodySchema = schema.object({
  title: schema.string({ minLength: 1, maxLength: MAX_TITLE_LENGTH }),
  messages: schema.arrayOf(chatMessageSchema, {
    maxSize: MAX_MESSAGES_PER_CONVERSATION,
  }),
  /** When present and decodable (`conversation-store.ts`'s `decodeVersion`), forwarded to
   * `updateConversation` as `occ` so a write against a since-changed document 409s instead of
   * applying (`isVersionConflictError` above translates that into the response). When absent (or
   * undecodable), the update is unconditional — the exact pre-fix call shape — so an older client
   * that has never heard of `expectedVersion` keeps its current last-write-wins behavior unchanged. */
  expectedVersion: schema.maybe(schema.string()),
});

/**
 * Owner-scoped CRUD for persistent (saved/resumable) conversations, backed by the
 * `wazuh-ai-assistant-sessions` index alias (see conversation-store.ts). Every route resolves the
 * caller's owner FIRST (`resolveOwner`) and either stamps it (create) or checks it (read/update/
 * delete) — an `owner`/`user` value is NEVER accepted from the request body; the create/update body
 * schemas above have no such property at all, so there is nothing for a client to override.
 *
 * A conversation that exists but belongs to a different owner always 404s, never 403s — this
 * avoids confirming to a caller that a given conversation id exists at all when it isn't theirs.
 * (This is a DIFFERENT case from an unresolved identity, which 403s via
 * `ownerUnresolvedResponse` before any id is even considered — see `resolveOwner`'s doc comment.)
 */
export function registerConversationRoutes(
  router: IRouter,
  _logger: Logger,
): void {
  // List: summaries only (id/title/updatedAt) — never `messages`, so listing never pulls every
  // saved transcript over the wire just to render a sidebar.
  router.get(
    {
      path: API_PATHS.CONVERSATIONS,
      validate: { query: paginationQuerySchema },
    },
    withInternalErrorHandling(async (context, request, response) => {
      const owner = await resolveOwner(context, request);
      if (owner === undefined) {
        return ownerUnresolvedResponse(response);
      }
      const { page, perPage } = resolvePagination(request.query);

      // Ordering by `updated_at` desc and filtering by `owner` both run server-side, inside
      // `listConversations`'s single search call — see that function's own doc comment for why
      // splitting either step out to run in JS afterwards would make `total`/pagination
      // meaningless.
      //
      // No client-side retention pruning here any more: the index alias is a data stream managed
      // by an ISM policy (wazuh-indexer-plugins#1422) that rotates and deletes old backing indices
      // itself, so there is nothing left for this route to prune on access.
      const { hits, total } = await listConversations(
        context,
        owner,
        page,
        perPage,
      );
      const conversations: ConversationSummary[] = hits.map(hit =>
        toSummary(hit.id, hit.source),
      );

      return response.ok({
        body: { conversations, total, page, perPage },
      });
    }),
  );

  // Create: stamps owner + both timestamps server-side. Empty conversations are the CALLER's
  // responsibility not to send (public/services/conversations-service.ts's caller, chat-page.tsx,
  // never auto-saves an empty one) — this route itself accepts an empty `messages` array without
  // complaint, since a deliberate "create a blank conversation" is a reasonable future use.
  router.post(
    {
      path: API_PATHS.CONVERSATIONS,
      validate: { body: createOrReplaceBodySchema },
    },
    withInternalErrorHandling(async (context, request, response) => {
      // Create is NOT owner-CHECKING (nothing pre-existing to compare against, unlike the
      // four routes below), so it is deliberately excluded from the fail-closed set — an
      // unresolved identity here still stamps the shared `CONVERSATION_OWNER_FALLBACK` sentinel,
      // exactly the prior behavior. This is a safe dead end: every owner-CHECKING route below now
      // fails closed for an unresolved identity, so a conversation stamped with the shared
      // sentinel can never be listed, read, updated, or deleted back through this API by an
      // unresolved-identity caller.
      const owner =
        (await resolveOwner(context, request)) ?? CONVERSATION_OWNER_FALLBACK;

      // Per-owner COUNT cap -- CREATE only. PUT (update route below) must always work even
      // at the cap (editing an existing conversation never adds a new document), so this check
      // has no equivalent there by design.
      const existingCount = await countConversations(context, owner);
      if (existingCount >= MAX_CONVERSATIONS_PER_OWNER) {
        return conversationLimitReachedResponse(response);
      }

      const nowIso = new Date().toISOString();
      const document: ConversationDocument = {
        user: owner,
        title: request.body.title,
        created_at: nowIso,
        updated_at: nowIso,
        messages: request.body.messages as PersistedChatMessage[],
      };
      const id = await createConversation(context, document);
      return response.ok({ body: toRecord(id, document) });
    }),
  );

  // Fetch one conversation's full transcript (resume). 404s both when the id doesn't exist at all
  // and when it belongs to a different owner — see this function's doc comment.
  router.get(
    {
      path: API_PATHS.CONVERSATION_BY_ID(`{id}`),
      validate: { params: schema.object({ id: schema.string() }) },
    },
    withInternalErrorHandling(async (context, request, response) => {
      const owner = await resolveOwner(context, request);
      if (owner === undefined) {
        return ownerUnresolvedResponse(response);
      }
      const hit = await findConversationHit(context, owner, request.params.id);
      if (!hit) {
        return response.notFound();
      }
      return response.ok({
        body: toRecord(
          hit.id,
          hit.source,
          encodeVersion(hit.seqNo, hit.primaryTerm),
        ),
      });
    }),
  );

  // Update: full replace of title + messages (mirrors the settings singleton's "send the whole
  // thing every time" convention); `created_at`/`user` are carried over untouched, `updated_at` is
  // always server-recomputed (never trusts a client-sent timestamp).
  //
  // Optimistic concurrency (same conversation open in two tabs previously last-write-wins,
  // silently erasing the faster tab's turns). Old-client-vs-new-server is fully backward
  // compatible: `expectedVersion` is `schema.maybe(...)`, so a client built before this fix that
  // never sends it gets the exact pre-fix call shape (unconditional overwrite) — nothing here
  // changes for it.
  router.put(
    {
      path: API_PATHS.CONVERSATION_BY_ID(`{id}`),
      validate: {
        params: schema.object({ id: schema.string() }),
        body: updateBodySchema,
      },
    },
    withInternalErrorHandling(async (context, request, response) => {
      const owner = await resolveOwner(context, request);
      if (owner === undefined) {
        return ownerUnresolvedResponse(response);
      }
      const existing: ConversationHit | undefined = await findConversationHit(
        context,
        owner,
        request.params.id,
      );
      if (!existing) {
        return response.notFound();
      }
      const updatedAt = new Date().toISOString();
      const messages = request.body.messages as PersistedChatMessage[];
      const { expectedVersion } = request.body;
      const occ = expectedVersion ? decodeVersion(expectedVersion) : undefined;

      let written;
      try {
        written = await updateConversation(
          context,
          existing,
          { title: request.body.title, messages, updated_at: updatedAt },
          occ
            ? { ifSeqNo: occ.seqNo, ifPrimaryTerm: occ.primaryTerm }
            : undefined,
        );
      } catch (error) {
        // Only a request that OPTED IN (sent a decodable expectedVersion) can ever hit this —
        // without it, updateConversation above is called with no occ option at all, i.e. no
        // version check. Any other failure (network/mapping/etc.) is not this route's problem to
        // discriminate further; it falls through to withInternalErrorHandling's 500, same as
        // every other unexpected error in this file.
        if (occ && isVersionConflictError(error)) {
          return response.customError({
            statusCode: 409,
            body: {
              message:
                'Conversation was updated by another session since you last loaded it. Refresh and retry.',
            },
          });
        }
        throw error;
      }

      return response.ok({
        body: toRecord(
          request.params.id,
          {
            ...existing.source,
            title: request.body.title,
            messages,
            updated_at: updatedAt,
          },
          encodeVersion(written.seqNo, written.primaryTerm),
        ),
      });
    }),
  );

  // Delete: owner-checked the same way as GET/PUT above.
  router.delete(
    {
      path: API_PATHS.CONVERSATION_BY_ID(`{id}`),
      validate: { params: schema.object({ id: schema.string() }) },
    },
    withInternalErrorHandling(async (context, request, response) => {
      const owner = await resolveOwner(context, request);
      if (owner === undefined) {
        return ownerUnresolvedResponse(response);
      }
      const existing = await findConversationHit(
        context,
        owner,
        request.params.id,
      );
      if (!existing) {
        return response.notFound();
      }
      await deleteConversation(context, existing);
      return response.ok({ body: { deleted: true } });
    }),
  );
}
