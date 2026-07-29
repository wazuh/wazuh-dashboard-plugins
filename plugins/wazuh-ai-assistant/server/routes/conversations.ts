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
  CONVERSATION_SAVED_OBJECT_TYPE,
} from '../../common/constants';
import {
  ConversationRecord,
  ConversationSummary,
  PersistedChatMessage,
} from '../../common/types';
import { ConversationAttributes } from '../saved_objects/conversation';
import { getOrCreateAssistantSettings } from './settings';
import { getSavedObjectsStart } from '../plugin-services';
import { resolveWazuhUsername } from '../identity';
import {
  paginationQuerySchema,
  resolvePagination,
  withInternalErrorHandling,
} from './route-helpers';

/**
 * A request-scoped saved-objects client that CAN see the hidden conversation type. The route
 * context's default `context.core.savedObjects.client` is built with no hidden types on this OSD
 * version, so creating/reading `wazuh-ai-assistant-conversation` through it fails with "Unsupported
 * saved object type" — the start contract's `getScopedClient(request, {includedHiddenTypes})` is
 * the only way in. `includedHiddenTypes` ADDS to (does not replace) the visible types, so this
 * same client also reads the visible `wazuh-ai-assistant-settings` singleton the list route needs.
 * Still request-scoped (asCurrentUser), so per-user access control is unchanged.
 */
function conversationClient(request: OpenSearchDashboardsRequest) {
  return getSavedObjectsStart().getScopedClient(request, {
    includedHiddenTypes: [CONVERSATION_SAVED_OBJECT_TYPE],
  });
}

/**
 * Owner resolution. Two platform facts drive the whole design: OSD's `encryptedSavedObjects`
 * plugin is absent from this deployment, and standard saved objects carry no per-user storage
 * isolation of their own. "One conversation per user" therefore has to be enforced entirely at the
 * application layer — stamping an `owner` attribute on write and checking it on every read/write
 * below.
 *
 * The shared `context.wazuh.security.getCurrentUser` lookup (untyped cast, string-vs-object
 * narrowing, defensive try/catch) now lives in `server/identity.ts`'s `resolveWazuhUsername` —
 * see that file's doc comment for the platform facts and for why it deliberately returns
 * `undefined`, with no fallback of its own, on every "can't resolve an identity" path.
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
 * because `owner` gates actual read/write/delete access to another user's data.
 *
 * Exported for unit testing only; not part of this file's public contract.
 *
 * A resolved username that is EXACTLY `CONVERSATION_OWNER_FALLBACK` ('_shared') is treated as
 * UNRESOLVED, not as a real identity. Without this, the only path to a row stamped
 * with the shared fallback sentinel (create's own unresolved-identity fallback, see that route's
 * comment) is a real dashboard account literally named `_shared` -- logging in as that literal
 * username would resolve here and pass every owner check below, reading/overwriting/deleting every
 * unresolved-identity caller's shared-bucket rows. Closing that off costs nothing for any
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

/** Escapes `\` and `"` inside a value that will be interpolated into a quoted KQL string literal
 * (the `filter` below) — neutralizes the two characters that could otherwise break out of the
 * quoted literal. `owner` is always server-resolved (`resolveOwner`), never client-supplied, but
 * this is cheap insurance regardless (e.g. an unusual username containing a literal quote). */
function escapeKqlValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Per-owner conversation COUNT cap, enforced on CREATE only (see that route's call site
 * for why PUT must never be blocked by it). Reuses the exact owner-scoped `find` pattern the list
 * route above already runs for pagination — same `filter` shape, but `perPage: 1` so the
 * saved-objects repository still returns an authoritative `result.total` for this owner without
 * this check itself fetching (or the caller ever seeing) any actual documents. */
async function countOwnerConversations(
  client: ReturnType<typeof conversationClient>,
  owner: string,
): Promise<number> {
  const result = await client.find<ConversationAttributes>({
    type: CONVERSATION_SAVED_OBJECT_TYPE,
    page: 1,
    perPage: 1,
    filter: `${CONVERSATION_SAVED_OBJECT_TYPE}.attributes.owner: "${escapeKqlValue(
      owner,
    )}"`,
  });
  return result.total;
}

