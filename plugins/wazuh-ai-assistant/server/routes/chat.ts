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

/**
 * CAPABILITY-DENIAL GUARD, deterministic half (issue #8920 item 4/9 -- see prompts.ts's
 * buildSystemPrompt for the UNGUARANTEED prompt-level half of this same guard). A failed tool call
 * is just a `role:'tool'` message the model reads like any other -- nothing stops it from
 * misreading "this call failed" as "Wazuh/this assistant cannot do this at all", and that
 * conclusion is wrong far more often than not (a bad argument, a guardrail rejection, a transient
 * error are all correctable-or-retryable, not evidence of a missing capability). This fixed
 * sentence is appended to the RESULT itself, at the exact moment a failure enters the model's
 * context -- a locality no system prompt can give, since the prompt is written once per turn and
 * this fires per failed call. It is delivery, not obedience: whether the model actually follows the
 * instruction remains model-side and is NOT guaranteed by this code.
 */
export const CAPABILITY_DENIAL_NOTE =
  'This is a failed query or tool call, not evidence of a missing product capability. Do not ' +
  'tell the user the product or its tools cannot provide something because of this failure -- ' +
  'correct the call, try another tool, or use suggest_discover_query.';

/**
 * Applies CAPABILITY_DENIAL_NOTE to any tool-result content shaped like `{error: string, ...}` --
 * a no-op for anything else (a successful digest, the suggest_discover_query "shown"
 * acknowledgment, unparseable content). Kept as ONE shape-driven helper rather than a per-branch
 * decision so every current and future tool-result error inherits the note automatically,
 * regardless of which of validation/guardrail-rejection/execution-failure produced it -- they all
 * resolve to this same `{error}` shape before reaching here (see executor.ts's `executeToolCall`
 * doc comment: "never throws... resolves to a toolErrorContent string").
 */
export function augmentToolError(content: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return content;
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    Array.isArray(parsed) ||
    typeof (parsed as Record<string, unknown>).error !== 'string'
  ) {
    return content;
  }
  return JSON.stringify({
    ...(parsed as Record<string, unknown>),
    note: CAPABILITY_DENIAL_NOTE,
  });
}

/** Server-appended when a `suggested_query` event's DSL lost field-level filters relative to what
 * the model asked to show (an unverifiable index, a failed `_field_caps` check, or a second
 * unknown-fields failure this turn -- see `resolveSuggestedDsl`'s `SuggestedDslResolution`).
 * Closes the "prose promises a field filter, DSL carries only @timestamp" dishonesty (issue #8920
 * item 9): the emitted `reason` must NEVER silently diverge from what the emitted `dsl` actually
 * contains, so whenever the strip happens, the reason ALWAYS says so, deterministically -- this is
 * not a prompt instruction the model could omit. */
const SUGGESTED_QUERY_FIELDS_STRIPPED_DISCLOSURE =
  ' (Note: the suggested field filters could not be verified against this index, so the link ' +
  'opens with a time-range-only query.)';

/** Appended IN ADDITION to the strip disclosure when the model's DSL carried no readable time
 * range either, so the stripped link opens the DEFAULT 24-hour window rather than a window the
 * model chose — without this, the tool's own primary use case ("a time range beyond the 90-day
 * maximum") could promise a long window while the link silently opens 24 hours. */
const SUGGESTED_QUERY_WINDOW_DEFAULTED_DISCLOSURE =
  ' (The suggested time window could not be read either, so the link opens the last 24 hours — ' +
  'adjust the time picker in Discover.)';

/** Appended when the model's `reason` prose names REAL index fields its own DSL never filters on
 * (resolveSuggestedDsl's `reasonFieldsNotFiltered`) — the reason and the link must never silently
 * promise different things, issue #8920 item 9's literal witness ("the field named in the prose
 * was not filtered on at all"), covered here for the MODEL-authored case that no strip ever
 * touches. */
function suggestedQueryReasonMismatchDisclosure(fields: string[]): string {
  return (
    ` (Note: the linked query does not itself filter on ${fields.join(
      ', ',
    )} — it opens a ` + 'broader view; narrow it in Discover.)'
  );
}

interface StoredProviderAttributes {
  name: string;
  type: ProviderConfig['type'];
  baseUrl: string;
  model: string;
  apiKey?: string;
}

/** Bounded tool rounds per turn; a final no-tools round follows to close out the answer.
 * Exported so tests can derive round-budget-dependent scripts from it (see
 * chat-capability-honesty.test.ts's last-tool-bearing-round test) instead of hardcoding the
 * round count, which would silently start testing a different round on any budget change. */
export const MAX_TOOL_ROUNDS = 3;

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
 * Variant of NO_ANALYSIS_TEXT_MESSAGE for a turn that exhausted its tool-round budget (a serial
 * chain deeper than MAX_TOOL_ROUNDS) and still produced no text even after
 * FINAL_ROUND_ANSWER_INSTRUCTION asked for one. Named explicitly rather than folded into the
 * generic copy above: the results table IS non-empty here, but it reflects only as far as the
 * chain got, not the full answer, so the user should know a step was left unreached.
 */
const NO_ANALYSIS_ROUNDS_EXHAUSTED_MESSAGE =
  'The tool-round budget for this turn ran out before a full answer could be written. See the ' +
  'results above for what was found so far — a follow-up question can continue from there.';
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

/**
 * Appended to the FINAL round's outbound messages when the turn ran at least one tool (issue
 * #8893) — see the append site in `orchestrate` below for the measurement and for why it goes on
 * the outbound copy only. This is the request for a conclusion that dropping `tools` does not by
 * itself make.
 *
 * Every clause is load-bearing, so edit with care:
 *  - "using only the tool results already gathered" and "Do not state anything the results do not
 *    show" keep this from becoming a fabrication prompt. Asking a model to produce an answer it
 *    could not support is exactly how invented numbers and agent names appear, and the fallbacks
 *    above exist precisely because an honest silence was preferable to that. The instruction has
 *    to buy analysis WITHOUT buying invention.
 *  - "If they do not answer the question, say so plainly" gives the model a licensed exit, so the
 *    honest outcome stays reachable rather than being squeezed out by the request for text.
 *  - no mention of tools being unavailable: the round already omits `tools` entirely, and naming
 *    the absent capability invites the model to narrate the mechanism ("I cannot query further…")
 *    instead of answering.
 */
