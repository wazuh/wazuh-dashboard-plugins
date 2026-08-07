import { Readable } from 'stream';
import { schema } from '@osd/config-schema';
import {
  IRouter,
  Logger,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from '../../../../src/core/server';
import {
  API_PATHS,
  CONVERSATION_OWNER_FALLBACK,
  PROVIDER_SAVED_OBJECT_TYPE,
} from '../../common/constants';
import {
  ChatMessage,
  ProviderConfig,
  PseudonymEntry,
  StreamEvent,
  StreamUsage,
  ToolCall,
  ToolSpec,
} from '../../common/types';
import { describeError } from '../../common/errors';
import { getProviderAdapter } from '../providers/registry';
import { ChatStreamOptions, ProviderAdapter } from '../providers/types';
import { buildSystemPrompt } from '../prompts';
import { listToolSpecs } from '../tools/registry';
import {
  executeToolCall,
  PrivacyContext,
  ToolExecutionOutcome,
} from '../tools/executor';
import { validate } from '../tools/schema-validator';
import {
  prescanAndMint,
  prescanAndMintToolContent,
  Pseudonymizer,
  StreamDepseudonymizer,
} from '../tools/privacy';
import { MarkdownTableSuppressor } from '../tools/markdown-table-filter';
import { getOrCreateAssistantSettings } from './settings';
import { getApiKeyCipher, getSavedObjectsStart } from '../plugin-services';
import { resolveWazuhUsername } from '../identity';
import {
  buildRoutingPrompt,
  resolveStage2Tools,
  ROUTE_QUESTION_TOOL,
  ROUTER_ENABLED,
} from '../tools/router';
import { addUsage, toStreamUsage, ZERO_USAGE_TOTALS } from './chat-usage';
import {
  resolveSuggestedDsl,
  SUGGEST_DISCOVER_QUERY_TOOL,
  validateSuggestDiscoverQueryArgs,
} from '../tools/suggest-discover-query';

interface StoredProviderAttributes {
  name: string;
  type: ProviderConfig['type'];
  baseUrl: string;
  model: string;
  apiKey?: string;
}

/** Bounded tool rounds per turn; a final no-tools round follows to close out the answer. */
const MAX_TOOL_ROUNDS = 3;

/**
 * Fallback narration for a turn that used at least one tool but whose model never emitted any
 * `delta` text of its own before ending in `done` — observed with a tool call that returned zero
 * rows, where the model apparently considered the (empty) table sufficient and said nothing.
 * Without this, the user sees a bare table (or nothing at all, for a zero-row result) with no
 * written answer. Two variants: the table rendered something (`sawNonEmptyTable`) vs. the query
 * came back empty. Both are tables-oriented copy — see NO_ANSWER_MESSAGE below for the sibling
 * case where no tool ran at all, which this copy would misdescribe.
 */
const NO_ANALYSIS_TEXT_MESSAGE =
  'No additional analysis — see the results above.';
const NO_MATCHING_RESULTS_MESSAGE =
  'No matching results were found for that query.';
/**
 * Sibling fallback for a `general`-routed (no-tool) turn that still ends with no text at all —
 * e.g. a reasoning model streaming its entire answer on a channel nothing reads (issue
 * 02-read-reasoning-delta.md's `openai-compatible.ts` fix is the known cause; this is the
 * structural backstop for any future one). Deliberately its own copy rather than reusing
 * NO_ANALYSIS_TEXT_MESSAGE/NO_MATCHING_RESULTS_MESSAGE above: both of those say or imply "see the
 * results above" / "that query", which is wrong here — no tool ran, so there is no table and no
 * query to refer to.
 */
const NO_ANSWER_MESSAGE =
  'I was not able to come up with an answer for that. Try rephrasing your question.';

/** Picks which of the three no-text fallbacks above fits a turn that ended without any `delta`
 * text — shared by both `!sawAnyDelta` exit points below (the normal per-round `done` branch and
 * the round-budget-exhausted path) so the same three-way decision lives in exactly one place. */
function noTextFallbackMessage(
  toolUsedThisTurn: boolean,
  sawNonEmptyTable: boolean,
): string {
  if (!toolUsedThisTurn) {
    return NO_ANSWER_MESSAGE;
  }
  return sawNonEmptyTable
    ? NO_ANALYSIS_TEXT_MESSAGE
    : NO_MATCHING_RESULTS_MESSAGE;
}

/** Whitespace-only delta content (e.g. a lone "\n\n" some models emit as priming/formatting
 * right before a tool call) must NOT count as "the model produced an answer" — otherwise the
 * `sawAnyDelta` guard above never fires for exactly the turns it exists to catch. Still forwarded
 * to the client as a normal delta either way; this only affects the tracking flag. */
function hasMeaningfulText(content: string): boolean {
  return content.trim().length > 0;
}

/**
 * Concurrent-stream cap. Without it, one script or user can open unlimited concurrent streams --
 * the only other protections are accidental (the browser's 6-connection cap, the event loop).
 * `perUserActiveStreams`/`globalActiveStreams` are the enforcement: live counters of open chat
 * streams, incremented on acquire and decremented on release (see `acquireStreamSlot` and
 * `releaseStreamSlotWhenDone`).
 *
 * Deliberate long-lived module-level state, and the one exception to this route's rule against it
 * (`resolvePrivacyEnabled`'s pseudonymizer is never cached at module scope; tools/privacy.ts keeps
 * no module-level caches either). That rule exists to stop REQUEST DATA -- pseudonym maps,
 * conversation content -- from outliving its request and leaking into another. A count of
 * currently-open streams holds no request data, so it cannot leak anything; it must be
 * process-wide precisely because the limit it enforces is process-wide.
 */
const perUserActiveStreams = new Map<string, number>();
let globalActiveStreams = 0;

/** Per-user cap: same style/locality as MAX_TOOL_ROUNDS above (route-local constant, not config).
 * This and the rest of this section, down to `releaseStreamSlotWhenDone`, are exported for unit
 * testing of the accounting logic only — none of it is part of this route's HTTP contract. */
export const MAX_CONCURRENT_STREAMS_PER_USER = 5;
/** Whole-server cap across every user, including CONVERSATION_OWNER_FALLBACK callers. */
export const MAX_CONCURRENT_STREAMS_GLOBAL = 30;

/**
 * User identity for the concurrent-stream cap. The shared `context.wazuh.security.
 * getCurrentUser` lookup (untyped cast, string-vs-object narrowing, defensive try/catch) now
 * lives in `server/identity.ts`'s `resolveWazuhUsername` — see that file's doc comment for the
 * platform facts this relies on and for why the core itself applies no fallback.
 *
 * Fallback-difference pointer (the part that must never drift): this function DELIBERATELY keeps
 * the shared `CONVERSATION_OWNER_FALLBACK` sentinel as ITS OWN fallback — UNLIKE
 * server/routes/conversations.ts's `resolveOwner`, which fails closed to
 * `undefined` instead. That is safe here ONLY because the bucket key this resolves is used
 * exclusively for rate-limit COUNTING (`acquireStreamSlot`'s two counters below), never for
 * authorization or access control — unlike a saved conversation's `owner`, nothing this key
 * selects is ever read back to a caller, so collapsing multiple identities into one bucket cannot
 * leak or misattribute any data. Do NOT give unresolved-identity callers their own buckets by
 * keying on client IP: `X-Forwarded-For` is trivially spoofable, so an attacker could forge a
 * fresh IP per request and dodge the per-"user" cap entirely. The shared-bucket availability
 * tradeoff below is the deliberate lesser cost.
 *
 * Consequence, stated explicitly: whenever identity resolution is unavailable DEPLOYMENT-WIDE
 * (anonymous auth configured, or a `wazuh` main-plugin startup race before its route-handler
 * context is registered), every such caller shares ONE `CONVERSATION_OWNER_FALLBACK` bucket, and
 * `MAX_CONCURRENT_STREAMS_PER_USER` (5) then caps the WHOLE deployment at 5 concurrent streams,
 * not 5 per real user -- an availability tradeoff accepted deliberately in exchange for not
 * introducing the IP-spoofing surface above, and independent of `MAX_CONCURRENT_STREAMS_GLOBAL`
 * (30), which still applies on top regardless of bucketing.
 *
 * Also note: both counters (`perUserActiveStreams`/`globalActiveStreams`) are plain in-process
 * module state (see their own doc comment above), so every cap enforced through them —
 * per-user/per-fallback-bucket AND global alike — is scoped PER NODE PROCESS. In a multi-instance
 * or HA dashboard deployment, the effective caps are therefore per-instance (e.g. a 3-instance HA
 * deployment behind a load balancer effectively allows up to 3x `MAX_CONCURRENT_STREAMS_GLOBAL`
 * streams cluster-wide, and up to 3x 5 concurrent streams for the shared fallback bucket if traffic
 * spreads evenly across instances), not a true cluster-wide cap.
 *
 * Exported for conversations-owner-resolution.test.ts only (its chat-side fallback
 * cases) -- not part of this route's public HTTP contract.
 */
export async function resolveChatStreamUser(
  context: RequestHandlerContext,
  request: OpenSearchDashboardsRequest,
): Promise<string> {
  return (
    (await resolveWazuhUsername(context, request)) ??
    CONVERSATION_OWNER_FALLBACK
  );
}

/** Successful acquire: `release` is safe to call any number of times (idempotent, see below) but
 * MUST be called exactly once per acquired slot for the counters to stay accurate. */
interface StreamSlotAcquired {
  ok: true;
  release: () => void;
}

/** Rejected acquire: `message` is a plain, English, client-facing string (this codebase's server
 * route errors in this plugin are not translated) that
 * distinguishes which limit was hit. */
interface StreamSlotRejected {
  ok: false;
  message: string;
}

/**
 * Attempts to reserve one concurrent-stream slot for `username`, checking the GLOBAL cap first
 * (it is the harder outage to recover from) then the PER-USER cap. On success, increments both
 * counters and returns a `release` closure that decrements them back -- guarded by a `released`
 * flag so calling it more than once (defensive; see `releaseStreamSlotWhenDone`'s doc comment for
 * why a double-release should be structurally impossible anyway) is a no-op rather than a double
 * decrement that would drift the counters out of sync with reality.
 */
export function acquireStreamSlot(
  username: string,
): StreamSlotAcquired | StreamSlotRejected {
  if (globalActiveStreams >= MAX_CONCURRENT_STREAMS_GLOBAL) {
    return {
      ok: false,
      message:
        `The AI Assistant is at capacity: ${MAX_CONCURRENT_STREAMS_GLOBAL} answers are already ` +
        'streaming across all users right now. Wait for one to finish and try again.',
    };
  }
  const currentForUser = perUserActiveStreams.get(username) ?? 0;
  if (currentForUser >= MAX_CONCURRENT_STREAMS_PER_USER) {
    return {
      ok: false,
      message:
        `You already have ${currentForUser} answers streaming -- wait for one to finish before ` +
        'starting another.',
    };
  }

  globalActiveStreams += 1;
  perUserActiveStreams.set(username, currentForUser + 1);

  let released = false;
  const release = (): void => {
    if (released) {
      return;
    }
    released = true;
    globalActiveStreams = Math.max(0, globalActiveStreams - 1);
    const remaining = (perUserActiveStreams.get(username) ?? 1) - 1;
    if (remaining <= 0) {
      perUserActiveStreams.delete(username);
    } else {
      perUserActiveStreams.set(username, remaining);
    }
  };

  return { ok: true, release };
}

/**
 * Wraps the SSE-frame generator so the slot `acquireStreamSlot` reserved for this request is
 * released EXACTLY ONCE, on every exit path this generator can take:
 *  - normal completion (`streamSseFrames` returned after a `done`/`error` StreamEvent),
 *  - an exception propagating out of `frames`,
 *  - the consuming `Readable` (`Readable.from` in the route handler below) being destroyed early
 *    -- a client abort/tab-close (`request.events.aborted$`) destroys the HTTP response, which
 *    destroys the Readable, which calls THIS generator's own `.return()` (Node's documented
 *    behavior for a Readable created from an async generator); for an async generator, `.return()`
 *    unwinds exactly like a normal `return` would, running this `finally` on its way out.
 * All three paths converge on the same `finally`, so leak-on-abort is structurally impossible
 * (there is only one call site that can release this slot), and `release()` itself is additionally
 * idempotent as a second line of defense.
 */
export async function* releaseStreamSlotWhenDone(
  frames: AsyncGenerator<string>,
  release: () => void,
): AsyncGenerator<string> {
  try {
    yield* frames;
  } finally {
    release();
  }
}

/** Serialises one canonical StreamEvent as an SSE `data:` frame. */
function toSseFrame(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/** Minimal shape of the settings singleton this route needs (see
 * server/saved_objects/assistant-settings.ts's `AssistantSettingsAttributes`). */
interface PrivacySettings {
  privacyDefaultOn: boolean;
  privacyDefaultPerProvider: Record<string, boolean>;
  userCanOverride: boolean;
}

/**
 * Resolves whether privacy mode is active for this turn:
 * the request's `privacy.enabled` wins ONLY when the admin-configured settings allow user
 * override AND the client actually sent a value; otherwise the provider-specific default applies,
 * falling back to the global default (itself defaulting to `false` — see
 * server/routes/settings.ts's `DEFAULT_ASSISTANT_SETTINGS`) when this provider has no override.
 */
function resolvePrivacyEnabled(
  settings: PrivacySettings,
  providerId: string,
  requested: boolean | undefined,
): boolean {
  if (settings.userCanOverride && requested !== undefined) {
    return requested;
  }
  return (
    settings.privacyDefaultPerProvider[providerId] ?? settings.privacyDefaultOn
  );
}

/**
 * Outbound scrub: returns a COPY of `messages` with every real value
 * the pseudonymizer already knows replaced by its pseudonym, in both plain `content` and any
 * `toolCalls[].arguments`. `messages` itself is left untouched — the loop keeps accumulating the
 * unscrubbed array across rounds; only this transformed copy is ever handed to `adapter.chatStream`.
 *
 * The system message is deliberately NOT scrubbed: it is the static prompt from `buildSystemPrompt`/
 * `buildRoutingPrompt` (server/prompts.ts, server/tools/router.ts) — fixed text with no user or
 * Wazuh data in it — so running `applyToText` over it would only ever be a no-op; skipping it is
 * purely an avoided-work optimization, not a correctness requirement.
 *
 * This is safe to run uniformly regardless of a message's actual current form (freshly-real user
 * text, already-pseudonym digest content the turn itself produced, or resent history from a prior
 * turn): `applyToText` only replaces substrings it recognizes as a REAL value it has a mapping for,
 * so text that is already in pseudonym form is left alone.
 *
 * First-mention pre-scan: for `user`/`tool` role content ONLY, `content`
 * is first run through `privacy.ts`'s pre-scan — flat `prescanAndMint` for user free text,
 * `prescanAndMintToolContent` (JSON-aware, string VALUES only, never keys) for tool digests —
 * which mints a fresh pseudonym for any IPv4/IPv6 address or dotted hostname it finds THIS call
 * has no mapping for yet, before the `applyToText` pass below runs. Both passes share the same `pseudonymizer` instance, so a value
 * minted here is (a) immediately substituted by this same call (the following `applyToText` is then
 * a no-op for it), (b) already reflected in `newEntries()`, so it flows through the existing
 * `privacy_map` SSE emission unchanged, and (c) reverses correctly out of a model-echoed tool-call
 * argument via the existing `reverseObject` path — no second emission/reversal path needed.
 * `assistant` content is left to the `applyToText`-only path: it is the model's own prior narration,
 * out of scope here (see `prescanAndMint`'s doc comment for what it does and does not catch).
 */
function scrubMessagesForProvider(
  messages: ChatMessage[],
  pseudonymizer: Pseudonymizer,
): ChatMessage[] {
  return messages.map(message => {
    if (message.role === 'system') {
      return message;
    }
    // user content is free text -> flat scan; tool content is (normally) digest JSON whose keys
    // are dotted ECS field paths -> JSON-aware scan of string VALUES only, so field names are
    // never minted as hostnames (see prescanAndMintToolContent's doc comment).
    let content: string;
    if (message.role === 'user') {
      content = pseudonymizer.applyToText(
        prescanAndMint(message.content, pseudonymizer),
      );
    } else if (message.role === 'tool') {
      content = pseudonymizer.applyToText(
        prescanAndMintToolContent(message.content, pseudonymizer),
      );
    } else {
      content = pseudonymizer.applyToText(message.content);
    }
    return {
      ...message,
      content,
      ...(message.toolCalls
        ? {
            toolCalls: message.toolCalls.map(call => ({
              ...call,
              arguments: pseudonymizer.applyToObject(call.arguments),
            })),
          }
        : {}),
    };
  });
}

export function registerChatRoutes(router: IRouter, logger: Logger): void {
  router.post(
    {
      path: API_PATHS.CHAT,
      validate: {
        body: schema.object({
          providerId: schema.string({ minLength: 1 }),
          messages: schema.arrayOf(
            schema.object({
              role: schema.oneOf([
                schema.literal('system'),
                schema.literal('user'),
                schema.literal('assistant'),
                schema.literal('tool'),
              ]),
              content: schema.string(),
              // Present on assistant messages that invoked tools; round-trips the orchestration
              // loop below appends are per-request only and never echoed back by the client today
              // (chat-page.tsx only sends {role, content}), but the wire contract carries them.
              toolCalls: schema.maybe(
                schema.arrayOf(
                  schema.object({
                    id: schema.string(),
                    name: schema.string(),
                    arguments: schema.recordOf(schema.string(), schema.any()),
                  }),
                ),
              ),
              // Present on role:'tool' messages: which toolCalls[].id this result answers.
              toolCallId: schema.maybe(schema.string()),
            }),
          ),
          // Privacy mode (common/types.ts's
          // `ChatRequest['privacy']`): the pseudonym map is client-held and stateless
          // server-side — `map` reseeds this request's Pseudonymizer, `enabled` is honored only
          // when settings say the user may override the resolved default (see
          // `resolvePrivacyEnabled` below).
          privacy: schema.maybe(
            schema.object({
              enabled: schema.maybe(schema.boolean()),
              map: schema.maybe(
                schema.arrayOf(
                  schema.object({
                    value: schema.string(),
                    pseudonym: schema.string(),
                  }),
                ),
              ),
            }),
          ),
        }),
      },
    },
    async (context, request, response) => {
      const { providerId, messages } = request.body;

      let providerAttributes: StoredProviderAttributes;
      try {
        // The provider type is hidden (security review follow-up), so it is reachable only through
        // a start-contract scoped client with includedHiddenTypes — the plain route-context client
        // (context.core.savedObjects.client) can no longer read it. Mirrors settings.ts's
        // providerClient() and the conversation/assistant-settings scoped-client pattern.
        const providerScopedClient = getSavedObjectsStart().getScopedClient(
          request,
          {
            includedHiddenTypes: [PROVIDER_SAVED_OBJECT_TYPE],
          },
        );
        const stored = await providerScopedClient.get<StoredProviderAttributes>(
          PROVIDER_SAVED_OBJECT_TYPE,
          providerId,
        );
        providerAttributes = stored.attributes;
      } catch (error) {
        logger.error(
          `wazuhAiAssistant: unknown provider ${providerId}: ${describeError(
            error,
          )}`,
        );
        return response.notFound({
          body: { message: `Unknown provider "${providerId}"` },
        });
      }

      // Decrypt-on-read (server/crypto/api-key-cipher.ts): the saved object may hold `enc:v1:`
      // ciphertext (AAD-bound to `providerId`, the id this exact saved object was fetched by
      // above) — anything else (a legacy PLAINTEXT key from a pre-release build) makes decrypt()
      // throw: plaintext keys are never used, the admin must re-enter them. Passing `providerId`
      // here is what makes the substitution-attack detection real for chat: if this saved
      // object's `apiKey` were ever a ciphertext blob copied in from a DIFFERENT provider's row,
      // this call — using THIS provider's own id — would hard-fail rather than silently decrypt
      // to the wrong provider's key. Kept in its own try/catch, separate from the "unknown
      // provider" one above, so a decrypt failure (plaintext value, ciphertext present but
      // no/rotated encryptionKey, or an AAD/id mismatch — all real server misconfigurations, the
      // latter also covering the substitution attack) is never misreported to the client as
      // "unknown provider".
      let providerConfig: ProviderConfig;
      try {
        providerConfig = {
          id: providerId,
          ...providerAttributes,
          apiKey: providerAttributes.apiKey
            ? getApiKeyCipher().decrypt(providerAttributes.apiKey, providerId)
            : providerAttributes.apiKey,
        };
      } catch (error) {
        logger.error(
          `wazuhAiAssistant: failed to decrypt API key for provider ${providerId}: ` +
            describeError(error),
        );
        return response.badRequest({
          body: {
            message:
              'Provider API key could not be decrypted. Check the server encryption key ' +
              'configuration.',
          },
        });
      }

      // getOrCreateAssistantSettings derives its own hidden-type-capable scoped client from
      // `request` internally (server/routes/settings.ts). The plain route-context client above
      // (`context.core.savedObjects.client`, used for the PROVIDER lookup a few lines up) cannot
      // see the hidden `wazuh-ai-assistant-settings` type at all.
      const assistantSettings = await getOrCreateAssistantSettings(request);
      const privacyEnabled = resolvePrivacyEnabled(
        assistantSettings,
        providerId,
        request.body.privacy?.enabled,
      );
      // Constructed unconditionally (cheap, no I/O) but only ever consulted/mutated when
      // `privacyEnabled` — per-request only, never cached at module scope (the "no
      // module-level conversation caches" constraint). Seeded from the client-held map.
      const pseudonymizer = new Pseudonymizer(request.body.privacy?.map ?? []);
      const privacyCtx: PrivacyContext | undefined = privacyEnabled
        ? { pseudonymizer, fieldPolicy: assistantSettings.fieldPolicy }
        : undefined;

      const adapter = getProviderAdapter(providerConfig.type);

      // Concurrent-stream cap: acquired here,
      // right before orchestration actually starts, so a request that never gets this far (unknown
      // provider, undecryptable key -- both already returned above) never consumes a slot at all.
      const streamUser = await resolveChatStreamUser(context, request);
      const acquireResult = acquireStreamSlot(streamUser);
      if (!acquireResult.ok) {
        return response.customError({
          statusCode: 429,
          body: { message: acquireResult.message },
        });
      }
      const releaseStreamSlot = acquireResult.release;

      const controller = new AbortController();

      // If the browser disconnects (tab closed, stop button via connection abort), `aborted$`
      // fires and we cancel the upstream provider fetch instead of letting it run unread.
      // The slot release here closes the one gap `releaseStreamSlotWhenDone`'s finally cannot
      // cover: an abort so early that the response Readable is destroyed before its generator
      // ever starts (an unstarted generator's `.return()` skips the try/finally body entirely).
      // `release()` is idempotent, so on the common abort path — where the generator DID start
      // and its finally also fires — this is a harmless no-op.
      request.events.aborted$.subscribe(() => {
        controller.abort();
        releaseStreamSlot();
      });

      // Computed once and threaded through both the main system prompt and (when the router is
      // enabled) the stage-1 routing prompt, so the two agree on "now" for a single turn.
      const nowIso = new Date().toISOString();

      const initialMessages: ChatMessage[] = [
        // Per-request only: never persisted, never echoed back by the client. Any system message
        // the client itself sent (it doesn't today) is dropped so ours is always the sole one.
        { role: 'system', content: buildSystemPrompt(nowIso) },
        ...messages.filter(message => message.role !== 'system'),
      ];

      // `response.ok(...)` MUST stay inside this try. The acquired slot is released on three
      // paths: the generator's own `finally` (`releaseStreamSlotWhenDone`), the `aborted$`
      // subscription, and a throw out of this block. If response construction were to throw from
      // outside the try — or the framework never consumed the returned `Readable` — the slot would
      // never be released and both the per-user and global caps would shrink by one permanently.
      // `release()` is idempotent (see its doc comment), so the extra call on the normal path is a
      // no-op.
      let nodeStream: Readable;
      try {
        const orchestrationEvents = orchestrate(
          adapter,
          providerConfig,
          initialMessages,
          nowIso,
          controller.signal,
          context,
          request,
          logger,
          privacyCtx,
        );
        nodeStream = Readable.from(
          releaseStreamSlotWhenDone(
            streamSseFrames(orchestrationEvents, logger),
            releaseStreamSlot,
          ),
          { objectMode: false },
        );

        return response.ok({
          headers: {
            'Content-Type': 'text/event-stream',
            Connection: 'keep-alive',
            'Cache-Control': 'no-cache',
            'Content-Encoding': 'identity',
            'X-Accel-Buffering': 'no',
          },
          body: nodeStream,
        });
      } catch (error) {
        // Defensive: nothing above is expected to throw synchronously (constructing generators,
        // `Readable.from`, and `response.ok` all do no I/O), but if any of them ever does, the
        // acquired slot must not leak just because the stream/response never got constructed --
        // `releaseStreamSlotWhenDone`'s finally never gets a chance to run in that case, so
        // release it explicitly here instead.
        releaseStreamSlot();
        throw error;
      }
    },
  );
}

/**
 * What `runStage1Routing` resolves to once its (internal-only) adapter stream ends. Exported
 * (along with `runStage1Routing` itself, below) for unit testing only -- see
 * chat-stage1-usage.test.ts, which drives it with a fake `ProviderAdapter` to prove stage 1's
 * `usage` actually threads through to this result, rather than only proving the pure accumulator
 * sums correctly (chat-usage.test.ts) or reading the fix by inspection (issue 8875).
 */
export interface Stage1Result {
  /**
   * Never empty and never `undefined` — `resolveStage2Tools` (server/tools/router.ts) always
   * resolves at least a minimal recovery set (`get_security_summary` + `search_wazuh_data`) even
   * when the model routed to `general` alone, so a stage-1 misclassification is recoverable
   * mid-turn rather than leaving the round with no tools at all.
   */
  tools: ToolSpec[];
  /**
   * Usage this stage-1 call itself spent (~760 tokens observed), so `orchestrate` can fold it into
   * the turn's total instead of discarding it — stage 1 runs its own adapter stream entirely
   * outside the round loop below and, before this field existed, its `done`/usage was consumed and
   * dropped right here, undercounting every routed turn by however much stage 1 cost (issue
   * 8875). `undefined` on every fallback path that returns before a `done` event is ever read
   * (signal-aborted, a stage-1 `error`, no/invalid route_question call — see the early `return`s
   * below): there is nothing to report for those, and `addUsage` (chat-usage.ts) treats `undefined`
   * as contributing zero rather than resetting the total.
   */
  usage?: StreamUsage;
}

/**
 * Stage 1 of the two-stage router: one bounded, internal-only
 * adapter stream read using `ROUTE_QUESTION_TOOL` as the sole tool with `toolChoice:{name:...}`
 * (a specific-tool choice, not `'required'` — vLLM compat). Never yields a
 * `tool_call` event for `route_question` and never runs it through `executeToolCall`: the model's
 * pick is consumed here and translated into a stage-2 tool list instead. Every fallback path —
 * including a stage-1 `error` event (e.g. a malformed `route_question` call, or the provider
 * itself erroring) — degrades to the full catalog (`listToolSpecs()`) rather than a dead turn, per
 * the kill-switch rule below: the error is logged, not forwarded, and the turn continues into the normal round
 * loop below with the full catalog; if the provider is genuinely down, round 0 surfaces that to
 * the user the ordinary way.
 */
export async function* runStage1Routing(
  adapter: ProviderAdapter,
  providerConfig: ProviderConfig,
  initialMessages: ChatMessage[],
  nowIso: string,
  signal: AbortSignal,
  logger: Logger,
  privacyCtx: PrivacyContext | undefined,
): AsyncGenerator<StreamEvent, Stage1Result, void> {
  const stage1Messages: ChatMessage[] = [
    { role: 'system', content: buildRoutingPrompt(nowIso) },
    ...initialMessages.filter(message => message.role !== 'system'),
  ];
  // Outbound scrub: stage 1 is its own adapter.chatStream call, so it needs the same
  // real->pseudonym pass as every round of the main loop below.
  const outboundStage1Messages = privacyCtx
    ? scrubMessagesForProvider(stage1Messages, privacyCtx.pseudonymizer)
    : stage1Messages;

  yield { type: 'status', message: 'Routing…' };

  let sawRouteCall = false;
  let routeArgs: Record<string, unknown> | undefined;
  // Only ever set from the 'done' branch below — every return path ABOVE that point (signal
  // aborted mid-stream, a stage-1 'error') never saw a 'done' at all, so `undefined` there
  // correctly reports "nothing to add" rather than a fabricated cost.
  let stage1Usage: StreamUsage | undefined;

  for await (const event of adapter.chatStream(
    providerConfig,
    outboundStage1Messages,
    signal,
    {
      tools: [ROUTE_QUESTION_TOOL],
      toolChoice: { name: ROUTE_QUESTION_TOOL.name },
      // Stage 1's only job is one structured pick out of a fixed enum (route_question's
      // categories) — the lowest temperature Groq's tool-use guidance names (issue
      // 05-set-temperature-for-tool-calls.md) is the right setting for that, not a range.
      temperature: 0,
    },
  )) {
    if (signal.aborted) {
      return { tools: listToolSpecs() };
    }

    if (event.type === 'tool_call') {
      // Router-internal: never forwarded as an SSE tool_call event, and never executed.
      if (event.toolCall.name === ROUTE_QUESTION_TOOL.name) {
        sawRouteCall = true;
        routeArgs = event.toolCall.arguments;
      }
      continue;
    }
    if (event.type === 'error') {
      // Never forward this — a stage-1 failure must not produce a dead turn. The adapter's own retry layer already
      // handled transient 429s before surfacing this, so a stage-1 error here means something more
      // structural (e.g. a malformed route_question call), not something the user can retry.
      // Log it and fall back to the full catalog, same as every other stage-1 fallback path below;
      // if the provider is genuinely down, round 0 of the main loop will surface that normally.
      logger.debug(
        `wazuhAiAssistant: stage-1 router errored (${event.message}); falling back to the full tool catalog for this turn.`,
      );
      return { tools: listToolSpecs() };
    }
    if (event.type === 'done') {
      stage1Usage = event.usage;
      break;
    }
    // Any stray 'delta'/'table' from a misbehaving stage-1 call: stage 1 must never leak partial
    // text/tables to the browser, so these are deliberately swallowed.
  }

  if (!sawRouteCall || !routeArgs) {
    logger.debug(
      'wazuhAiAssistant: stage-1 router produced no route_question call; falling back to the full tool catalog for this turn.',
    );
    // The call still happened and still cost tokens even though the model never called
    // route_question -- report `stage1Usage` (from the 'done' just seen above) rather than
    // discarding it just because the fallback path is the full catalog.
    return { tools: listToolSpecs(), usage: stage1Usage };
  }

  const validation = validate(routeArgs, ROUTE_QUESTION_TOOL.parameters);
  if (!validation.ok) {
    logger.debug(
      `wazuhAiAssistant: stage-1 router returned invalid route_question arguments (${validation.errors.join(
        '; ',
      )}); falling back to the full tool catalog for this turn.`,
    );
    return { tools: listToolSpecs(), usage: stage1Usage };
  }

  const categories = validation.value.categories;
  if (!Array.isArray(categories) || categories.length === 0) {
    logger.debug(
      'wazuhAiAssistant: stage-1 router returned no categories; falling back to the full tool catalog for this turn.',
    );
    return { tools: listToolSpecs(), usage: stage1Usage };
  }

  return {
    tools: resolveStage2Tools(categories as string[]),
    usage: stage1Usage,
  };
}

/**
 * Orchestration loop: drives the adapter through up to `MAX_TOOL_ROUNDS` tool rounds,
 * executing every `tool_call` the model emits locally (validate -> guardrails -> execute -> emit
 * `table` -> append `tool_result`) before re-invoking the adapter with the grown message history.
 * After the round budget is spent, one final round runs with tools disabled so the model always
 * has a chance to close out the turn with a plain-text answer instead of being cut off mid-use.
 *
 * When `ROUTER_ENABLED` (server/tools/router.ts), a stage-1 preamble runs first — its own bounded
 * adapter stream read, entirely before this loop starts and NOT counted against
 * `MAX_TOOL_ROUNDS` — to resolve a routed, category-scoped tool list that
 * then stays FIXED for every round of this turn (no mid-turn re-route, same decision). When the
 * router is disabled, `tools` is `listToolSpecs()` unconditionally: byte-for-byte today's
 * behavior, which keeps the kill-switch path trivially auditable.
 *
 * When the adapter declares `supportsTools === false` (server/providers/types.ts), stage 1 is
 * skipped outright and `tools` is left `undefined` for every round: that adapter's `chatStream`
 * never does anything with tool options, so routing to a tool list — full catalog or otherwise —
 * would only ever be discarded work.
 *
 * Table-suppression (markdown-table-filter.ts): `sawNonEmptyTable` tracks
 * whether a non-empty `table` event has been emitted yet THIS turn — it flips to `true` the
 * moment this loop's own tool execution yields one. Only once true does a round's delta text get
 * run through a `MarkdownTableSuppressor` — before that, there is nothing on-screen yet for a
 * hand-built table to duplicate.
 */
async function* orchestrate(
  adapter: ProviderAdapter,
  providerConfig: ProviderConfig,
  initialMessages: ChatMessage[],
  nowIso: string,
  signal: AbortSignal,
  context: RequestHandlerContext,
  request: OpenSearchDashboardsRequest,
  logger: Logger,
  privacyCtx: PrivacyContext | undefined,
): AsyncGenerator<StreamEvent> {
  let tools: ToolSpec[] | undefined = listToolSpecs();
  let messages = initialMessages;
  let sawNonEmptyTable = false;
  // Whole-turn guards (not per-round, unlike `sawToolCall` below which resets every round): true
  // once ANY delta text / tool call has happened THIS TURN, across every round — see
  // NO_ANALYSIS_TEXT_MESSAGE/NO_MATCHING_RESULTS_MESSAGE/NO_ANSWER_MESSAGE above. `toolUsedThisTurn`
  // now only picks WHICH fallback copy fits (tables-oriented vs. the generic one) — every no-text
  // ending gets *some* fallback text; see the `!sawAnyDelta` branches below. It no longer gates
  // whether a fallback fires at all: a plain no-tool conversational turn that ends with no text is
  // exactly the case a `general`-routed reasoning-only stream produces (issue
  // 02-read-reasoning-delta.md), and it deserves a sentence, not a silently empty bubble.
  let sawAnyDelta = false;
  let toolUsedThisTurn = false;
  // Sum of every provider call's `usage` THIS TURN — the stage-1 routing call (if the router ran)
  // plus every round of the loop below, INCLUDING non-final rounds whose `done` is otherwise
  // suppressed (see the round loop's `if (sawToolCall) { break; }`). Without this, only the last
  // round's usage ever reached the client (issue 8875, measured 6,409 reported vs. ~12,740 actual
  // on a multi-round turn). This accumulator itself was always correct; the actual defect was one
  // level down, in openai-compatible.ts, never handing it a non-zero usage for any call that ended
  // in a tool call (every non-final round, and the stage-1 call above, unconditionally) -- see that
  // file's `toolCallsFinalized` handling. See chat-usage.ts for why the accumulator helper itself
  // lives in its own dependency-free module.
  let usageTotals = ZERO_USAGE_TOTALS;

  /** Yields a `privacy_map` event for any pseudonym entries minted so far this turn, but only
   * once total ("once per turn... when newEntries() is non-empty") — guarded
   * by this flag since both the stage-1 detour and the main round loop below reach a `done` exit
   * path and either could be the one that ends the turn. */
  let privacyMapEmitted = false;
  function* emitPrivacyMapOnce(): Generator<StreamEvent> {
    if (!privacyCtx || privacyMapEmitted) {
      return;
    }
    const entries: PseudonymEntry[] = privacyCtx.pseudonymizer.newEntries();
    if (entries.length > 0) {
      privacyMapEmitted = true;
      yield { type: 'privacy_map', entries };
    }
  }

  if (adapter.supportsTools === false) {
    // Transport capability (server/providers/types.ts): this adapter's chatStream ignores tool
    // options entirely, so a stage-1 routing call would run, get its answer discarded, and still
    // fall back to a tool list nothing will ever use — skip both and pass no tools this turn.
    tools = undefined;
  } else if (ROUTER_ENABLED) {
    const stage1 = runStage1Routing(
      adapter,
      providerConfig,
      initialMessages,
      nowIso,
      signal,
      logger,
      privacyCtx,
    );
    let step = await stage1.next();
    while (!step.done) {
      if (signal.aborted) {
        return;
      }
      yield step.value;
      // eslint-disable-next-line no-await-in-loop -- generator steps are sequential by contract
      step = await stage1.next();
    }
    tools = step.value.tools;
    usageTotals = addUsage(usageTotals, step.value.usage);
  }

  // Graceful-failure handoff (server/tools/suggest-discover-query.ts): offered ALONGSIDE the real
  // stage-2 tools, on every round that offers tools at all — same reasoning as `supportsTools ===
  // false` above skipping it too: an adapter whose `chatStream` ignores `tools` entirely would
  // never call it, so there is nothing to append to when `tools` is `undefined`.
  if (tools) {
    tools = [...tools, SUGGEST_DISCOVER_QUERY_TOOL];
  }

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
    if (signal.aborted) {
      return;
    }

    const isFinalRound = round === MAX_TOOL_ROUNDS;
    // Final round: omit `tools` entirely rather than send `{tools, toolChoice: 'none'}`. That hint
    // depends on the model complying with it — Groq's own docs warn some models call a tool anyway
    // and the API then 400s ("Tool choice is none, but model called a tool"), observed on
    // openai/gpt-oss-120b in 1 of 3 runs (issue 03-tool-choice-none-final-round.md). With no tools
    // offered there is nothing to call and no compliance to depend on: the adapter's own
    // `if (options?.tools?.length)` guard (openai-compatible.ts/anthropic.ts) already omits
    // `tools`/`tool_choice` from the wire body whenever `tools` is empty/undefined, so this is a
    // structural terminator instead of a request-level one.
    const streamOptions: ChatStreamOptions = isFinalRound
      ? {}
      : {
          tools,
          toolChoice: 'auto',
          // Tool-bearing round: keep sampling low, per Groq's tool-use guidance (0.0-0.5), since a
          // high default temperature (Groq's is 1.0) is a documented contributing cause of
          // malformed tool calls (issue 05-set-temperature-for-tool-calls.md). Only set when this
          // round actually offers tools (`tools` is `undefined` on a `general`-routed, no-tool
          // turn) — a plain-prose round has no structured output to protect and no reason to
          // deviate from the provider's own default.
          ...(tools?.length ? { temperature: 0.2 } : {}),
        };

    // Outbound scrub: a fresh transformed COPY per round — `messages` itself keeps
    // accumulating unscrubbed below so later rounds re-scrub from the same source of truth.
    const outboundMessages = privacyCtx
      ? scrubMessagesForProvider(messages, privacyCtx.pseudonymizer)
      : messages;
    // Inbound un-scrub: this is why the ANSWER the analyst reads carries real hostnames/IPs even
    // with privacy mode on — every delta is run back through the pseudonym map here, so `HOST_1`
    // becomes the real hostname again before it leaves the server. Pseudonyms exist for the provider
    // request above, not for the reader (issue #8821; the field policy's boundaries are spelled out
    // in server/tools/privacy.ts's module header).
    //
    // The streaming holdback is scoped to ONE adapter stream read: recreated every round so a
    // round that ends via tool_call/done/error always starts its successor with an empty buffer.
    const depseudonymizer = privacyCtx
      ? new StreamDepseudonymizer(privacyCtx.pseudonymizer)
      : undefined;

    // Table-suppression (markdown-table-filter.ts): scoped to ONE adapter stream read, same
    // lifecycle as `depseudonymizer` above — recreated every round (`let`, not `const`: this
    // round's OWN tool call can flip `sawNonEmptyTable` to true partway through, in which case it
    // is lazily instantiated right there instead of at the top of the round).
    let tableSuppressor: MarkdownTableSuppressor | undefined = sawNonEmptyTable
      ? new MarkdownTableSuppressor()
      : undefined;

    /** Flushes both per-round text transforms in the correct order — the depseudonymizer's
     * leftover buffer is itself fed through the table suppressor (not yielded raw) before the
     * table suppressor's own remainder is released — then returns whatever text is now safe to
     * emit. Used at every exit point of the stream read below (tool_call/done/error). */
    function drainRoundBuffers(): string {
      let text = depseudonymizer ? depseudonymizer.flush() : '';
      if (tableSuppressor) {
        text = tableSuppressor.push(text) + tableSuppressor.flush();
      }
      return text;
    }

    let sawToolCall = false;
    let ended = false;

    // eslint-disable-next-line no-await-in-loop -- provider events must be consumed strictly in stream order
    for await (const event of adapter.chatStream(
      providerConfig,
      outboundMessages,
      signal,
      streamOptions,
    )) {
      if (event.type === 'delta') {
        let content = depseudonymizer
          ? depseudonymizer.push(event.content)
          : event.content;
        if (content && tableSuppressor) {
          content = tableSuppressor.push(content);
        }
        if (content) {
          if (hasMeaningfulText(content)) {
            sawAnyDelta = true;
          }
          yield { type: 'delta', content };
        }
        continue;
      }

      if (event.type === 'tool_call') {
        sawToolCall = true;
        if (signal.aborted) {
          return;
        }
        {
          // Flush before 'tool_call': whatever text preceded the call must be fully
          // resolved before the round moves on.
          const trailing = drainRoundBuffers();
          if (trailing) {
            if (hasMeaningfulText(trailing)) {
              sawAnyDelta = true;
            }
            yield { type: 'delta', content: trailing };
          }
        }

        // Graceful-failure handoff (server/tools/suggest-discover-query.ts, issue
        // 13-suggested-query-discover-handoff.md): intercepted HERE, before any real tool
        // execution below, because this is not a data tool — it never touches the Indexer/Manager
        // API and must never be run through `executeToolCall`, same reasoning as
        // `ROUTE_QUESTION_TOOL` in `runStage1Routing` above. `toolUsedThisTurn` is deliberately NOT
        // set for this branch (unlike the real-tool path below): it exists only to pick between
        // the two TABLE-oriented no-text fallbacks, and this tool never renders a table, so a turn
        // that calls ONLY this and then produces no text should not fall back to table-flavored
        // copy (see noTextFallbackMessage's doc comment).
        if (event.toolCall.name === SUGGEST_DISCOVER_QUERY_TOOL.name) {
          // Inbound args are pseudonym-form on the wire, same as every other tool call — reverse
          // before validating/using them (the index/reason text may legitimately name a real
          // hostname the model is discussing).
          const realSuggestArgs = privacyCtx
            ? privacyCtx.pseudonymizer.reverseObject(event.toolCall.arguments)
            : event.toolCall.arguments;
          const validation = validateSuggestDiscoverQueryArgs(realSuggestArgs);

          let toolResultContent: string;
          if (!validation.ok) {
            // Bounded self-correction, same contract as every other tool: the model sees exactly
            // why its call was rejected and can retry with corrected arguments.
            toolResultContent = JSON.stringify({ error: validation.reason });
          } else {
            const resolvedDsl = await resolveSuggestedDsl(
              context,
              validation.index,
              validation.dsl,
              logger,
            );
            yield {
              type: 'suggested_query',
              index: validation.index,
              dsl: resolvedDsl,
              reason: validation.reason,
            };
            toolResultContent = JSON.stringify({
              shown: true,
              note:
                'The suggested query was shown to the user as an "Open in Discover" link. Now ' +
                'tell the user plainly, in your own words, what you could not check and why — do ' +
                'not repeat the query itself, the link already shows it.',
            });
          }

          messages = [
            ...messages,
            // ORIGINAL (pseudonym-form) toolCall — wire consistency, same as the real-tool path.
            { role: 'assistant', content: '', toolCalls: [event.toolCall] },
            {
              role: 'tool',
              toolCallId: event.toolCall.id,
              content: toolResultContent,
            },
          ];
          continue;
        }

        toolUsedThisTurn = true;

        // Inbound tool args: the model only ever saw pseudonyms, so `event.toolCall.arguments`
        // is pseudonym-form as emitted — reverse it to real values before validation/execution (the
        // real query needs the real hostname/IP/username), but keep `event.toolCall` itself
        // (pseudonym-form) for the provider-bound history append below (wire consistency: the
        // model must see its own tool_use echoed back exactly as it produced it).
        const realArguments = privacyCtx
          ? privacyCtx.pseudonymizer.reverseObject(event.toolCall.arguments)
          : event.toolCall.arguments;
        const toolCallForClient: ToolCall = {
          ...event.toolCall,
          arguments: realArguments,
        };

        // Forwarded for transparency and for the eval harness: which tool ran, with which
        // arguments. The UI currently ignores it (unknown types fall through in chat-page.tsx).
        // Carries the REVERSED (real) args: local display is trusted.
        yield { type: 'tool_call', toolCall: toolCallForClient };

        yield { type: 'status', message: 'Querying Wazuh…' };

        let outcome: ToolExecutionOutcome;
        try {
          outcome = await executeToolCall(
            toolCallForClient,
            context,
            request,
            privacyCtx,
          );
        } catch (error) {
          // executeToolCall is designed to never throw; this is a last-resort safety net so a
          // bug there degrades to a bounded tool_result error instead of crashing the stream.
          logger.error(
            `wazuhAiAssistant: tool execution crashed: ${describeError(error)}`,
          );
          outcome = {
            toolResultContent: JSON.stringify({
              error: 'Internal tool execution error.',
            }),
          };
        }

        if (outcome.tableEvent) {
          yield outcome.tableEvent;
          if (outcome.tableEvent.spec.rows.length > 0) {
            // Table-suppression activation (markdown-table-filter.ts): from this point on in the
            // turn, a duplicate hand-built table in the model's own narration is redundant with
            // what the browser just rendered — lazily instantiate here (rather than wait for the
            // top of the next round) so it also catches any trailing delta text the model emits
            // in THIS SAME round's stream, after this tool_call, before 'done'.
            sawNonEmptyTable = true;
            if (!tableSuppressor) {
              tableSuppressor = new MarkdownTableSuppressor();
            }
          }
          // Digest-in-history (E): the bounded digest the model will actually see for this call
          // (pseudonym-form when privacy is on, since `outcome.toolResultContent` already passed
          // through applyFieldPolicy inside executeToolCall) — lets the client reconstruct this
          // exact [assistant{toolCalls}, tool{content}] pair as history on a later turn.
          yield {
            type: 'digest',
            toolCallId: event.toolCall.id,
            content: outcome.toolResultContent,
          };
        }

        messages = [
          ...messages,
          // ORIGINAL (pseudonym-form) toolCall, not toolCallForClient — wire consistency.
          { role: 'assistant', content: '', toolCalls: [event.toolCall] },
          {
            role: 'tool',
            toolCallId: event.toolCall.id,
            content: outcome.toolResultContent,
          },
        ];
        continue;
      }

      if (event.type === 'done') {
        {
          const trailing = drainRoundBuffers();
          if (trailing) {
            if (hasMeaningfulText(trailing)) {
              sawAnyDelta = true;
            }
            yield { type: 'delta', content: trailing };
          }
        }
        // Accumulate BEFORE the sawToolCall branch below: a non-final round's 'done' is suppressed
        // (never forwarded to the client) but its usage was still real spend for this turn and must
        // not be dropped — this is the exact bug issue 8875 describes (only the LAST round's usage
        // reached the client).
        usageTotals = addUsage(usageTotals, event.usage);
        if (sawToolCall) {
          // More rounds needed: suppress this 'done' (the turn isn't over) and start the next
          // round with the grown message history instead of ending the SSE stream here.
          break;
        }
        // The turn is genuinely over (this round made no tool call) and the model never produced
        // any text at all — see NO_ANALYSIS_TEXT_MESSAGE/NO_ANSWER_MESSAGE's doc comments. Which
        // copy fits depends on whether a tool ran earlier this turn; if none did, there is no
        // table and no query to reference, so NO_ANSWER_MESSAGE is used instead.
        if (!sawAnyDelta) {
          yield {
            type: 'delta',
            content: noTextFallbackMessage(toolUsedThisTurn, sawNonEmptyTable),
          };
        }
        yield* emitPrivacyMapOnce();
        // The SUM across every round (and stage 1) this turn made, not this round's own
        // `event.usage` alone — see `usageTotals`'s doc comment above.
        yield { type: 'done', usage: toStreamUsage(usageTotals) };
        ended = true;
        break;
      }

      if (event.type === 'error') {
        {
          const trailing = drainRoundBuffers();
          if (trailing) {
            yield { type: 'delta', content: trailing };
          }
        }
        yield event;
        ended = true;
        break;
      }

      // status / table: forward as-is.
      yield event;
    }

    if (ended) {
      return;
    }
    if (!sawToolCall) {
      // Defensive: the adapter's stream ended without a 'done'/'error'/tool_call (shouldn't
      // happen per the adapter contract) — don't spin forever.
      return;
    }
  }

  // Exhausted the round budget and the forced-final (no-tools) round still didn't end cleanly
  // above; close the SSE stream rather than hang the client. Same widened no-text guard as the
  // main 'done' branch above — a model that never produced text deserves a written answer, not a
  // bare done, regardless of whether a tool ran.
  if (!sawAnyDelta) {
    yield {
      type: 'delta',
      content: noTextFallbackMessage(toolUsedThisTurn, sawNonEmptyTable),
    };
  }
  yield* emitPrivacyMapOnce();
  yield { type: 'done', usage: toStreamUsage(usageTotals) };
}

/** Bridges the orchestration loop's AsyncGenerator<StreamEvent> into SSE frame strings. */
async function* streamSseFrames(
  events: AsyncIterable<StreamEvent>,
  logger: Logger,
): AsyncGenerator<string> {
  try {
    for await (const event of events) {
      yield toSseFrame(event);
      if (event.type === 'done' || event.type === 'error') {
        return;
      }
    }
  } catch (error) {
    logger.error(
      `wazuhAiAssistant: chat stream failed: ${describeError(error)}`,
    );
    yield toSseFrame({
      type: 'error',
      message: 'Internal error while streaming the response.',
    });
  }
}