/** Per-owner cap on the NUMBER of saved conversations (checked on CREATE only -- see that route's
 * comment for why PUT must never be blocked by it). 500 is far more than any real user
 * accumulates through normal use without ever deleting old conversations. */
const MAX_CONVERSATIONS_PER_OWNER = 500;

/** Exact 409 body the CREATE route returns when the caller is already at
 * `MAX_CONVERSATIONS_PER_OWNER`. 409 (not 400): the request itself is well-formed, it's the
 * caller's current STATE (already owning the maximum) that conflicts with creating one more —
 * the same conflict-with-current-state semantics this file's version-conflict 409 (above) uses,
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
  attributes: ConversationAttributes,
): ConversationSummary {
  return { id, title: attributes.title, updatedAt: attributes.updatedAt };
}

/** `version` is optional here (not read off `attributes`) because it comes from a DIFFERENT part
 * of the saved-objects client's response than `attributes` does — every call site below passes
 * whatever `.version` its own client.get/create/update call returned. See `ConversationRecord`'s
 * doc comment (common/types.ts) for what the client does with it. */
function toRecord(
  id: string,
  attributes: ConversationAttributes,
  version?: string,
): ConversationRecord {
  return {
    id,
    title: attributes.title,
    createdAt: attributes.createdAt,
    updatedAt: attributes.updatedAt,
    messages: attributes.messages,
    version,
  };
}

/**
 * Version-conflict detection for the optimistic-concurrency PUT below: when the request
 * carries `expectedVersion` and it no longer matches what is stored, `client.update`'s `{version}`
 * option makes the saved-objects repository reject with a 409-shaped conflict error instead of
 * applying the write. The documented way to recognize that rejection is
 * `SavedObjectsErrorHelpers.isConflictError` — deliberately NOT imported here, the same call
 * `getOrCreateAssistantSettings` (server/routes/settings.ts) already makes for its own 404 case:
 * "create it with defaults rather than importing the error-helpers just to discriminate this one
 * case." That precedent is even more load-bearing here, though, for a second, mechanical reason —
 * every existing import from `../../../../src/core/server` in THIS file is type-only (interfaces
 * like `IRouter`/`Logger`/etc.), which TypeScript erases entirely from the emitted JS; importing
 * `SavedObjectsErrorHelpers` as a VALUE would stop that erasure and make this file's compiled
 * output actually `require()` that path at test time, which only resolves from inside a real OSD
 * checkout (tsconfig.test.json's own comment). Duck-typing avoids that risk entirely. The
 * OSD build's actual 3.6 sources were not available to verify
 * `isConflictError`'s exact behavior for THIS specific path (a version-mismatch update, as opposed
 * to a duplicate-id create) — so the checks below cover both shapes a saved-objects conflict is
 * documented to surface as: a Boom-style HTTP error (`error.output.statusCode`) and the bare
 * `error.statusCode` some client wrappers use instead. Either matching is treated as a conflict.
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
 * authenticated user could previously create unlimited conversation saved objects with unbounded
 * title/message sizes, growing the shared saved-objects index indefinitely (retention defaults to
 * keep-forever and only prunes on access — see the list route above). These constants bound that
 * WITHOUT breaking real usage — each is generous relative to legitimate traffic, just no longer
 * infinite. Every limit lives here, named, so the schemas below and `countOwnerConversations`
 * (used by the CREATE route further down) can't drift out of sync.
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
 * messages — each bound exists to stop an UNBOUNDED saved object, not to constrain real use. */
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
 */
const tableSpecSchema = schema.object({
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
  /** When present, forwarded to the saved-objects client's `update` as `{version: expectedVersion}`
   * so a write against a since-changed row 409s instead of applying (`isVersionConflictError`
   * above translates that into the response). When ABSENT, `client.update` is called with no
   * version option at all — the exact pre-fix call shape — so an older client that has never heard
   * of `expectedVersion` keeps its current unconditional last-write-wins behavior unchanged. */
  expectedVersion: schema.maybe(schema.string()),
});