export const FINAL_ROUND_ANSWER_INSTRUCTION =
  "Now answer the user's question directly, using only the tool results already gathered in " +
  'this conversation. Do not state anything the results do not show. If they do not answer the ' +
  'question, say so plainly and state what is missing.';

/**
 * Appends FINAL_ROUND_ANSWER_INSTRUCTION to the messages bound for the provider, but only on the
 * final round of a turn that actually ran a tool (issue #8893). Exported for unit testing only —
 * not part of this route's HTTP contract — and kept as a pure function precisely so the decision
 * can be tested without standing up a whole fake `orchestrate` run.
 *
 * Returns the input array UNCHANGED (same reference) when the instruction does not apply, and a
 * fresh array when it does — never mutates the input, which matters because the caller may pass
 * `messages` itself (the turn's accumulating source of truth) when privacy mode is off.
 *
 * Gated on `toolUsedThisTurn`: on a `general`-routed (no-tool) turn the final round IS the whole
 * answer and there are no gathered results to reason over, so the instruction would be a lie.
 * That path's silence is a different defect with its own fix (the reasoning-channel fallback in
 * openai-compatible.ts) and its own fallback copy (NO_ANSWER_MESSAGE above).
 */
export function withFinalRoundAnswerInstruction(
  messages: ChatMessage[],
  isFinalRound: boolean,
  toolUsedThisTurn: boolean,
): ChatMessage[] {
  if (!isFinalRound || !toolUsedThisTurn) {
    return messages;
  }
  return [
    ...messages,
    { role: 'system', content: FINAL_ROUND_ANSWER_INSTRUCTION },
  ];
}

/**
 * Issue #8911: a tool round that produced only rejected/errored calls (no successful digest/table)
 * is, for round-budget purposes, indistinguishable from a productive one — the loop below just
 * keeps decrementing the same `MAX_TOOL_ROUNDS` budget either way. When the model is stuck
 * re-guessing a query shape that can never succeed (e.g. an invented field name field-validation.ts
 * keeps rejecting), that burns the remaining rounds on doomed retries instead of leaving one for the
 * final answer. This decides whether the round just finished should make the NEXT round the final
 * one early — exported (and kept pure, same reasoning as `withFinalRoundAnswerInstruction` above)
 * so the decision is testable without standing up a fake `orchestrate` run.
 *
 * Gated on `hadSuccessfulRoundEarlier`: a first-round total failure keeps its normal retry budget,
 * since the model may legitimately fix its own call (a genuine typo, a first attempt at the escape
 * hatch) — only once at least one EARLIER round in the same turn already succeeded is a further
 * fully-rejected round treated as the model being stuck rather than still converging.
 */
export function shouldEnterFinalRoundEarly(
  roundHadToolCalls: boolean,
  roundHadSuccess: boolean,
  hadSuccessfulRoundEarlier: boolean,
): boolean {
  return roundHadToolCalls && !roundHadSuccess && hadSuccessfulRoundEarlier;
}

/** Picks which of the three no-text fallbacks above fits a turn that ended without any `delta`
 * text — shared by both `!sawAnyDelta` exit points below (the normal per-round `done` branch and
 * the round-budget-exhausted path) so the same three-way decision lives in exactly one place. */
export function noTextFallbackMessage(
  toolUsedThisTurn: boolean,
  sawNonEmptyTable: boolean,
  roundsExhausted: boolean,
): string {
  if (!toolUsedThisTurn) {
    return NO_ANSWER_MESSAGE;
  }
  if (!sawNonEmptyTable) {
    return NO_MATCHING_RESULTS_MESSAGE;
  }
  return roundsExhausted
    ? NO_ANALYSIS_ROUNDS_EXHAUSTED_MESSAGE
    : NO_ANALYSIS_TEXT_MESSAGE;
}

/** Whitespace-only delta content (e.g. a lone "\n\n" some models emit as priming/formatting
 * right before a tool call) must NOT count as "the model produced an answer" — otherwise the
 * `sawAnyDelta` guard above never fires for exactly the turns it exists to catch. Still forwarded
 * to the client as a normal delta either way; this only affects the tracking flag. */
function hasMeaningfulText(content: string): boolean {
  return content.trim().length > 0;
}

/** Sentence boundary for the offer-shape gate: end punctuation followed by whitespace, or a line
 * break. Coarse on purpose -- the gate only needs the offer marker and the tool name to share ONE
 * sentence-ish span, not a full sentence parse. */
const SENTENCE_SPLIT_RE = /(?<=[.!?])\s+|\n+/;

/**
 * Offer-shaped phrasing vocabulary for `findOfferedFollowUpTool` below -- deterministic given the
 * text (a fixed regex over a closed marker list), though the TEXT is model prose, so this narrows
 * false positives rather than proving intent (see the detector's "Residuals" note). Grown from
 * the measured failure ("I can run get_sca_checks ... — want me to?") plus the obvious first-
 * person-offer variants; a miss here degrades to base behaviour, a false hit is what the
 * detector's exclusion gates bound.
 */
const OFFER_MARKER_RE =
  /\b(want me to|should i|shall i|would you like|do you want|i can|i could|i'm happy to|i am happy to|happy to|let me know|say the word|if you(?:'d| would) like)\b/i;