/**
 * Owner-scoped CRUD for persistent (saved/resumable) conversations. Every route resolves the
 * caller's owner FIRST (`resolveOwner`) and either stamps it (create) or checks it (read/update/
 * delete) — an `owner` value is NEVER accepted from the request body; the create/update body
 * schemas above have no `owner` property at all, so there is nothing for a client to override.
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
      const client = conversationClient(request);
      const owner = await resolveOwner(context, request);
      if (owner === undefined) {
        return ownerUnresolvedResponse(response);
      }
      const assistantSettings = await getOrCreateAssistantSettings(request);
      const retentionDays = assistantSettings.conversationRetentionDays;
      const { page, perPage } = resolvePagination(request.query);

      // Owner scoping and ordering both have to happen SERVER-SIDE, in this one `find()` call:
      //
      // - Filtering: a KQL `filter` on the `owner` keyword field (mapped in
      //   server/saved_objects/conversation.ts). Filtering the page in JS after the fact would make
      //   `total` and pagination meaningless — page N would be page N of every owner's rows
      //   combined — because pagination is only correct when the filter the response counts against
      //   (`result.total`) is the one that selected the rows. `escapeKqlValue` neutralizes `"`/`\`
      //   in `owner` (server-resolved, never client-supplied) so it cannot break out of the quoted
      //   KQL literal.
      // - Sorting: for the same reason. Sorting only the rows already fetched would order each page
      //   internally while leaving which conversations land on which page up to the repository's
      //   default order, so "most recent first" would silently break at the first page boundary.
      const result = await client.find<ConversationAttributes>({
        type: CONVERSATION_SAVED_OBJECT_TYPE,
        page,
        perPage,
        sortField: 'updatedAt',
        sortOrder: 'desc',
        filter: `${CONVERSATION_SAVED_OBJECT_TYPE}.attributes.owner: "${escapeKqlValue(
          owner,
        )}"`,
      });
      const owned = result.saved_objects;

      let visible = owned;
      if (retentionDays > 0) {
        const cutoffMs = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
        const expired = owned.filter(
          object => new Date(object.attributes.updatedAt).getTime() < cutoffMs,
        );
        visible = owned.filter(
          object => new Date(object.attributes.updatedAt).getTime() >= cutoffMs,
        );
        // Best-effort prune, ON-ACCESS ONLY (AssistantSettingsAttributes.conversationRetentionDays's
        // doc comment: OSD plugins have no scheduled/cron job runner, so there is no other trigger
        // for this). A delete failing here just means the same row is retried on the next GET —
        // never blocks the response, and the row is already excluded from `visible` regardless.
        // Scoped to just THIS page's rows — retention pruning is inherently best-effort/eventual
        // (same doc comment) and a row on a later page is simply caught on a future GET of that
        // page, same as before pagination existed.
        await Promise.all(
          expired.map(object =>
            client
              .delete(CONVERSATION_SAVED_OBJECT_TYPE, object.id)
              .catch(() => undefined),
          ),
        );
      }

      // Already ordered by the `find()` above; retention pruning only removes rows.
      const conversations: ConversationSummary[] = visible.map(object =>
        toSummary(object.id, object.attributes),
      );

      return response.ok({
        body: { conversations, total: result.total, page, perPage },
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
      // exactly the prior behavior (previously `resolveOwner` itself returned that value for every
      // caller; this route's own unresolved-identity behavior is unchanged byte-for-byte). This is
      // a safe dead end: every owner-CHECKING route below now fails closed for an unresolved
      // identity, so a conversation stamped with the shared sentinel can never be listed, read,
      // updated, or deleted back through this API by an unresolved-identity caller.
      const owner =
        (await resolveOwner(context, request)) ?? CONVERSATION_OWNER_FALLBACK;
      const client = conversationClient(request);

      // Per-owner COUNT cap -- CREATE only. PUT (update route below) must always work even
      // at the cap (editing an existing conversation never adds a new row), so this check has no
      // equivalent there by design.
      const existingCount = await countOwnerConversations(client, owner);
      if (existingCount >= MAX_CONVERSATIONS_PER_OWNER) {
        return conversationLimitReachedResponse(response);
      }

      const nowIso = new Date().toISOString();
      const created = await client.create<ConversationAttributes>(
        CONVERSATION_SAVED_OBJECT_TYPE,
        {
          owner,
          title: request.body.title,
          createdAt: nowIso,
          updatedAt: nowIso,
          messages: request.body.messages as PersistedChatMessage[],
        },
      );
      return response.ok({
        body: toRecord(created.id, created.attributes, created.version),
      });
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
      try {
        const found = await conversationClient(
          request,
        ).get<ConversationAttributes>(
          CONVERSATION_SAVED_OBJECT_TYPE,
          request.params.id,
        );
        if (found.attributes.owner !== owner) {
          return response.notFound();
        }
        return response.ok({
          body: toRecord(found.id, found.attributes, found.version),
        });
      } catch {
        return response.notFound();
      }
    }),
  );

  // Update: full replace of title + messages (mirrors the settings singleton's "send the whole
  // thing every time" convention); `createdAt`/`owner` are carried over untouched, `updatedAt` is
  // always server-recomputed (never trusts a client-sent timestamp).
  //
  // Optimistic concurrency (same conversation open
  // in two tabs previously last-write-wins, silently erasing the faster tab's turns). Old-client-
  // vs-new-server is fully backward compatible: `expectedVersion` is `schema.maybe(...)`, so a
  // client built before this fix that never sends it gets the exact pre-fix call (`client.update`
  // with no version option, unconditional overwrite) — nothing here changes for it. New-client-vs-
  // OLD-server is NOT verified either way: whether `@osd/config-schema`'s `schema.object` rejects
  // an extra unrecognized `expectedVersion` key outright (a 400) or silently drops it depends on
  // this OSD version's default `unknowns` behavior, which was not verified against the real 3.6
  // sources. In practice client and server ship
  // from the same plugin bundle, so this cross-version case should not arise outside a rolling
  // upgrade of the dashboard itself.
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
      const client = conversationClient(request);
      let existing;
      try {
        existing = await client.get<ConversationAttributes>(
          CONVERSATION_SAVED_OBJECT_TYPE,
          request.params.id,
        );
      } catch {
        return response.notFound();
      }
      if (existing.attributes.owner !== owner) {
        return response.notFound();
      }
      const updatedAt = new Date().toISOString();
      const messages = request.body.messages as PersistedChatMessage[];
      const { expectedVersion } = request.body;

      let updated;
      try {
        updated = await client.update<ConversationAttributes>(
          CONVERSATION_SAVED_OBJECT_TYPE,
          request.params.id,
          { title: request.body.title, messages, updatedAt },
          expectedVersion ? { version: expectedVersion } : undefined,
        );
      } catch (error) {
        // Only a request that OPTED IN (sent expectedVersion) can ever hit this — without it,
        // client.update above is called exactly as it was before this fix, no version check at
        // all. Any other failure (network/mapping/etc.) is not this route's problem to
        // discriminate further; it falls through to withInternalErrorHandling's 500, same as
        // every other unexpected error in this file.
        if (expectedVersion && isVersionConflictError(error)) {
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
            ...existing.attributes,
            title: request.body.title,
            messages,
            updatedAt,
          },
          updated.version,
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
      const client = conversationClient(request);
      let existing;
      try {
        existing = await client.get<ConversationAttributes>(
          CONVERSATION_SAVED_OBJECT_TYPE,
          request.params.id,
        );
      } catch {
        return response.notFound();
      }
      if (existing.attributes.owner !== owner) {
        return response.notFound();
      }
      await client.delete(CONVERSATION_SAVED_OBJECT_TYPE, request.params.id);
      return response.ok({ body: { deleted: true } });
    }),
  );
}