/**
 * Tools `findOfferedFollowUpTool` must never force-call, beyond the suggest-discover pseudo-tool:
 * the free-DSL escape hatch. prompts.ts explicitly instructs the model to OFFER it in prose for
 * fields a typed result lacks, so its name appearing in an offer sentence is designed product
 * behaviour -- see the detector's doc comment. Kept as a Set so a future exemption is one line
 * with its own justification, and pinned by chat-tool-chaining.test.ts (both that the exemption
 * holds and that the name still exists in the registry, so a rename cannot silently void it).
 */
const FORCE_EXEMPT_TOOL_NAMES = new Set(['search_wazuh_data']);

/**
 * DEFERRED-OFFER INTERCEPTION, detection half (issue #8935 item I3 -- see `orchestrate`'s
 * `forcedFollowUpTool`/`forcedFollowUpSpent` for the delivery half). The measured failure this
 * exists for: a turn correctly summarizes a tool's results, then ends the turn asking permission
 * to run an obvious next tool ("I can run get_sca_checks to list the failing checks — want me
 * to?") instead of just running it, even though tool rounds remain unspent. Round-budget answer
 * fixes at the PROMPT layer measured 0/3 on this exact class (see this file's own
 * FINAL_ROUND_ANSWER_INSTRUCTION precedent and issue #8935's cap table) -- this is the
 * deterministic, CODE-level alternative: detect the offer mechanically and force the call via
 * `toolChoice:{name}` rather than ask the model to stop offering.
 *
 * Returns a tool name ONLY when EXACTLY ONE candidate out of `offeredTools` satisfies every gate:
 *  - its bare name appears as a whole word (`\bname\b`) in an OFFER-SHAPED SENTENCE of
 *    `roundText` (a sentence matching `OFFER_MARKER_RE`) -- tool names are the closed `[a-z_]+`
 *    shape every catalog/router tool spec uses (pinned by the registry-name-shape test in
 *    chat-tool-chaining.test.ts), so this is privacy-safe static-vocabulary matching: no
 *    user/Wazuh data ever flows into this regex, only the model's own round text checked against
 *    a fixed list of tool names. Word boundaries are what keep "get_sca_checks_v2" from matching
 *    a search for "get_sca_checks" -- underscore is a `\w` character, so `\b` only matches at an
 *    actual name boundary. The sentence-level offer gate (issue #8935 integration review) is what
 *    keeps a DISMISSIVE mention ("get_vulnerabilities_by_agent would not answer a hardening
 *    question, so I am reporting only SCA") or a bare capability recitation from being
 *    force-called: the measured failure is an offer, and only offer-shaped text may trigger.
 *  - it is one of THIS TURN's offered `tools` (the stage-1-routed, fixed-for-the-turn list) --
 *    never a tool outside that set, which the model could not call anyway.
 *  - it is NOT `SUGGEST_DISCOVER_QUERY_TOOL` -- that tool exists to carry the model's OWN
 *    reasoning about what it could not verify (server/tools/suggest-discover-query.ts); a handoff
 *    link forced without genuine model intent behind it is junk, not a graceful fallback.
 *  - it is NOT the `search_wazuh_data` escape hatch (`FORCE_EXEMPT_TOOL_NAMES`) -- prompts.ts
 *    ORDERS the model to name that exact tool in prose ("offer to query it with
 *    search_wazuh_data instead of speculating"), so an offer naming it is prompt-mandated
 *    behaviour, not a deferred chain; and it is the strictest-guardrail surface, where a call the
 *    model was compelled into is the likeliest to be rejected on the last tool-bearing round.
 *  - it was NOT already SUCCESSFULLY executed this turn (`executedToolNames`) -- naming a tool
 *    that already produced a result is the model summarizing its own prior work, not deferring a
 *    new one. A REJECTED/errored call deliberately does not exclude (see the add site in
 *    `orchestrate`): "I can retry get_sca_checks with the right policy_id -- want me to?" is the
 *    retry sibling of the measured failure and must stay forceable.
 * The EXACTLY-ONE gate is what makes this deterministic and false-positive-resistant: a model
 * reciting its available capabilities in one offer sentence ("I can also run get_sca_checks,
 * get_agent_vulnerabilities, or search_wazuh_data") names several tools in one breath and must
 * NOT be force-called into an arbitrary one of them -- the measured failure this fixes named
 * exactly one tool. A listing is therefore left alone and the turn terminates normally.
 *
 * Residuals, stated honestly: (a) an offer that never NAMES a tool ("I can query the details
 * further") is undetectable at this layer -- the measured 0/3 failure named `get_sca_checks`
 * verbatim, so this covers the witnessed class, not every conceivable phrasing of "want me to?";
 * (b) `OFFER_MARKER_RE` is a finite vocabulary over the model's own prose, so an unusual offer
 * phrasing simply degrades to base behaviour (the turn ends on the offer) -- the trigger is
 * end-to-end only as deterministic as the text it reads, which is why the DELIVERY half
 * (`toolChoice: {name}`) is the part this item counts as guaranteed.
 */
export function findOfferedFollowUpTool(
  roundText: string,
  offeredTools: ToolSpec[],
  executedToolNames: ReadonlySet<string>,
): string | undefined {
  const offerSentences = roundText
    .split(SENTENCE_SPLIT_RE)
    .filter(sentence => OFFER_MARKER_RE.test(sentence));
  if (offerSentences.length === 0) {
    return undefined;
  }
  // The EXACTLY-ONE gate counts MENTIONS before any exclusion applies: "I can run get_sca_checks
  // or search_wazuh_data" is a capability LISTING even though one of the two is exempt from
  // forcing -- filtering first and counting second would have collapsed that listing to one
  // "candidate" and force-called it (integration review of this ordering).
  const mentioned = offeredTools.filter(tool => {
    const nameRe = new RegExp(`\\b${tool.name}\\b`);
    return offerSentences.some(sentence => nameRe.test(sentence));
  });
  if (mentioned.length !== 1) {
    return undefined;
  }
  const candidate = mentioned[0];
  if (
    candidate.name === SUGGEST_DISCOVER_QUERY_TOOL.name ||
    FORCE_EXEMPT_TOOL_NAMES.has(candidate.name) ||
    executedToolNames.has(candidate.name)
  ) {
    return undefined;
  }
  return candidate.name;
}

/**
 * Whether a tool-result payload is the bounded error contract (`{error: ...}`) rather than a real
 * result -- the same shape test `augmentToolError` keys on. Used to decide whether a call counts
 * as "executed" for the deferred-offer exclusion; failures must stay forceable (see the doc
 * comment at the `executedToolNames` add site).
 */
function isToolResultError(content: string): boolean {
  try {
    const parsed: unknown = JSON.parse(content);
    return (
      !!parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      typeof (parsed as Record<string, unknown>).error === 'string'
    );
  } catch {
    return false;
  }
}

/**
 * The deferred-offer interception's round-level gate, extracted as a pure function so it is
 * testable without scripting a whole turn (issue #8935 integration review: `forcedFollowUpSpent`
 * is unreachable-as-true under MAX_TOOL_ROUNDS=3 -- only round 1 can ever intercept, and only
 * once -- so no orchestrate-level script can exercise it; as a pure function its bound is pinned
 * directly, and it becomes load-bearing the day the round budget is raised).
 */
export function shouldConsiderDeferredOffer(gate: {
  isFinalRound: boolean;
  round: number;
  maxRounds: number;
  toolUsedThisTurn: boolean;
  forcedFollowUpSpent: boolean;
}): boolean {
  return (
    !gate.isFinalRound &&
    gate.round < gate.maxRounds - 1 &&
    gate.toolUsedThisTurn &&
    !gate.forcedFollowUpSpent
  );
}

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

/**
 * One entry of the `POST /chat` body's `messages` array. Exported (rather than left inline in
 * `registerChatRoutes` below) purely so a schema-drift regression test can validate it directly --
 * same rationale as conversations.ts's own exported `chatMessageSchema`.
 */
export const chatRequestMessageSchema = schema.object({
  role: schema.oneOf([
    schema.literal('system'),
    schema.literal('user'),
    schema.literal('assistant'),
    schema.literal('tool'),
  ]),
  content: schema.string(),
  // Present on assistant messages that invoked tools -- ECHOED BACK by the client on later turns:
  // common/chat-history.ts's `buildOutgoingMessages` resends a prior turn's `exchange.toolCall`
  // objects verbatim as history (required for any provider that validates tool_call/tool_result
  // pairing), so this is not a per-request-only round-trip.
  toolCalls: schema.maybe(
    schema.arrayOf(
      schema.object({
        id: schema.string(),
        name: schema.string(),
        arguments: schema.recordOf(schema.string(), schema.any()),
        // Vendor passthrough (common/types.ts's `ToolCall.vendorExtras`/
        // `functionVendorExtras` — the Gemini `thought_signature` fix): the client
        // replays a prior turn's tool call verbatim (common/chat-history.ts's
        // `buildOutgoingMessages`/`toPersistedMessages`, both resend
        // `exchange.toolCall` whole), so whatever an adapter captured here MUST be
        // accepted back or every replayed call 400s on the very next turn.
        // `@osd/config-schema` rejects unknown keys by default, so these need an
        // explicit (optional) place in the schema even though the server never reads
        // them itself -- only the provider adapter that emitted them does, when this
        // same message round-trips back into `toOpenAiMessage`.
        vendorExtras: schema.maybe(
          schema.recordOf(schema.string(), schema.any()),
        ),
        functionVendorExtras: schema.maybe(
          schema.recordOf(schema.string(), schema.any()),
        ),
      }),
    ),
  ),
  // Present on role:'tool' messages: which toolCalls[].id this result answers.
  toolCallId: schema.maybe(schema.string()),
});

export function registerChatRoutes(router: IRouter, logger: Logger): void {
  router.post(
    {
      path: API_PATHS.CHAT,
      validate: {
        body: schema.object({
          providerId: schema.string({ minLength: 1 }),
          messages: schema.arrayOf(chatRequestMessageSchema),
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
      const assistantSettings = await getOrCreateAssistantSettings(
        request,
        logger,
      );
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
// Exported for unit testing only (chat-capability-honesty.test.ts drives it directly with a fake
// adapter, same pattern as `runStage1Routing`'s own test) -- not part of this route's HTTP
// contract.
export async function* orchestrate(
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
  // Bounds the suggest_discover_query self-correction loop to ONE retry per turn (issue #8920 item
  // 9): the first `unknown_fields` resolution this turn is returned as a tool error instead of a
  // `suggested_query` event, so the model gets one chance to rewrite the call with real field names
  // -- see the `SUGGEST_DISCOVER_QUERY_TOOL.name` branch below. A SECOND `unknown_fields` this turn
  // falls through to the stripped-DSL-plus-disclosure path instead of erroring again: the round
  // budget (MAX_TOOL_ROUNDS) is what actually bounds the loop from spinning forever, but this flag
  // stops it from burning more than one of those rounds on the same self-correction.
  let suggestDiscoverUnknownFieldsRetried = false;
  // DEFERRED-OFFER INTERCEPTION state (issue #8935 item I3; detection half is
  // `findOfferedFollowUpTool` above). `executedToolNames` is every REAL tool this turn ran
  // SUCCESSFULLY (added after execution in the real-tool branch below -- never for a
  // rejected/errored call, never for the routing/suggest_discover_query pseudo-tools) -- it is
  // what lets the detector tell "the model is naming a tool it already used" apart from "the
  // model is deferring a NEW one", including the retry case where the earlier attempt failed.
  // `forcedFollowUpTool`, when set, is consumed by exactly the NEXT round's `streamOptions`
  // (forcing `toolChoice:{name:...}` instead of `'auto'`) and cleared immediately after — so a
  // forced call can only ever happen once per detected offer. `forcedFollowUpSpent` bounds this
  // to ONE forced round per WHOLE TURN (not per offer). HONESTY NOTE (integration review): under
  // the current MAX_TOOL_ROUNDS=3 this flag is redundant with the round-budget gate -- only
  // round 1 can ever intercept, so no turn can reach the check twice -- which is why its bound is
  // pinned through the pure `shouldConsiderDeferredOffer` helper rather than an orchestrate-level
  // script; it becomes load-bearing the day the round budget is raised, mirroring
  // `suggestDiscoverUnknownFieldsRetried` right above.
  //
  // DETERMINISTIC vs NOT (state this honestly, per issue #8935's measured lesson that every
  // code-level fix passed 3/3 while every prompt-level fix failed 0/3): the DETECTION
  // (name-token ∧ offered ∧ unexecuted ∧ exactly-one ∧ round-budget-remaining ∧ once-per-turn) and
  // the DELIVERY (`toolChoice:{name}` is a first-class CanonicalToolChoice already exercised by
  // `runStage1Routing` above -- it forces the provider to emit a call to that exact tool, it
  // cannot instead answer in prose) are both deterministic, code-level guarantees. NOT
  // deterministic: the ARGUMENTS the model fills in for the forced call (it has the policy_id in
  // context from the digest it just summarized, but a bad fill degrades to the ordinary bounded
  // tool-error contract and the turn continues rather than crashing), and whether the model's
  // final narration actually makes good use of the forced tool's result. Those two remain
  // model-side and are not guaranteed by this code.
  const executedToolNames = new Set<string>();
  let forcedFollowUpTool: string | undefined;
  let forcedFollowUpSpent = false;
  // Issue #8911: whole-turn tracking for `shouldEnterFinalRoundEarly` above — `true` once any EARLIER
  // round in this turn had at least one successful (non-rejected/non-errored) tool call, and set
  // when the round loop below should make its NEXT iteration the final round early.
  let hadSuccessfulRoundEarlier = false;
  let forceFinalRoundEarly = false;
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

    // TRUE for exactly the round a deferred-offer interception forced (issue #8935 item I3):
    // read by the 'error' branch and the loop-bottom dead-stream guard below, because a FORCED
    // round must never end the turn worse than the clean termination the suppressed offer-round
    // 'done' would have produced on base -- same recorded policy as stage 1 ("a stage-1 failure
    // must not produce a dead turn").
    const forcedRound = forcedFollowUpTool !== undefined;
    // Issue #8911: `forceFinalRoundEarly` (set at the end of the PREVIOUS round below) short-circuits
    // the normal `round === MAX_TOOL_ROUNDS` budget check once a fully-rejected round has already
    // followed an earlier successful one this turn — see `shouldEnterFinalRoundEarly`'s doc comment.
    const isFinalRound = round === MAX_TOOL_ROUNDS || forceFinalRoundEarly;
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
          // DEFERRED-OFFER INTERCEPTION delivery (issue #8935 item I3): when the PREVIOUS round's
          // 'done' was suppressed because it offered exactly one unexecuted tool by name, this
          // round forces a call to that specific tool instead of leaving the choice to `'auto'` --
          // see `forcedFollowUpTool`'s doc comment above for why this is the deterministic half of
          // the mechanism. Consumed (cleared) immediately below so it can only ever apply to this
          // one round.
          toolChoice: forcedFollowUpTool
            ? { name: forcedFollowUpTool }
            : 'auto',
          // Tool-bearing round: keep sampling low, per Groq's tool-use guidance (0.0-0.5), since a
          // high default temperature (Groq's is 1.0) is a documented contributing cause of
          // malformed tool calls (issue 05-set-temperature-for-tool-calls.md). Only set when this
          // round actually offers tools (`tools` is `undefined` on a `general`-routed, no-tool
          // turn) — a plain-prose round has no structured output to protect and no reason to
          // deviate from the provider's own default.
          ...(tools?.length ? { temperature: 0.2 } : {}),
        };
    // Cleared immediately after building this round's options: a forced follow-up must apply to
    // EXACTLY ONE round, never linger into a later one this variable's own presence didn't cause.
    if (forcedFollowUpTool) {
      forcedFollowUpTool = undefined;
    }

    // Outbound scrub: a fresh transformed COPY per round — `messages` itself keeps
    // accumulating unscrubbed below so later rounds re-scrub from the same source of truth.
    const scrubbedMessages = privacyCtx
      ? scrubMessagesForProvider(messages, privacyCtx.pseudonymizer)
      : messages;
    // Final round of a tool-using turn: ask for the answer (issue #8893). Dropping `tools` above
    // terminates the tool loop, but on its own it only stops the model from CALLING anything — it
    // never asks for a conclusion. The model is handed a transcript of tool results with no
    // outstanding request, so "I already presented the data, nothing to add" is a rational
    // completion rather than a malfunction, and the turn ends with no text at all: measured on
    // openai/gpt-oss-120b over a 40-question analyst-persona bank, 6/40 turns ended on the
    // `!sawAnyDelta` fallback below, every one with the same 4-tool-call signature (the 3
    // tool-bearing rounds this budget allows plus stage 1's own forced `route_question`), and 4 of
    // those 6 had already rendered a NON-EMPTY table — a non-answer sitting directly above real
    // data the user asked to have interpreted.
    //
    // Applied to the outbound COPY only, never to `messages`: this is a per-request nudge, not
    // conversation history, so it must not persist into the saved conversation or be re-sent by a
    // later turn. Applied AFTER the scrub deliberately — it is static first-party text with no user
    // data in it, so there is nothing for the pseudonymizer to find, and running it through would
    // only risk `prescanAndMint` mangling a word in our own copy.
    const outboundMessages = withFinalRoundAnswerInstruction(
      scrubbedMessages,
      isFinalRound,
      toolUsedThisTurn,
    );
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
    // Deferred-offer interception, per-round state (issue #8935 item I3): `roundText` is every
    // delta this round actually yielded to the client (main deltas plus both trailing-buffer
    // flushes), reset fresh each round so a PRIOR round's text can never be mistaken for THIS
    // round's offer. `forcedFollowUp` is set only when this round's 'done' is suppressed to force
    // a follow-up call next round -- it exists solely so the loop-bottom guard below (which
    // otherwise treats any `!sawToolCall` round as a dead adapter stream) does not return early on
    // the ONE round type that legitimately ends with no tool call yet still has a next round.
    let roundText = '';
    let forcedFollowUp = false;
    // TRUE when any delta this round was the adapter's reasoning-channel fallback
    // (openai-compatible.ts's `reasoningFallback`, flagged on the event): that text is raw
    // deliberation shown to the user only because no real answer arrived, and deliberation
    // routinely names exactly one tool the model decided NOT to call -- the interception below
    // must never read it as an offer (issue #8935 integration review).
    let roundHadReasoningFallback = false;
    // Issue #8911: round-scoped (reset every round, unlike the whole-turn flags above) — feeds
    // `shouldEnterFinalRoundEarly` once this round finishes. `roundHadRealToolCall` covers only the
    // real data-tool path below (the one that also sets `toolUsedThisTurn`), deliberately excluding
    // the `SUGGEST_DISCOVER_QUERY_TOOL` handoff — that tool is never rejected by field-validation and
    // never produces a `tableEvent` by design, so counting it here would misread its normal success
    // as a "fully rejected round".
    let roundHadRealToolCall = false;
    let roundHadSuccessfulToolCall = false;

    // eslint-disable-next-line no-await-in-loop -- provider events must be consumed strictly in stream order
    for await (const event of adapter.chatStream(
      providerConfig,
      outboundMessages,
      signal,
      streamOptions,
    )) {
      if (event.type === 'delta') {
        if (event.reasoningFallback) {
          // See `roundHadReasoningFallback`'s declaration: reasoning-channel fallback text still
          // reaches the user (below) but disqualifies this round's text from the deferred-offer
          // interception. Round-level (not per-delta) on purpose: the depseudonymizer/table
          // filters can hold back and later drain parts of a delta, and a drained fragment no
          // longer carries the event flag.
          roundHadReasoningFallback = true;
        }
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
          roundText += content;
          yield { type: 'delta', content };
        }
        continue;
      }

      if (event.type === 'tool_call') {
        sawToolCall = true;
        toolUsedThisTurn = true;
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
            roundText += trailing;
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
            const resolution = await resolveSuggestedDsl(
              context,
              validation.index,
              validation.dsl,
              logger,
              validation.reason,
            );

            // ROUND-AWARE retry gate: converting a correctable resolution into a tool error only
            // helps if a FUTURE tool-bearing round exists to retry in. On the last tool-bearing
            // round (round === MAX_TOOL_ROUNDS - 1) the next round offers no tools at all, so an
            // error here would destroy the handoff entirely (a regression against base, which
            // always showed the stripped link) — fall through to strip-plus-disclose instead.
            const retryRoundAvailable = round < MAX_TOOL_ROUNDS - 1;

            if (
              (resolution.outcome === 'unknown_fields' ||
                resolution.outcome === 'unsupported_clauses') &&
              !suggestDiscoverUnknownFieldsRetried &&
              retryRoundAvailable
            ) {
              // First unknown-fields failure this turn (issue #8920 item 9): do NOT show the
              // suggestion at all -- an invented field name is the MODEL's mistake, and unlike
              // `unverifiable_index` it is plausibly correctable, so this is a bounded
              // self-correction tool error instead, same contract as every other tool. Bounded to
              // ONE retry via `suggestDiscoverUnknownFieldsRetried`: a SECOND unknown-fields
              // resolution this turn falls through to the `else` below instead of erroring again.
              suggestDiscoverUnknownFieldsRetried = true;
              toolResultContent = JSON.stringify({
                error:
                  resolution.outcome === 'unknown_fields'
                    ? 'The suggested query references field(s) that do not exist on ' +
                      `${validation.index}: ${resolution.unknownFields.join(
                        ', ',
                      )}. Rewrite the ` +
                      'suggestion with fields that exist there, or describe the limitation ' +
                      'without naming a field filter.'
                    : 'The suggested query uses clause type(s) whose field names cannot be ' +
                      `verified: ${resolution.clauses.join(
                        ', ',
                      )}. Rewrite the suggestion ` +
                      'using term/terms/match/match_phrase/prefix/range/exists inside a bool ' +
                      'query.',
              });
            } else {
              // 'verified' | 'no_field_filters' | 'unverifiable_index' | an
              // 'unknown_fields'/'unsupported_clauses' whose retry was already spent this turn
              // (or for which no tool-bearing round remains). Whenever the DSL actually shown lost
              // field-level filters relative to what the model asked to show, the disclosure is
              // appended to `reason` DETERMINISTICALLY -- the emitted reason must never promise a
              // filter the emitted DSL does not carry (see
              // SUGGESTED_QUERY_FIELDS_STRIPPED_DISCLOSURE's doc comment above). Written as an
              // exhaustive switch (not a ternary on a derived boolean) so TypeScript's
              // discriminated-union narrowing picks the right DSL field per outcome --
              // the stripped outcomes have no `.dsl`, and 'verified'/'no_field_filters' have no
              // `.strippedDsl`.
              let dsl: Record<string, unknown>;
              let disclosure: string;
              switch (resolution.outcome) {
                case 'verified':
                case 'no_field_filters':
                  dsl = resolution.dsl;
                  // Nothing was stripped — but the model's own prose may still promise a filter
                  // its own DSL never carried (the issue's literal witness); disclose that.
                  disclosure =
                    resolution.reasonFieldsNotFiltered.length > 0
                      ? suggestedQueryReasonMismatchDisclosure(
                          resolution.reasonFieldsNotFiltered,
                        )
                      : '';
                  break;
                case 'unverifiable_index':
                case 'unknown_fields':
                case 'unsupported_clauses':
                  dsl = resolution.strippedDsl;
                  disclosure =
                    SUGGESTED_QUERY_FIELDS_STRIPPED_DISCLOSURE +
                    (resolution.timeRangeDefaulted
                      ? SUGGESTED_QUERY_WINDOW_DEFAULTED_DISCLOSURE
                      : '');
                  break;
                default: {
                  // Unreachable: `resolution.outcome` is a closed union and every member is handled
                  // above. Present because `default-case` is enforced repo-wide, and typed as
                  // `never` so ADDING an outcome without handling it here fails the build rather
                  // than silently falling through with an unassigned `dsl`.
                  const exhaustive: never = resolution;
                  throw new Error(
                    `Unhandled suggested-query resolution outcome: ${JSON.stringify(
                      exhaustive,
                    )}`,
                  );
                }
              }
              yield {
                type: 'suggested_query',
                index: validation.index,
                dsl,
                reason: validation.reason + disclosure,
              };
              toolResultContent = JSON.stringify({
                shown: true,
                note:
                  'The suggested query was shown to the user as an "Open in Discover" link. Now ' +
                  'tell the user plainly, in your own words, what you could not check and why — ' +
                  'do not repeat the query itself, the link already shows it.',
              });
            }
          }

          messages = [
            ...messages,
            // ORIGINAL (pseudonym-form) toolCall — wire consistency, same as the real-tool path.
            // `vendorExtras` (e.g. Gemini's `thought_signature`) is spread only when the adapter
            // actually captured one this round — see StreamEvent's `tool_call` doc comment.
            {
              role: 'assistant',
              content: '',
              toolCalls: [event.toolCall],
              ...(event.messageVendorExtras
                ? { vendorExtras: event.messageVendorExtras }
                : {}),
            },
            {
              role: 'tool',
              toolCallId: event.toolCall.id,
              // CAPABILITY-DENIAL GUARD chokepoint (see augmentToolError's doc comment above): a
              // no-op for the 'shown:true' acknowledgment, applies the note to either the arg-
              // validation error or the unknown-fields self-correction error above.
              content: augmentToolError(toolResultContent),
            },
          ];
          continue;
        }

        toolUsedThisTurn = true;
        roundHadRealToolCall = true;

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

        // CAPABILITY-DENIAL GUARD chokepoint (see augmentToolError's doc comment above): applied
        // ONCE here, then reused for BOTH the digest event below and the role:'tool' message --
        // never the raw `outcome.toolResultContent` -- so the digest a resumed conversation replays
        // as history is byte-identical to what the model actually saw in THIS turn. This single
        // call site is what makes the guard "one code path" (this file's own coverage test):
        // `outcome.toolResultContent` here already carries every real-tool failure mode --
        // arg-validation rejection, guardrail rejection, and the last-resort execution-crash
        // fallback right above -- so all three inherit the note without a per-case branch.
        const toolResultContentForModel = augmentToolError(
          outcome.toolResultContent,
        );

        // Deferred-offer interception (issue #8935 item I3): only a SUCCESSFUL call marks this
        // tool as executed for the exclusion in findOfferedFollowUpTool. A rejected/errored call
        // must stay forceable -- "that call needs a policy_id; I can retry get_sca_checks, want
        // me to?" is the retry sibling of the measured failure, and keying the exclusion on the
        // ATTEMPT rather than the outcome structurally immunized it (integration review). A
        // successful earlier call still excludes by NAME, not name+arguments: an offer naming a
        // tool that already produced a result is far more often the model summarizing its own
        // work than proposing a genuinely different call, and force-repeating succeeding tools
        // risks loops -- recorded as a deliberate bound of this mechanism, not an oversight.
        if (!isToolResultError(outcome.toolResultContent)) {
          executedToolNames.add(event.toolCall.name);
        }

        if (outcome.tableEvent) {
          // Issue #8911: only a successful execution ever sets `tableEvent` (every rejection/error
          // path above returns `toolResultContent` alone) — this is the round's "did anything
          // actually succeed" signal `shouldEnterFinalRoundEarly` needs below.
          roundHadSuccessfulToolCall = true;
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
            content: toolResultContentForModel,
          };
        }

        messages = [
          ...messages,
          // ORIGINAL (pseudonym-form) toolCall, not toolCallForClient — wire consistency.
          // `vendorExtras` (e.g. Gemini's `thought_signature`) is spread only when the adapter
          // actually captured one this round — see StreamEvent's `tool_call` doc comment.
          {
            role: 'assistant',
            content: '',
            toolCalls: [event.toolCall],
            ...(event.messageVendorExtras
              ? { vendorExtras: event.messageVendorExtras }
              : {}),
          },
          {
            role: 'tool',
            toolCallId: event.toolCall.id,
            content: toolResultContentForModel,
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
            roundText += trailing;
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

        // DEFERRED-OFFER INTERCEPTION (issue #8935 item I3): this round made no tool call AND
        // streamed text -- the exact shape of "summary, then ask permission for an obvious next
        // tool". Fires only when a next TOOL-BEARING round genuinely exists to force the call
        // into, only on a turn that is actually gathering data, and only ONCE per turn -- see
        // shouldConsiderDeferredOffer (the pure, testable form of that gate). When `tools` is
        // `undefined` (an adapter with `supportsTools === false`, or -- structurally impossible
        // here since `toolUsedThisTurn` implies a tool round already offered tools -- a
        // `general`-routed no-tool turn) there is nothing to force a call into, so the detector
        // is not even asked. `roundHadReasoningFallback` (integration review): a round whose text
        // came from the adapter's reasoning-channel fallback is raw deliberation, which routinely
        // names a tool it decided AGAINST -- never intercept it.
        if (
          shouldConsiderDeferredOffer({
            isFinalRound,
            round,
            maxRounds: MAX_TOOL_ROUNDS,
            toolUsedThisTurn,
            forcedFollowUpSpent,
          }) &&
          !roundHadReasoningFallback
        ) {
          const offeredTool = tools
            ? findOfferedFollowUpTool(roundText, tools, executedToolNames)
            : undefined;
          if (offeredTool) {
            forcedFollowUpTool = offeredTool;
            forcedFollowUpSpent = true;
            forcedFollowUp = true;
            // The offer text the user has ALREADY READ becomes part of the provider-bound
            // history (integration review): without this, the forced round and the final round
            // are authored blind of the summary-plus-offer on screen, and the turn ships two
            // independently-authored summaries that can contradict each other. `roundText` is
            // the depseudonymized client-visible text; scrubMessagesForProvider re-applies the
            // pseudonym map to assistant content on every outbound call, so known entities go
            // back out as the same pseudonyms the model produced.
            messages = [...messages, { role: 'assistant', content: roundText }];
            // Suppress this 'done' exactly like the sawToolCall branch above: no privacy_map, no
            // no-text fallback, no client-visible 'done' -- the turn is NOT over, it is being
            // redirected into one more forced tool round.
            //
            // CONSENT CONTRACT, recorded (integration review asked for the decision, not an
            // omission): the streamed sentence asks permission ("want me to?") and this code then
            // acts without an answer. That is deliberate. The product decision behind #8935 item
            // I3 is that a turn with rounds remaining must not END on a permission question the
            // user cannot see the cost of (the measured 0/3 failure); holding the offer sentence
            // back until the forced call resolves (the StreamDepseudonymizer/
            // MarkdownTableSuppressor holdback precedents) was considered and rejected because
            // the offer is also the SUMMARY sentence in the measured transcripts -- suppressing
            // it would hide the one correct summary the round produced if the forced call then
            // failed. prompts.ts's "End with at most one short follow-up offer" instruction is
            // left in place on purpose: when the model phrases that offer concretely enough to
            // name one runnable tool, this mechanism converts the offer into the action, and
            // when it does not, base behaviour is unchanged.
            break;
          }
        }

        // The turn is genuinely over (this round made no tool call) and the model never produced
        // any text at all — see NO_ANALYSIS_TEXT_MESSAGE/NO_ANSWER_MESSAGE's doc comments. Which
        // copy fits depends on whether a tool ran earlier this turn; if none did, there is no
        // table and no query to reference, so NO_ANSWER_MESSAGE is used instead.
        if (!sawAnyDelta) {
          yield {
            type: 'delta',
            content: noTextFallbackMessage(
              toolUsedThisTurn,
              sawNonEmptyTable,
              isFinalRound,
            ),
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
        // A FORCED round's provider error must not reach the client (issue #8935 item I3,
        // integration review): the interception suppressed a CLEAN 'done' to buy this round, so
        // on base the user already had a complete summary-plus-offer and a clean termination --
        // an internally-initiated extra call the user never asked for must never end the turn
        // worse than that. Same recorded policy as stage 1's "a stage-1 failure must not produce
        // a dead turn": swallow, log, terminate cleanly with the accumulated usage.
        if (forcedRound) {
          logger.error(
            `wazuhAiAssistant: forced follow-up round failed (${event.message}); ` +
              'ending the turn with the already-streamed answer instead',
          );
          yield* emitPrivacyMapOnce();
          yield { type: 'done', usage: toStreamUsage(usageTotals) };
          ended = true;
          break;
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
    if (!sawToolCall && !forcedFollowUp) {
      // Defensive: the adapter's stream ended without a 'done'/'error'/tool_call (shouldn't
      // happen per the adapter contract) — don't spin forever. `forcedFollowUp` is the one
      // legitimate exception (issue #8935 item I3): that round's 'done' had no tool call either,
      // but it was deliberately suppressed above to redirect into a forced next round, not a dead
      // stream — without this exemption this guard would return right after the `break` above and
      // silently undo the interception.
      if (forcedRound) {
        // The FORCED round dead-streamed (issue #8935 item I3, integration review): on base the
        // turn had already terminated cleanly on the offer round's 'done' that the interception
        // suppressed -- returning bare here would close the SSE stream with no terminating frame,
        // strictly worse than base. Emit the clean termination the suppressed 'done' owed the
        // client (same policy as the forced-round 'error' branch above).
        if (!sawAnyDelta) {
          yield {
            type: 'delta',
            content: noTextFallbackMessage(toolUsedThisTurn, sawNonEmptyTable),
          };
        }
        yield* emitPrivacyMapOnce();
        yield { type: 'done', usage: toStreamUsage(usageTotals) };
      }
      return;
    }

    // Issue #8911: decide BEFORE folding this round's own success into `hadSuccessfulRoundEarlier`
    // — the gate is "an EARLIER round already succeeded", not this one.
    if (
      shouldEnterFinalRoundEarly(
        roundHadRealToolCall,
        roundHadSuccessfulToolCall,
        hadSuccessfulRoundEarlier,
      )
    ) {
      forceFinalRoundEarly = true;
    }
    hadSuccessfulRoundEarlier =
      hadSuccessfulRoundEarlier || roundHadSuccessfulToolCall;
  }

  // Exhausted the round budget and the forced-final (no-tools) round still didn't end cleanly
  // above; close the SSE stream rather than hang the client. Same widened no-text guard as the
  // main 'done' branch above — a model that never produced text deserves a written answer, not a
  // bare done, regardless of whether a tool ran.
  if (!sawAnyDelta) {
    yield {
      type: 'delta',
      content: noTextFallbackMessage(toolUsedThisTurn, sawNonEmptyTable, true),
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
