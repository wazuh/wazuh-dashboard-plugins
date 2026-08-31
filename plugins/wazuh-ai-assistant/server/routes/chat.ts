import { Readable } from 'stream';
import { schema } from '@osd/config-schema';
import {
  IRouter,
  Logger,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from '../../../../src/core/server';
import { API_PATHS, CONVERSATION_OWNER_FALLBACK } from '../../common/constants';
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
import { excludePrivacyOffHistory } from '../../common/chat-history';
import { getProviderAdapter } from '../providers/registry';
import { ChatStreamOptions, ProviderAdapter } from '../providers/types';
import { buildSystemPrompt } from '../prompts';
import { getToolCostClass, listToolSpecs } from '../tools/registry';
import {
  executeToolCall,
  PrivacyContext,
  ToolExecutionOutcome,
} from '../tools/executor';
import { validate } from '../tools/schema-validator';
import {
  deepMapStrings,
  prescanAndMint,
  prescanAndMintToolContent,
  Pseudonymizer,
  scrubKnownEntities,
  StreamDepseudonymizer,
} from '../tools/privacy';
import { MarkdownTableSuppressor } from '../tools/markdown-table-filter';
import { getApiKeyCipher } from '../plugin-services';
import { resolveWazuhUsername } from '../identity';
import {
  buildRoutingPrompt,
  CHAIN_PAIRS,
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
 * CAPABILITY-DENIAL GUARD, deterministic half (see prompts.ts's buildSystemPrompt for the
 * UNGUARANTEED prompt-level half of this same guard). A failed tool call
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
 * Closes the "prose promises a field filter, DSL carries only @timestamp" dishonesty: the emitted
 * `reason` must NEVER silently diverge from what the emitted `dsl` actually
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
 * promise different things ("the field named in the prose was not filtered on at all"), covered
 * here for the MODEL-authored case that no strip ever touches. */
function suggestedQueryReasonMismatchDisclosure(fields: string[]): string {
  return (
    ` (Note: the linked query does not itself filter on ${fields.join(
      ', ',
    )} — it opens a ` + 'broader view; narrow it in Discover.)'
  );
}

/**
 * TOOL-ROUND COST BUDGET. Each EXECUTED, SUCCESSFUL real tool call this turn (one that actually
 * reached the Indexer/Manager and produced a `tableEvent` -- see `chargeableToolCallCost` below)
 * spends `getToolCostClass(name)` units (1 aggregation-only / 2 filtered-search default / 3
 * escape-hatch) from a running total. A call rejected by local schema/argument/guardrail
 * validation never dispatches a backend request and so is NEVER charged against this budget --
 * that failure mode is bounded by `MAX_TOOL_ROUNDS` (the structural safety net below) and by
 * `shouldEnterFinalRoundEarly`.
 *
 * CALIBRATION: 6 units matches three rounds of one DEFAULT-cost (2-unit) tool call each, spending
 * exactly 6 -- covering the common case of 3 tool rounds. A turn that leans on cheap
 * aggregation-only tools (cost 1) affordably gets MORE rounds (up to 6) before the budget is
 * exhausted; a turn that leans on the cost-3 escape hatch gets fewer (2) -- the budget spends
 * where the actual backend cost is, instead of a flat per-round count that charged a single
 * `search_wazuh_data` call the same as a cheap `size:0` aggregation.
 */
export const BASE_BUDGET_UNITS = 6;

/**
 * Absolute cap on how far `BASE_BUDGET_UNITS` may be silently extended (see
 * `shouldGrantBudgetExtension` below) -- 3x base, no exceptions, regardless of how many times the
 * extension conditions keep holding. Once total spend reaches this, the turn's NEXT round is
 * forced tools-off exactly like an ordinary budget exhaustion with no extension granted.
 */
export const HARD_CEILING_UNITS = BASE_BUDGET_UNITS * 3;

/**
 * Bounded tool rounds per turn -- a DERIVED STRUCTURAL SAFETY BOUND, not the primary mechanism:
 * the cost budget above is what normally decides when a turn's tool rounds end, but a
 * pathological turn that only ever executes free (cost-0, rejected/errored) calls would otherwise
 * never exhaust the cost budget at all and could loop forever. This count-based ceiling is the
 * backstop for exactly that case -- it terminates the loop on ROUND COUNT alone regardless of
 * spend. A final no-tools round follows to close out the answer. Exported so tests can derive
 * round-budget-dependent scripts from it (see chat-capability-honesty.test.ts's
 * last-tool-bearing-round test) instead of hardcoding the round count, which would silently start
 * testing a different round on any budget change.
 *
 * 6 is chosen because it still completes a 5-agent sweep exactly (5 tool rounds + 1 final), while
 * keeping the worst-case single-request tool-result context and whole-turn transferred tool-digest
 * tokens bounded, staying clear of the Groq-413 ("request entity too large") regime measured on
 * tool-heavy turns. See CONTEXT_CHAR_BUDGET below for the direct, model-independent fix to the
 * same concern. */
export const MAX_TOOL_ROUNDS = 6;

/**
 * An orthogonal, model-independent bound on how much tool-result text this turn may re-send to
 * the provider, on top of the cost budget above. The cost budget prices BACKEND query weight;
 * nothing before this priced PROVIDER CONTEXT, and every round re-sends the entire accumulated
 * history -- so a turn that stays under budget in cost units can still grow its provider-bound
 * context unboundedly in cheap-tool-heavy turns. This tracks the running sum of every
 * `toolResultContentForModel` character count appended to `messages` this turn and forces the
 * NEXT round to be the final (tools-off) one once the sum exceeds this value -- the direct fix
 * for the measured Groq 413, independent of which/how-cheap the tools were.
 *
 * CALIBRATION ARITHMETIC: with `DIGEST_CHAR_CAP = 6000` chars per tool digest, the OLD fixed
 * `MAX_TOOL_ROUNDS = 3` design's worst case was 3 rounds x one digest each = 3 x 6000 = 18,000
 * chars accumulated in the largest single request (the final, tools-off round, which resends
 * every prior digest). `CONTEXT_CHAR_BUDGET` is set to 24,000 -- about 4 digests, i.e.
 * `18,000 * 1.33`. That is deliberately in the SAME ORDER OF MAGNITUDE as the old worst case
 * precisely so this stop, not the round/cost ceiling, is what now bounds worst-case request size:
 * 4 digests comfortably covers a 5-agent sweep's cost-2 `get_sca_checks` calls (5 x ~1-2k chars
 * per single-agent digest, well under 24,000 long before round 5), while still forcing a final
 * round before a cost-1-heavy turn's 6 rounds of full-catalog aggregation digests (each easily
 * 6000 chars) could reach anywhere near that regime. This is a STOP, not a per-round truncation:
 * it only decides when tool-gathering ends, it never drops or shrinks any digest already appended
 * to `messages`.
 */
export const CONTEXT_CHAR_BUDGET = 24_000;

/**
 * Independent bound on a turn whose tool calls are ALL rejected or errored -- one that NEVER has
 * a single successful round -- which `shouldEnterFinalRoundEarly` deliberately does not
 * cover (it requires `hadSuccessfulRoundEarlier`). This gives that shape its own, tighter,
 * round-count-independent ceiling so raising `MAX_TOOL_ROUNDS` again later cannot silently widen
 * this pathology's worst case back out. 3 consecutive real-tool-call rounds with zero success
 * (reset the moment any round succeeds) force the next round to be final -- one more attempt than
 * `shouldEnterFinalRoundEarly` (which fires on a SINGLE failure once a PRIOR round already
 * succeeded), preserving a little more self-correction room for a turn that has not yet proven it
 * can succeed at all.
 */
export const MAX_CONSECUTIVE_REJECTED_ROUNDS = 3;

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
 * Appends context to the canned empty-result copy, which otherwise says nothing about what was
 * searched. `NO_MATCHING_RESULTS_MESSAGE` alone reads identically for
 * every zero-row turn regardless of what was actually asked — a scoped SCA/vulnerability/agent
 * search and a wide-open one both produce the exact same sentence, so the user has no way to
 * tell "nothing matched this narrow filter" from "something may be broken." This appends what
 * the last real tool call this turn actually targeted: the data domain it searched (derived
 * from the tool's own name) and, when the caller supplied any, the filters/time-window that
 * narrowed it to zero — both already present on `lastAttemptedToolCall`, the digest/request
 * context for that call.
 *
 * MECHANISM-FREE BY CONSTRUCTION (product decision, same posture as
 * NO_ANALYSIS_ROUNDS_EXHAUSTED_MESSAGE below): this reads the tool NAME and its ARGUMENT
 * key/value pairs, never anything about rounds/budgets/cost units/the orchestration loop. A
 * tool name is data-domain vocabulary the user already thinks in ("SCA checks", "agents"), not
 * an internal mechanism — chat-no-text-fallback-message.test.ts's mechanism-silence word list
 * covers this output too.
 */
const TOOL_NAME_VERB_PREFIX_RE = /^(get|search|lookup)_/;
/** Short catalog acronyms that read badly lowercased by the generic "snake_case -> words"
 * conversion below (e.g. "sca checks" -> "SCA checks"). Deliberately a small, hand-picked list —
 * this is a display nicety, not a classification the empty-copy's correctness depends on: any
 * acronym missing from this map still renders as a perfectly readable lowercase word. */
const TOOL_DOMAIN_ACRONYMS: Record<string, string> = {
  sca: 'SCA',
  cti: 'CTI',
  cve: 'CVE',
  ioc: 'IOC',
  mitre: 'MITRE',
  fim: 'FIM',
};

/** Turns a tool name like `get_sca_checks` into the plain-language domain it searches,
 * `"SCA checks"` — strips the leading verb (get/search/lookup, none of which add meaning for a
 * user) and renders every remaining underscore-joined word, uppercasing the handful of known
 * catalog acronyms above. */
function describeToolDomain(toolName: string): string {
  return toolName
    .replace(TOOL_NAME_VERB_PREFIX_RE, '')
    .split('_')
    .filter(word => word.length > 0)
    .map(word => TOOL_DOMAIN_ACRONYMS[word] ?? word)
    .join(' ');
}

/** Caller-supplied filter keys renamed to the word a user would recognize, e.g. `agent_id` ->
 * "agent" rather than the raw parameter name. Any key absent from this map still renders fine —
 * `describeSearchFilters` falls back to spacing out its own underscores. */
const FILTER_KEY_LABELS: Record<string, string> = {
  agent_id: 'agent',
  policy_id: 'policy',
  cve_id: 'CVE',
  detector_type: 'detector type',
  rule_id: 'rule',
  // NOT mapped to 'indicator' here on purpose -- for
  // `lookup_indicator`, `describeToolDomain('lookup_indicator')` already resolves to "indicator"
  // (the verb-prefix strip leaves just that one word), so an explicit entry here produced the
  // doubled "(Searched: indicator, filtered to indicator 124.70.213.43.)" copy bug. The fallback
  // (`key.replace(/_/g, ' ')`) renders the bare key "indicator" identically anyway, so omitting
  // this entry changes nothing about the label itself -- it only removes the redundant mapping.
};
/** Never part of the user-facing filter description: `limit` is a page-size mechanism, not
 * something the user asked to narrow by. `query_dsl` is
 * `search_wazuh_data`'s escape-hatch parameter — declared `type: 'string'` in its schema, but the
 * string it carries is raw Elasticsearch DSL JSON, not a user-meaningful value. Excluding objects
 * and arrays (the type guard below) does not catch it because the DSL rides in as a STRING; left
 * unexcluded, a zero-row `search_wazuh_data` call rendered "query dsl {"query":{"bool": ..." into
 * user-facing copy whose own doc comment promises plain language and no mechanism internals. */
const FILTER_KEYS_EXCLUDED_FROM_SCOPE = new Set(['limit', 'query_dsl']);
/** Defensive length cap for a single filter clause's value (D3 fix): `query_dsl` above is the
 * known case, but this bounds ANY future string parameter the same way, so a new escape-hatch-
 * shaped argument cannot reopen this defect by accident. */
const FILTER_VALUE_MAX_LENGTH = 60;

/**
 * Renders a tool call's resolved arguments as short "label value" clauses (e.g. `"agent 003"`,
 * `"policy CIS_Ubuntu"`), plus one combined time-window clause when either time-range bound was
 * supplied — never two separate gte/lte clauses, which would read as two unrelated filters
 * instead of the one narrowing they actually are. Only scalar (string/number/boolean) argument
 * values are described; an object/array argument is skipped rather than JSON-dumped into
 * user-facing copy.
 */
function describeSearchFilters(args: Record<string, unknown>): string[] {
  const clauses: string[] = [];
  for (const [key, value] of Object.entries(args)) {
    if (
      FILTER_KEYS_EXCLUDED_FROM_SCOPE.has(key) ||
      key === 'time_range_gte' ||
      key === 'time_range_lte' ||
      value === undefined ||
      value === ''
    ) {
      continue;
    }
    if (
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean'
    ) {
      continue;
    }
    const label = FILTER_KEY_LABELS[key] ?? key.replace(/_/g, ' ');
    const shown =
      String(value).length > FILTER_VALUE_MAX_LENGTH
        ? `${String(value).slice(0, FILTER_VALUE_MAX_LENGTH)}…`
        : String(value);
    clauses.push(`${label} ${shown}`);
  }
  const gte = args.time_range_gte;
  const lte = args.time_range_lte;
  if (typeof gte === 'string' || typeof lte === 'string') {
    clauses.push(
      `time window ${typeof gte === 'string' ? gte : 'the start'} to ` +
        `${typeof lte === 'string' ? lte : 'now'}`,
    );
  }
  return clauses;
}

/**
 * Builds the full N1 empty-result sentence: the base copy plus, when a real tool call was
 * attempted this turn, a parenthetical naming what it searched. Returns the unmodified base
 * message when no tool call is on record (defensive — `noTextFallbackMessage` only reaches this
 * branch when `toolUsedThisTurn` is true, so this should always have one, but a missing record
 * degrades to the honest pre-N1 sentence rather than a broken parenthetical).
 */
/** Defensive cap on an embedded, already-classified suggestion clause (see
 * `classifyToolErrorForFallback` below) -- these are short, hand-written, bounded strings by
 * construction (the same convention every other bounded tool-result error in this catalog
 * follows), but this backstops any future one that is not, the same defensive posture
 * `FILTER_VALUE_MAX_LENGTH` applies to a filter clause value. */
const TOOL_ERROR_MESSAGE_MAX_LENGTH = 300;

/**
 * `buildNoMatchingResultsMessage` must never render an arbitrary `{error: "..."}`
 * tool result verbatim into user-facing copy -- that channel also carries guardrail-violation text
 * and raw `sanitizeError()` output, both of which may echo mechanism vocabulary or a
 * privacy-mode pseudonym (this text renders outside the per-round depseudonymization pipeline).
 * This is a STRICT ALLOWLIST: only get_field_values' two vetted, schema-only error shapes (an
 * unknown field, or an invalid field/family pairing -- see get-field-values.ts's `buildRequest`)
 * are recognized and rewritten into short, user-vocabulary copy. Every other shape returns
 * `undefined` and the caller falls back to the plain "no matching results" sentence.
 */
function classifyToolErrorForFallback(message: string): string | undefined {
  if (
    message.includes("is not one of this tool's vetted, bounded-cardinality")
  ) {
    const suggestionMatch = message.match(
      /(Closest known fields: .*\.|No similarly-named known field was found\.)\s*$/,
    );
    return suggestionMatch
      ? `that field isn't one this tool can look up. ${suggestionMatch[1]}`
      : "that field isn't one this tool can look up.";
  }
  if (/^Parameter "index_family" \(.*\) is not valid for field/.test(message)) {
    const surfacesMatch = message.match(
      /(Valid surfaces for this field: [^.]*\.)\s*$/,
    );
    return surfacesMatch
      ? `that isn't a valid data surface for this field. ${surfacesMatch[1]}`
      : "that isn't a valid data surface for this field.";
  }
  return undefined;
}

function buildNoMatchingResultsMessage(
  lastToolCall:
    | { name: string; args: Record<string, unknown>; errorMessage?: string }
    | undefined,
): string {
  if (!lastToolCall) {
    return NO_MATCHING_RESULTS_MESSAGE;
  }
  // A REJECTED/ERRORED call (a bad parameter, an
  // unknown field, an invalid field/family pairing) is a different finding from a valid call that
  // genuinely matched nothing, and only a narrow, vetted allowlist of error shapes
  // (`classifyToolErrorForFallback`) is ever surfaced here -- never the raw error channel.
  const classified = lastToolCall.errorMessage
    ? classifyToolErrorForFallback(lastToolCall.errorMessage)
    : undefined;
  if (classified) {
    const domain = describeToolDomain(lastToolCall.name);
    const shown =
      classified.length > TOOL_ERROR_MESSAGE_MAX_LENGTH
        ? `${classified.slice(0, TOOL_ERROR_MESSAGE_MAX_LENGTH)}…`
        : classified;
    return `The ${domain} lookup could not run as asked: ${shown}`;
  }
  const domain = describeToolDomain(lastToolCall.name);
  // For `lookup_indicator`, `domain` is already "indicator" (the
  // verb-prefix strip leaves just that one word) and its own filter clause would ALSO read
  // "indicator <value>" -- rendering both produced the doubled "(Searched: indicator, filtered
  // to indicator 124.70.213.43.)" copy bug. A filter clause whose label is exactly the domain word
  // is redundant with the domain itself (the domain already told the reader what was searched),
  // so it is dropped from the filtered-to list rather than repeated.
  const filters = describeSearchFilters(lastToolCall.args).filter(
    clause => !clause.toLowerCase().startsWith(`${domain.toLowerCase()} `),
  );
  const scope =
    filters.length > 0
      ? `${domain}, filtered to ${filters.join(', ')}`
      : domain;
  return `${NO_MATCHING_RESULTS_MESSAGE} (Searched: ${scope}.)`;
}

/**
 * Handles "stale digest after silent mid-turn error": the NO_ANALYSIS_TEXT_MESSAGE/
 * NO_ANALYSIS_ROUNDS_EXHAUSTED_MESSAGE copy below (the `sawNonEmptyTable === true` branch of
 * `noTextFallbackMessage`) only ever says "see the results above" — it has no idea whether the
 * table on screen actually reflects the question that was asked. The failure shape: an EARLIER,
 * broader call already rendered a (real, non-empty) table, but the actual LAST call this turn
 * attempted — a narrower, correctly-scoped follow-up the question needed — errored silently.
 * Without this, the fallback sentence describes that earlier, broader table as though it were the
 * answer, with no hint that the real, scoped lookup never completed.
 *
 * `lastToolCall.errorMessage` is set ONLY on an error outcome (see `lastAttemptedToolCall`'s
 * assignment site above), so its mere presence already proves the LAST attempt this turn did not
 * make it into the table on screen — no extra bookkeeping needed to tell "last attempt errored"
 * apart from "last attempt succeeded and is already what the table describes".
 *
 * Reuses `classifyToolErrorForFallback`'s narrow, vetted allowlist (the same one
 * `buildNoMatchingResultsMessage` above uses) so this never echoes a raw OpenSearch/Node
 * exception or a pseudonym into user-facing copy — an unclassified error still gets a truthful,
 * generic "did not complete" clause rather than staying silent about it. Returns `''` when there
 * is nothing to add (no last attempt, or it succeeded), so every call site can simply append this
 * to an existing sentence unconditionally.
 */
function describeErroredLastAttempt(
  lastToolCall:
    | { name: string; args: Record<string, unknown>; errorMessage?: string }
    | undefined,
): string {
  if (!lastToolCall?.errorMessage) {
    return '';
  }
  const domain = describeToolDomain(lastToolCall.name);
  const classified = classifyToolErrorForFallback(lastToolCall.errorMessage);
  return classified
    ? ` The most recent ${domain} lookup could not run as asked: ${classified}`
    : ` The most recent, more specific ${domain} lookup attempted did not complete, so the ` +
        'results above may not fully answer the question as scoped.';
}

/**
 * Variant of NO_ANALYSIS_TEXT_MESSAGE for a turn whose tool-gathering ended (either the cost
 * budget or the structural round cap -- see the exhaustion doc comments above `BASE_BUDGET_UNITS`
 * and `MAX_TOOL_ROUNDS`) before the model wrote any text, even after FINAL_ROUND_ANSWER_INSTRUCTION
 * asked for one. Named explicitly rather than folded into the generic copy above: the results
 * table IS non-empty here, but it reflects only as far as the turn got, not the full answer, so
 * the user should know a step was left unreached. NEVER NAMES THE MECHANISM (no "round"/"budget"/
 * "limit" wording, per product decision) -- this is user-visible copy, and the internal cost-unit
 * accounting that decided the turn was done must stay invisible to the reader (see
 * chat-no-text-fallback-message.test.ts's mechanism-silence test).
 */
// Describes the user-visible SHAPE of what happened (a partial answer, more to see above,
// something to continue) rather than naming the mechanism or an internal unit of work like
// "turn", which the reader has no model for. The NO_TEXT_FALLBACK/FINAL_ROUND silence tests cover
// this wording.
const NO_ANALYSIS_ROUNDS_EXHAUSTED_MESSAGE =
  'A full answer could not be written for this question. See the results above for what was ' +
  'found — a follow-up question can continue from there.';
/**
 * Sibling fallback for a `general`-routed (no-tool) turn that still ends with no text at all —
 * e.g. a reasoning model streaming its entire answer on a channel nothing reads. This is the
 * structural backstop for that case. Deliberately its own copy rather than reusing
 * NO_ANALYSIS_TEXT_MESSAGE/NO_MATCHING_RESULTS_MESSAGE above: both of those say or imply "see the
 * results above" / "that query", which is wrong here — no tool ran, so there is no table and no
 * query to refer to.
 */
const NO_ANSWER_MESSAGE =
  'I was not able to come up with an answer for that. Try rephrasing your question.';

/**
 * Appended to the FINAL round's outbound messages when the turn ran at least one tool — see the
 * append site in `orchestrate` below for why it goes on
 * the outbound copy only. This is the request for a conclusion that dropping `tools` does not by
 * itself make.
 *
 * Every clause is load-bearing, so edit with care:
 *  - the DATA half ("every fact about this environment ... must come from the tool results already
 *    gathered", "never state a data point the results do not show") keeps this from becoming a
 *    fabrication prompt. Asking a model to produce an answer it could not support is exactly how
 *    invented numbers and agent names appear, and the fallbacks above exist precisely because an
 *    honest silence was preferable to that. The instruction has to buy analysis WITHOUT buying
 *    invention.
 *  - the ADVISORY half is what makes an explanation writable at all: a blanket "state nothing the
 *    results do not show" also bans saying what a technique IS or what mitigates it, knowledge no
 *    tool in this product returns. The split is between FACTS ABOUT THIS ENVIRONMENT (grounded, no
 *    exceptions) and INTERPRETATION (general security knowledge, separated and hedged) -- the same
 *    shape as the Group E how-to policy in prompts.ts. Two details are load-bearing: the DATA list
 *    must stay explicitly non-exhaustive ("including but not limited to ... any other data point"),
 *    because a closed list lets CVSS scores, versions, IPs, ports and paths fall through the ban;
 *    and detection provenance is on the DATA side -- how a class of activity is TYPICALLY detected
 *    is knowledge, but what detected this HERE is a rule id or detector name. The fence is
 *    duplicated in buildSystemPrompt because this instruction only fires on a final, tool-using
 *    round while the allowance there applies to every round; the two must stay in sync.
 *  - "If they do not answer the question, say so plainly" gives the model a licensed exit, so the
 *    honest outcome stays reachable rather than being squeezed out by the request for text.
 *  - no mention of tools being unavailable: the round already omits `tools` entirely, and naming
 *    the absent capability invites the model to narrate the mechanism ("I cannot query further…")
 *    instead of answering.
 *  - the trailing coverage-statement clause (the cost-budget redesign's exhaustion
 *    contract) asks for exactly WHAT was and was not covered ("covers agents 001-003; 004 and 007
 *    not retrieved" is the shape), never HOW OR WHY that coverage ended where it did -- "describe
 *    only the coverage itself, not the process that produced it" is what keeps this
 *    mechanism-free: the model has no internal round/budget/limit/turn vocabulary to reach for
 *    because the instruction never offers it one, on purpose (see
 *    NO_ANALYSIS_ROUNDS_EXHAUSTED_MESSAGE's doc comment for the matching code-side rule --
 *    an earlier fix removed the earlier wording's own "how or why the turn ended" phrase, which
 *    handed the model exactly the "the turn ended" framing the product decision forbids). This is
 *    a request only -- same as every other clause here, the model's compliance is not guaranteed
 *    by this code.
 *
 * The coverage-statement clause applies to every final round of a tool-using turn, not only a
 * BUDGET-EXHAUSTION final round -- including one `shouldEnterFinalRoundEarly` or the
 * all-rejected-round bound forces after an all-rejected run where nothing was actually gathered
 * -- asking for a coverage statement over an empty set degrades, at worst, to the model saying
 * "no results were retrieved," which is itself an honest and useful coverage statement, not a
 * fabrication risk the way the other clauses guard against. Keeping ONE instruction string for
 * every final round (rather than branching final rounds into "exhausted" vs. "not" -- a
 * distinction only the mechanism itself can see and this instruction must never expose) is the
 * simpler, equally-safe choice.
 */
/** Blank line inserted between two ROUNDS' text within one turn — see `separateRoundText`. Not a
 * newline: the client renders markdown, where a single newline is not a paragraph break. */
export const ROUND_TEXT_SEPARATOR = '\n\n';

/**
 * Shared, verbatim body of both final-round instructions below (the grounding/no-fabrication/
 * coverage clauses documented above). Split out so the CONTINUATION variant cannot drift away from
 * the anti-hallucination wording -- only the OPENING sentence differs between the two.
 */
const FINAL_ROUND_GROUNDING_BODY =
  'Every FACT about this environment -- including but ' +
  'not limited to counts, names, ids, entities, timestamps, statuses, versions, scores, ' +
  'addresses, ports, paths, control numbers, and any other data point describing what is in ' +
  'this deployment -- must come from the tool results already gathered in this conversation: ' +
  'never state a data point the results do not show, and if they do not answer the question, ' +
  'say so plainly and state what is missing. What detected something HERE (rule ids, rule ' +
  'titles, detectors) is one of those facts, not general knowledge: if the results do not name ' +
  'it, say so instead of guessing. Explanation and recommendations are the exception: when the ' +
  'question asks what an event, technique, rule or vulnerability means, why it matters, how ' +
  'that class of activity is typically detected, or how to protect against it, you ' +
  'MAY use your general security knowledge -- keep it in a clearly separate part of the answer, ' +
  'framed as guidance rather than as something observed in the data, and note that it should be ' +
  'verified before acting on it. Never present general knowledge as an environment fact, and ' +
  'never invent data to support it. This is your final step here: do ' +
  'not announce further data pulls or say you will now fetch/break down anything else — no ' +
  'more tool calls will run. Offering the user a follow-up they can ASK for is fine. Then ' +
  'state plainly what the gathered results do and do not cover (for example, which agents, ' +
  'hosts, rules, or items were retrieved and which were not) — describe only the coverage ' +
  'itself, not the process that produced it.';

/**
 * DUPLICATE-ANSWER FIX. Sent INSTEAD of
 * FINAL_ROUND_ANSWER_INSTRUCTION on a final round of a turn that has ALREADY streamed a complete
 * answer to the user's screen — today exactly the deferred-offer interception's turns, the one
 * mechanism that grants a further provider call after a round produced final text
 * and no tool call. On those turns the interception appends that already-read text to the outbound
 * history as an `assistant` message (see `orchestrate`'s forced-follow-up site) and the final round
 * was then told "Now answer the user's question directly" — an instruction to answer a question the
 * model can see it just answered, which is precisely how the reported turn shipped TWO complete
 * answers, the second one opening "As noted above…". The mechanism is code-side (which string is
 * appended), not a hope about phrasing: the re-synthesis order is simply no longer given.
 *
 * The grounding body is shared verbatim with FINAL_ROUND_ANSWER_INSTRUCTION — the fabrication
 * guardrails are unchanged, only the framing is. Silence is deliberately NOT offered as an option
 * ("in one short paragraph"): a final round that emits no text at all trips the
 * `!roundSawAnyDelta` fallback and appends NO_ANALYSIS_TEXT_MESSAGE, which would read as a defect
 * of its own.
 */
export const FINAL_ROUND_CONTINUATION_INSTRUCTION =
  'You have already written the answer the user is reading on screen in this same turn. Do NOT ' +
  'write it again: no second version of it, no "as noted above" recap, no re-listing of findings ' +
  'you already reported. Continue that message instead — in one short paragraph, add only what ' +
  'the results gathered since then actually add, and if they add nothing, say just that. ' +
  FINAL_ROUND_GROUNDING_BODY;

export const FINAL_ROUND_ANSWER_INSTRUCTION =
  "Now answer the user's question directly. " + FINAL_ROUND_GROUNDING_BODY;

/**
 * Appends FINAL_ROUND_ANSWER_INSTRUCTION to the messages bound for the provider, but only on the
 * final round of a turn that actually ran a tool. Exported for unit testing only —
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
 *
 * The role must stay `user`, never `system`: `server/providers/anthropic.ts` filters every
 * `system`-role message OUT of `messages` and joins them into the request's TOP-LEVEL `system`
 * field, so a `system`-delivered instruction is appended to the end of the multi-thousand-token
 * system prompt instead of landing at the conversation tail -- leaving a `tool_result` as the last
 * thing the model reads, which it is free to treat as a finished turn. A trailing `user` message is
 * the tail on every adapter (Anthropic maps a `tool` message to `role: 'user'` too, and
 * consecutive same-role messages are explicitly allowed there). Same reasoning applies to
 * `withNoTextSynthesisInstruction` below.
 */
export function withFinalRoundAnswerInstruction(
  messages: ChatMessage[],
  isFinalRound: boolean,
  toolUsedThisTurn: boolean,
  answerAlreadyStreamedThisTurn = false,
): ChatMessage[] {
  if (!isFinalRound || !toolUsedThisTurn) {
    return messages;
  }
  return [
    ...messages,
    {
      role: 'user',
      // A turn that already delivered a complete answer to the screen must not be ordered to
      // answer again — see FINAL_ROUND_CONTINUATION_INSTRUCTION.
      content: answerAlreadyStreamedThisTurn
        ? FINAL_ROUND_CONTINUATION_INSTRUCTION
        : FINAL_ROUND_ANSWER_INSTRUCTION,
    },
  ];
}

// ---------------------------------------------------------------------------------------------
// TOOL-ROUND COST BUDGET -- pure, testable pieces of the mechanism wired into
// `orchestrate`'s round loop below. See BASE_BUDGET_UNITS/HARD_CEILING_UNITS/MAX_TOOL_ROUNDS'
// doc comments above for the overall shape; this section is the decision logic three call sites
// in the loop each need: how much a call costs, whether a round was futile, and whether an
// exhausted budget may be silently extended.
// ---------------------------------------------------------------------------------------------

/**
 * Cost, in budget units, of ONE real tool call this turn -- `0` unless the call actually reached
 * the Indexer/Manager and produced a `tableEvent` (`wasSuccessful`); a call rejected by local
 * schema/argument/guardrail validation never dispatched a backend request, so it is free against
 * THIS budget (see `BASE_BUDGET_UNITS`'s doc comment for why that failure mode is bounded
 * elsewhere instead -- `MAX_TOOL_ROUNDS` and `shouldEnterFinalRoundEarly`). A successful call
 * costs exactly `getToolCostClass(toolName)` (registry.ts) -- 1 aggregation-only / 2 default
 * filtered-search / 3 escape-hatch.
 */
export function toolCallCostUnits(
  toolName: string,
  wasSuccessful: boolean,
): number {
  return wasSuccessful ? getToolCostClass(toolName) : 0;
}

/**
 * EARLY FUTILITY STOP: a round whose tool calls all came back with
 * nothing new must not spend further budget on variations, avoiding a pattern where multiple
 * rounds burn budget on 0-row calls.
 *
 * Takes only the SUCCESSFUL calls this round (a caller-side filter, same shape as
 * `roundHadSuccessfulToolCall` elsewhere in this file) -- a round with zero successful calls
 * (every call rejected/errored) is NOT this mechanism's concern: that shape is exactly what
 * `shouldEnterFinalRoundEarly` already governs, gated on "an EARLIER round already
 * succeeded" so the model keeps one legitimate self-correction attempt. Passing an EMPTY array
 * here therefore returns `false` -- deliberately, so the two mechanisms stay non-overlapping
 * (`shouldEnterFinalRoundEarly` owns "every call failed", this owns "every call succeeded but
 * taught us nothing new").
 *
 * A successful call counts as "taught us nothing new" when EITHER:
 *  - `hadRows` is `false` -- the tool executed cleanly but its result carried zero rows (the
 *    "0 rows / all-empty aggs" half of the product wording; `hadRows` is computed at the call
 *    site from `outcome.tableEvent.spec.rows.length > 0`, which is `true` for both a genuine hits
 *    table and an aggregation-only tool's bucket rows, so this one boolean covers both shapes), OR
 *  - `isDuplicate` is `true` -- this exact tool+arguments pair already executed successfully
 *    earlier THIS TURN (the "duplicate of a previous round's identical query" half; computed at
 *    the call site from a `Set` of `name|JSON.stringify(args)` signatures).
 */
export function isRoundFutile(
  successfulCalls: ReadonlyArray<{ hadRows: boolean; isDuplicate: boolean }>,
): boolean {
  if (successfulCalls.length === 0) {
    return false;
  }
  return successfulCalls.every(call => call.isDuplicate || !call.hadRows);
}

/**
 * Tools whose whole purpose is to ANSWER "what values/fields exist here" rather than to retrieve
 * the rows an answer is built from. A zero-row result from one of these is a finding in itself,
 * which is why `shouldGrantZeroRowWideningRound` below refuses to buy an extra round for a round
 * made only of them. Kept as a named set rather than a single literal so the next discovery-class
 * tool joins the rule by being listed, not by someone remembering this branch exists.
 * `suggest_discover_query` is deliberately absent: it never produces a `tableEvent`, so it can
 * never appear in a round's successful-call list at all (see that tool's own doc comment).
 */
const DISCOVERY_TOOL_NAMES: ReadonlySet<string> = new Set(['get_field_values']);

function isDiscoveryToolCall(toolName: string): boolean {
  return DISCOVERY_TOOL_NAMES.has(toolName);
}

/**
 * ZERO-ROW WIDENING GRACE -- exactly ONE extra tool-bearing round after the turn's FIRST
 * all-zero-row round, and never more.
 *
 * Why it exists: `isRoundFutile` above treats "every successful call returned zero rows"
 * identically to "every successful call was a duplicate" and latches
 * `budgetForcesFinalRoundEarly` at the call site below, so the next round is offered NO tools --
 * making the system prompt's own "retry once with a broader filter" instruction unobeyable. The
 * two halves are different findings: a duplicate proves the model is spinning, while a zero-row
 * result proves only that the FILTER VALUE did not match, which is not the same as the data being
 * absent.
 *
 * Every bound below is load-bearing; without them this becomes a retry loop, and the grace already
 * costs latency on every turn it fires:
 *  - `alreadyGranted` is a per-TURN latch, so the grace is given at most once no matter how many
 *    zero-row rounds follow -- the second futile round latches the final round exactly as before;
 *  - a round containing ANY duplicate call is refused outright (the spinning shape);
 *  - a round whose only successful calls were DISCOVERY calls earns nothing: a zero-row discovery
 *    probe has ANSWERED the model ("this field carries nothing here"), so an extra round there
 *    funds more probing instead of widening a query that was too narrow;
 *  - the caller still charges the round's cost first and still forces the final round when the
 *    budget ceiling is spent, so this can never buy a round the budget cannot pay for.
 *
 * Returns `true` only when the round should be allowed one more tool-bearing round. Callers must
 * pass only the round's SUCCESSFUL calls, the same array `isRoundFutile` reads, and must only ask
 * once `isRoundFutile` has already returned `true`.
 */
export function shouldGrantZeroRowWideningRound(opts: {
  successfulCalls: ReadonlyArray<{
    toolName: string;
    hadRows: boolean;
    isDuplicate: boolean;
  }>;
  alreadyGranted: boolean;
}): boolean {
  if (opts.alreadyGranted || opts.successfulCalls.length === 0) {
    return false;
  }
  if (opts.successfulCalls.every(call => isDiscoveryToolCall(call.toolName))) {
    return false;
  }
  return opts.successfulCalls.every(call => !call.isDuplicate && !call.hadRows);
}

/**
 * ENUMERABLE-REMAINING heuristic -- the CHEAPEST SOUND form, scoped
 * deliberately narrowly rather than attempting general list-detection:
 *
 * Detects ONLY an explicit, literal, comma/"and"-separated list of >=2 IDENTIFIER-shaped tokens
 * that follows one of a fixed set of cue words (agent(s)/host(s)/node(s)/polic{y,ies}), within a
 * few characters of the cue word, in the conversation's CURRENT (most recent) `user` message --
 * e.g. "check agents 001, 003, and 007" or "hosts web-01, web-02 and db-01" yields
 * `['001', '003', '007']` / `['web-01', 'web-02', 'db-01']`.
 *
 * The token shape REQUIRES at least one digit (`ENUMERATED_TOKEN_RE`), and the gap between the
 * cue word and the list start is tightened from 24 to 8 characters. Every false positive found is
 * prose with no digit in its items ("offline, disconnected, never" / "high, medium, low" /
 * "SCA, FIM" / "production, staging, dev" / "password, lockout, audit" / "Europe, Asia") and is
 * now rejected, while identifier lists like `001, 002, 003` and `web-01, web-02, db-01` still
 * match.
 *
 * Deliberately does NOT: parse ranges ("agents 001-010"), read any message OTHER than the CURRENT
 * one (`orchestrate` passes the LAST `user` message, not the first, so a follow-up turn is
 * never gated by a stale list from an earlier question), or infer a list from the MODEL's own
 * prose/tool-call pattern -- every one of those would need either a second, fuzzier extraction
 * pass or trusting model-authored text as the source of a budget decision, and a false POSITIVE
 * here (claiming a list exists when the question wasn't actually enumerable) risks granting an
 * extension the futility/duplicate checks alone wouldn't catch. A false NEGATIVE (returning
 * `undefined` for a genuinely enumerable question phrased some other way) just degrades to "not
 * confidently enumerable" -- the safe default the product design explicitly asks for ("when not
 * confidently enumerable, do NOT extend").
 *
 * Returns the literal token list (trimmed, 2-20 tokens) when found, else `undefined`.
 */
const ENUMERATION_CUE_RE =
  /\b(?:agents?|hosts?|nodes?|polic(?:y|ies))\b[^.\n]{0,8}?\b((?:[A-Za-z0-9][\w.-]{0,63}\s*(?:,\s*|\s+and\s+))+[A-Za-z0-9][\w.-]{0,63})/i;

/** Identifier shape a token must have to count as an enumerable list item: at least one
 * digit somewhere in the token, which is what separates `001`/`web-01`/`db-01` (kept) from
 * ordinary English list items like `offline`/`high`/`SCA`/`production` (rejected) -- see
 * ENUMERATION_CUE_RE's doc comment for the measured false-positive table this closes. */
const ENUMERATED_TOKEN_RE = /^[A-Za-z0-9][\w.-]*\d[\w.-]*$/;

export function extractEnumeratedTargets(
  userText: string,
): string[] | undefined {
  const match = ENUMERATION_CUE_RE.exec(userText);
  if (!match) {
    return undefined;
  }
  const tokens = match[1]
    .split(/,|\band\b/i)
    .map(token => token.trim())
    // The LAST token in the list is followed by whatever sentence punctuation ended the
    // question ("...agents 001, 002 and 003." / "003?"), and the token charset above
    // deliberately allows '.' (so an id like "v1.2" or an IP-shaped token stays intact) --
    // that same allowance also lets a genuinely trailing, sentence-ending period get captured
    // as part of the token itself (verified: without this trim, "...and 005." extracted "005."
    // instead of "005"). Stripping ONLY a trailing run of '.' (never an interior one, and
    // never '?'/'!' etc., which the char class does not admit in the first place) removes the
    // sentence terminator without touching a legitimate internal '.'.
    .map(token => token.replace(/\.+$/, ''))
    .filter(token => token.length > 0);
  if (tokens.length < 2 || tokens.length > 20) {
    return undefined;
  }
  if (!tokens.every(token => ENUMERATED_TOKEN_RE.test(token))) {
    return undefined;
  }
  return tokens;
}

/**
 * SILENT EXTENSION gate: whether an exhausted budget may be raised to
 * `HARD_CEILING_UNITS`. Requires ALL of:
 *  - `roundHadNewInfo` -- the round that just spent the budget to zero actually produced new
 *    information (see the call site: a successful, non-duplicate call with `hadRows`), so the
 *    extension is bought with genuine progress, never with a round of failed variations;
 *  - an enumerated target list was found in the user's original question
 *    (`extractEnumeratedTargets`) with at least 2 entries -- the "remaining work is ENUMERABLE"
 *    requirement, deterministic by construction;
 *  - `coveredTargets` (every literal token from that list seen in a successful call's arguments
 *    so far this turn, lower-cased) covers SOME but not ALL of the list -- zero covered means the
 *    turn hasn't even started the sweep (nothing yet proves it IS the sweep the list describes),
 *    all covered means there is nothing left to extend FOR;
 *  - `currentCeiling` has not already reached `HARD_CEILING_UNITS` -- the extension is granted at
 *    most once per turn (raising straight to the hard ceiling, not incrementally), and never
 *    beyond it.
 */
export function shouldGrantBudgetExtension(opts: {
  roundHadNewInfo: boolean;
  enumeratedTargets: readonly string[] | undefined;
  coveredTargets: ReadonlySet<string>;
  currentCeiling: number;
}): boolean {
  if (!opts.roundHadNewInfo) {
    return false;
  }
  if (opts.currentCeiling >= HARD_CEILING_UNITS) {
    return false;
  }
  if (!opts.enumeratedTargets || opts.enumeratedTargets.length < 2) {
    return false;
  }
  const coveredCount = opts.enumeratedTargets.filter(target =>
    opts.coveredTargets.has(target.toLowerCase()),
  ).length;
  return coveredCount > 0 && coveredCount < opts.enumeratedTargets.length;
}

/**
 * A tool round that produced only rejected/errored calls (no successful digest/table)
 * is, for round-budget purposes, indistinguishable from a productive one unless something singles
 * it out (the round loop's own final-round decision below is what does that). When the model is
 * stuck re-guessing a query shape that can never succeed (e.g. an invented field name
 * field-validation.ts keeps rejecting), that burns the remaining rounds on doomed retries instead
 * of leaving one for the final answer. This decides whether the round just finished should make
 * the NEXT round the final one early — exported (and kept pure, same reasoning as
 * `withFinalRoundAnswerInstruction` above) so the decision is testable without standing up a fake
 * `orchestrate` run.
 *
 * Gated on `hadSuccessfulRoundEarlier`: a first-round total failure keeps its normal retry budget,
 * since the model may legitimately fix its own call (a genuine typo, a first attempt at the escape
 * hatch) — only once at least one EARLIER round in the same turn already succeeded is a further
 * fully-rejected round treated as the model being stuck rather than still converging. A turn that
 * NEVER succeeds even once is a different, narrower gap this function deliberately leaves open —
 * see `MAX_CONSECUTIVE_REJECTED_ROUNDS` above for its own independent bound.
 */
export function shouldEnterFinalRoundEarly(
  roundHadToolCalls: boolean,
  roundHadSuccess: boolean,
  hadSuccessfulRoundEarlier: boolean,
): boolean {
  return roundHadToolCalls && !roundHadSuccess && hadSuccessfulRoundEarlier;
}

/**
 * The SINGLE predicate for "will round N offer no tools" -- shared
 * by the round loop's own `isFinalRound` computation (for round `round`) and by the
 * `suggest_discover_query` round-aware retry gate (for round `round + 1`, i.e. "if I convert this
 * into a tool error, will there be a tool-bearing round left to retry in"). Before this fix the
 * retry gate re-derived its own, narrower answer (`round < MAX_TOOL_ROUNDS - 1`) that knew nothing
 * about the cost-budget or futility triggers, so a budget/futility-forced final round could follow
 * a round the retry gate still believed had a successor -- destroying the
 * `suggest_discover_query` handoff exactly the `chat.ts:1712`-era comment says must not happen.
 * Having ONE function answer both questions makes that class of drift structurally impossible: any
 * future trigger added to `isFinalRound` automatically flows into the retry gate too.
 */
export function willBeFinalRound(
  round: number,
  forceFinalRoundEarly: boolean,
  budgetForcesFinalRoundEarly: boolean,
): boolean {
  return (
    round >= MAX_TOOL_ROUNDS ||
    forceFinalRoundEarly ||
    budgetForcesFinalRoundEarly
  );
}

/** Picks which of the three no-text fallbacks above fits a turn that ended without any `delta`
 * text and does NOT qualify for (or fell through) the forced-synthesis retry below — shared by
 * every `!roundSawAnyDelta` exit point in `orchestrate` (via `emitNoTextFallback`: the normal
 * per-round `done` branch, the forced-round dead-stream guard, and the round-budget-exhausted
 * path) so this decision lives in exactly one place. Any `toolUsedThisTurn` turn that recorded a
 * digest -- a real non-empty table with no narration, or an all-empty turn -- no longer resolves
 * here first:
 * `emitNoTextFallback` intercepts that case and only falls back to this copy if
 * forced synthesis produced nothing AND there was no digest to derive a truthful sentence from
 * either (structurally unreachable in practice, since a non-empty table always yields a `digest`
 * event — kept as a defensive last resort, not a live path). Still exported for its own unit
 * test. */
export function noTextFallbackMessage(
  toolUsedThisTurn: boolean,
  sawNonEmptyTable: boolean,
  roundsExhausted: boolean,
  // Optional, appended last so every pre-existing call site — including the two that already
  // omit `roundsExhausted`/this param entirely — keeps compiling unchanged: the last real tool
  // call this turn attempted, used only to enrich the zero-row branch below.
  lastToolCall?: {
    name: string;
    args: Record<string, unknown>;
    errorMessage?: string;
  },
): string {
  if (!toolUsedThisTurn) {
    return NO_ANSWER_MESSAGE;
  }
  if (!sawNonEmptyTable) {
    return buildNoMatchingResultsMessage(lastToolCall);
  }
  // Appends the honest "last attempt errored" clause (empty string when the last attempt
  // succeeded, or there was none) — see `describeErroredLastAttempt`'s doc comment.
  return (
    (roundsExhausted
      ? NO_ANALYSIS_ROUNDS_EXHAUSTED_MESSAGE
      : NO_ANALYSIS_TEXT_MESSAGE) + describeErroredLastAttempt(lastToolCall)
  );
}

/** Whitespace-only delta content (e.g. a lone "\n\n" some models emit as priming/formatting
 * right before a tool call) must NOT count as "the model produced an answer" — otherwise the
 * `roundSawAnyDelta` guard above never fires for exactly the turns it exists to catch. Still
 * forwarded to the client as a normal delta either way; this only affects the tracking flag. */
function hasMeaningfulText(content: string): boolean {
  return content.trim().length > 0;
}

/**
 * FORCED SYNTHESIS (measured design, see the "No additional analysis — see the results above."
 * live failure this replaces): one executed tool call's digest this turn, recorded right where
 * `orchestrate`'s real-tool branch already yields the `digest` StreamEvent -- `content` is that
 * same `outcome.toolResultContent`-derived JSON string (pseudonym-form when privacy is on), so
 * this carries no new data, only the tool's name alongside it for `summarizeDigestForFallback`
 * below.
 */
export interface DigestRecord {
  toolName: string;
  content: string;
}

/** Narrow shape this module reads out of a digest JSON blob -- see digest.ts's `Digest` for the
 * full shape; typed narrowly here so a future digest field never needs a matching change in this
 * unrelated fallback-copy code. `columns` is read too now -- see
 * `summarizeDigestForFallback`'s doc comment for why schema-only (field NAMES, never sample
 * VALUES) is the safe, sufficient enrichment here. */
type SummarizableDigestForFallback = {
  counts?: { total?: number; returned: number; truncated?: boolean };
  columns?: unknown;
};

/** Bounds how many column names the enriched sentence names -- a wide escape-hatch result can
 * carry a long `_source` column list, and this sentence is meant to give the reader a sense of
 * what the row SHAPE is, not enumerate every field. */
const FALLBACK_CONTENT_COLUMN_LIMIT = 5;

/** Renders a digest's `columns` (if present, a non-empty string array) as a short, human-facing
 * clause naming what fields the row(s) actually carry -- e.g. " (fields: detector.name,
 * wazuh.rule.title, @timestamp)". Returns `''` for a missing/malformed/empty `columns`, so a
 * digest shape that predates this field degrades to exactly the pre-fix sentence. Field NAMES
 * only, never sample VALUES: `record.content` is pseudonym-form under privacy mode (see
 * `DigestRecord`'s doc comment), and this text is emitted directly as a `delta` StreamEvent
 * outside the normal per-round depseudonymization pipeline -- reading only schema (never a
 * pseudonym or a real identifier) keeps this fallback privacy-safe without needing to thread it
 * through that pipeline.
 */
function describeDigestColumns(columns: unknown): string {
  if (!Array.isArray(columns) || columns.length === 0) {
    return '';
  }
  const names = columns.filter((c): c is string => typeof c === 'string');
  if (names.length === 0) {
    return '';
  }
  const shown = names.slice(0, FALLBACK_CONTENT_COLUMN_LIMIT);
  const more = names.length - shown.length;
  return ` (fields: ${shown.join(', ')}${more > 0 ? `, +${more} more` : ''})`;
}

/**
 * Truthful, deterministic sentence derived ONLY from a digest's own `counts`/`columns`/tool name
 * -- never invents a number or a field the digest did not already carry. Used by
 * `synthesizeNoTextFallback` below when the model-authored retry (case (a)) errors or produces no
 * usable text (case (b)): the turn must still end with something that does not contradict the
 * non-empty table already on screen, and unlike NO_ANALYSIS_TEXT_MESSAGE this never claims "no
 * additional analysis" over a real result.
 *
 * Fix for "residual single-digest answer collapse": the overnight fix
 * (`summarizeDigestsForFallback` below) covers a multi-digest SWEEP, but a turn whose
 * forced-synthesis retry (a) also fails ends up here on a SINGLE digest even when that digest is
 * a real, on-topic result (one `search_wazuh_data` call against
 * `.opensearch-sap-*-findings` returning exactly the findings asked about). Before this fix, the
 * sentence named only the row count -- "The query returned 1 row; the table below has the
 * details." -- discarding the domain (which tool/data family) and the row shape (which fields)
 * even though both were already sitting in the same digest, unused. Now names the tool's
 * plain-language domain (`describeToolDomain`, already used by `buildNoMatchingResultsMessage`
 * for the empty-result sibling of this same fallback family) and the row schema
 * (`describeDigestColumns`) alongside the counts that were already here -- still nothing beyond
 * what the digest itself carries.
 */
export function summarizeDigestForFallback(record: DigestRecord): string {
  let parsed: SummarizableDigestForFallback | undefined;
  try {
    parsed = JSON.parse(record.content) as SummarizableDigestForFallback;
  } catch {
    // Should not happen -- `content` is always this same route's own `JSON.stringify`'d digest.
    // Degrade to a still-truthful, non-contradictory sentence rather than throwing out of a
    // fallback path whose entire job is to never leave the turn silent or lying.
    return `The ${record.toolName} results are shown in the table below.`;
  }
  const returned = parsed.counts?.returned;
  const total = parsed.counts?.total;
  if (typeof returned !== 'number') {
    return `The ${record.toolName} results are shown in the table below.`;
  }
  const domain = describeToolDomain(record.toolName);
  const rowWord = returned === 1 ? 'row' : 'rows';
  const totalPhrase =
    typeof total === 'number' && total !== returned ? ` of ${total} total` : '';
  // `counts.truncated` (digest.ts) is read here too -- the digest already knows the page it
  // returned was cut short, and staying silent about that would omit data the digest carries
  // without inventing anything new.
  const truncatedPhrase = parsed.counts?.truncated ? ' (truncated)' : '';
  const columnsPhrase = describeDigestColumns(parsed.columns);
  return `The ${domain} query returned ${returned} ${rowWord}${totalPhrase}${truncatedPhrase}${columnsPhrase}; the table below has the details.`;
}

/**
 * Appended as a trailing `user` message for the forced-synthesis retry call (case (a) below) only
 * -- never added to `messages` itself, same "outbound copy only" rule as
 * `withFinalRoundAnswerInstruction`'s FINAL_ROUND_ANSWER_INSTRUCTION; see
 * `withNoTextSynthesisInstruction` below for why the role is `user` and not `system`. Every clause
 * is load-bearing
 * for the same reason that instruction's are: "using only the tool results already gathered" and
 * "Do not state anything the results do not show" keep this from becoming a fabrication prompt;
 * "Do not call any tools" is redundant with `tools` being omitted from this call's `streamOptions`
 * but stated anyway so a model that somehow still emits a tool-call-shaped delta reads an explicit
 * instruction not to; "do not say there is nothing to add" directly targets the measured failure
 * this whole mechanism exists to replace.
 */
export const NO_TEXT_SYNTHESIS_INSTRUCTION =
  'The tool call(s) above already returned results, but no written answer followed. Using only ' +
  'the tool results already gathered in this conversation, write 2 to 4 plain sentences that ' +
  'answer the question in its own terms, stating the totals and key observations from those ' +
  'results. If a tool call above was rejected or errored, say what could not be checked. Do not ' +
  'state anything the results do not show. Do not call any tools. Do not say there is nothing ' +
  'to add.';

/**
 * ZERO-ROW sibling of NO_TEXT_SYNTHESIS_INSTRUCTION above, used when the turn's tool calls all came
 * back EMPTY (no non-empty table was ever rendered).
 *
 * The alternative on this path is `buildNoMatchingResultsMessage`'s canned line, which is truthful
 * but question-blind: it never says what the empty result MEANS for what was asked, which for a
 * counting or negative-control question ("how many findings does this agent have") is the entire
 * answer ("none").
 *
 * Worded separately from the non-empty instruction because the honest content is the opposite: the
 * non-empty version asks for totals and observations, this one must NOT invite the model to explain
 * an absence it cannot verify. "state plainly that nothing matched" plus "answer the question in
 * its own terms" is the whole job; "Do not speculate about why" is the load-bearing fence -- an
 * empty result has many possible causes (a filter, a time window, genuinely nothing there) and the
 * digest's own `hint` already says so without the model guessing among them.
 */
export const NO_TEXT_SYNTHESIS_INSTRUCTION_EMPTY =
  'The tool call(s) above returned no matching rows, and no written answer followed. In 1 to 3 ' +
  'plain sentences, state plainly that nothing matched and answer the question in its own terms ' +
  '(for a "how many" question, that means zero), naming the filters that were actually searched. ' +
  'Do not speculate about why the result is empty and do not state anything the results do not ' +
  'show. Do not call any tools. Do not say there is nothing to add.';

/**
 * Delivers the forced-synthesis instruction as a trailing **user** message on the outbound COPY,
 * never as a `system` message and never into `messages` itself.
 *
 * The role is the whole point and must not be "tidied" to `system`: the Anthropic Messages API does
 * not keep system messages inside the message list -- `server/providers/anthropic.ts` filters every
 * `system`-role message out of `messages` and joins them into the request's TOP-LEVEL `system`
 * field, appended after the full system prompt. A `system`-delivered instruction therefore never
 * reaches the conversation tail at all, leaving a `tool_result` as the last conversation entry,
 * which the model is free to treat as a finished turn.
 *
 * A trailing `user` message lands at the tail on EVERY adapter: Anthropic maps a `tool` message to
 * `role: 'user'` too, and consecutive same-role messages are explicitly allowed there (they are
 * combined into one turn), so this is a request the model has to answer rather than a preference
 * buried in the prompt prefix. `withFinalRoundAnswerInstruction` is delivered the same way, for the
 * same reason.
 */
export function withNoTextSynthesisInstruction(
  messages: ChatMessage[],
  tableOnScreen: boolean,
): ChatMessage[] {
  return [
    ...messages,
    {
      role: 'user',
      content: tableOnScreen
        ? NO_TEXT_SYNTHESIS_INSTRUCTION
        : NO_TEXT_SYNTHESIS_INSTRUCTION_EMPTY,
    },
  ];
}

/** What `synthesizeNoTextFallback` reports back to `orchestrate` once it finishes -- mirrors
 * `Stage1Result`'s shape/reasoning: `usage` is `undefined` on every path that never actually made
 * the retry call (no digest to synthesize from, or the turn was aborted), so `addUsage` (which
 * treats `undefined` as zero) never fabricates spend for a call that never happened. */
export interface NoTextSynthesisResult {
  usage?: StreamUsage;
}

/**
 * Fix for round-budget sweep collapse: when a multi-tool sweep turn ends with no model-authored
 * text on EITHER the final-round call (`FINAL_ROUND_ANSWER_INSTRUCTION`) or the one
 * forced-synthesis retry (`NO_TEXT_SYNTHESIS_INSTRUCTION`), the only fallback available was
 * `summarizeDigestForFallback` over a SINGLE digest (`pickDigestForFallback`'s "last non-empty
 * record") -- truthful about that one tool, but silently discarding every OTHER tool call's
 * results the turn already gathered (a 5-successful-call sweep's fallback described only the
 * 5th). That is exactly the "incomplete-without-coverage-statement" failure class the
 * round-budget redesign's final-round instruction exists to prevent, reached here because the
 * DETERMINISTIC last-resort text never covered more than one call to begin with, no matter how
 * well the two model-authored attempts above were prompted.
 *
 * This function replaces that single-digest sentence with a coverage statement spanning EVERY
 * digest recorded this turn: one truthful, digest-derived clause per tool call, so a sweep that
 * gathered 5 results and got no narration still tells the user what was and was not covered,
 * instead of collapsing to the last tool's row count as if that were the whole answer. Still never
 * invents anything the digests themselves do not carry -- same non-fabrication contract as
 * `summarizeDigestForFallback`, just applied per-record instead of to one record only.
 */
export function summarizeDigestsForFallback(records: DigestRecord[]): string {
  if (records.length === 0) {
    return 'The results are shown in the tables below.';
  }
  if (records.length === 1) {
    return summarizeDigestForFallback(records[0]);
  }
  const clauses = records.map(record => {
    let parsed: SummarizableDigestForFallback | undefined;
    try {
      parsed = JSON.parse(record.content) as SummarizableDigestForFallback;
    } catch {
      parsed = undefined;
    }
    const returned = parsed?.counts?.returned;
    if (typeof returned !== 'number') {
      return `${record.toolName} (see table)`;
    }
    const total = parsed?.counts?.total;
    const rowWord = returned === 1 ? 'row' : 'rows';
    const totalPhrase =
      typeof total === 'number' && total !== returned
        ? ` of ${total} total`
        : '';
    const truncatedPhrase = parsed?.counts?.truncated ? ' (truncated)' : '';
    return `${record.toolName}: ${returned} ${rowWord}${totalPhrase}${truncatedPhrase}`;
  });
  return `Retrieved results for all ${
    records.length
  } requested parts of this question -- ${clauses.join(
    '; ',
  )}; the tables below have the full details for each.`;
}

/** Picks the digest `summarizeDigestForFallback` should describe: the LAST record whose own
 * `counts.returned` is a positive number, falling back to the last record overall when none
 * qualifies (an unparseable/shape-mismatched digest, which `summarizeDigestForFallback` already
 * degrades gracefully for). Plain "last of the array" would risk describing a LATER zero-row tool
 * call's digest even though an EARLIER one this same turn produced the non-empty table that got
 * `sawNonEmptyTable` (and therefore this whole mechanism) triggered in the first place -- a
 * technically-true-about-the-wrong-tool sentence is still a regression against the honest goal
 * here. */
function pickDigestForFallback(
  digests: DigestRecord[],
): DigestRecord | undefined {
  for (let i = digests.length - 1; i >= 0; i -= 1) {
    const record = digests[i];
    try {
      const parsed = JSON.parse(
        record.content,
      ) as SummarizableDigestForFallback;
      if (
        typeof parsed.counts?.returned === 'number' &&
        parsed.counts.returned > 0
      ) {
        return record;
      }
    } catch {
      // Unparseable -- not a match, keep scanning further back.
    }
  }
  return digests[digests.length - 1];
}

/**
 * Forced synthesis (a): the ONE retry this mechanism is allowed per turn (bound enforced by the
 * caller's `noTextSynthesisAttempted` flag, not here -- this function itself is stateless and
 * would happily run again if called again, same division of responsibility as
 * `shouldConsiderDeferredOffer`/its caller). Called only when `orchestrate` has already
 * established `toolUsedThisTurn` and recorded at least one digest -- i.e. exactly the case where
 * NO_ANALYSIS_TEXT_MESSAGE would otherwise be handed out regardless of whether there was
 * something to analyze. `opts.tableOnScreen` says whether the turn ended with a NON-EMPTY table or
 * with every call empty: both are synthesizable from their digests, they just need different
 * instructions, different suppression and a different last resort.
 *
 * Makes ONE extra `adapter.chatStream` call with NO `tools` offered (structurally unable to
 * re-enter the tool loop -- (c)'s "cannot re-enter" bound), asking the model to narrate the
 * results already gathered. Every delta is run through the SAME scrub/depseudonymize/
 * table-suppression pipeline the turn's own rounds use, so the retry's text is held to the exact
 * same privacy and duplicate-table guarantees as everything else this turn streamed.
 *
 * (b): if the retry call errors, or ends without ever producing meaningful text, this falls back to
 * `opts.lastResortMessage` -- by default the digests' own coverage statement, and on a zero-row turn
 * the caller's `noTextFallbackMessage` copy -- truthful and deterministic either way, never the
 * layout-lying NO_ANALYSIS_TEXT_MESSAGE.
 *
 * (c) abort-safety: checked before the retry call is even attempted -- an aborted turn makes no
 * extra provider call, though it still yields the deterministic sentence below (never an
 * extra MODEL-authored answer -- that is the "no extra text" this guarantees); the caller's own
 * `!roundSawAnyDelta` guard chain already covers the (rare, defensive) case of `digests` being
 * empty.
 */
export async function* synthesizeNoTextFallback(
  adapter: ProviderAdapter,
  providerConfig: ProviderConfig,
  messages: ChatMessage[],
  signal: AbortSignal,
  privacyCtx: PrivacyContext | undefined,
  digests: DigestRecord[],
  // Optional; the defaults are "non-empty table on screen, last resort = the digest coverage
  // statement".
  //  - `tableOnScreen: false` is the zero-row turn: it selects the empty-result instruction AND
  //    leaves the duplicate-table suppressor OFF -- with no table rendered there is no duplicate to
  //    suppress, and an active suppressor would silently eat a legitimate table the model writes
  //    (see `MarkdownTableSuppressor`'s contract).
  //  - `lastResortMessage` is what case (b) yields when the retry produces nothing, so the caller
  //    keeps owning the fallback-copy decision (`noTextFallbackMessage`) instead of this function
  //    growing a second copy of it.
  opts?: { tableOnScreen?: boolean; lastResortMessage?: string },
): AsyncGenerator<StreamEvent, NoTextSynthesisResult, void> {
  const lastDigest = pickDigestForFallback(digests);
  const tableOnScreen = opts?.tableOnScreen ?? true;
  const lastResortMessage =
    opts?.lastResortMessage ?? summarizeDigestsForFallback(digests);

  // Abort-safety (c) and the defensive no-digest case: neither attempts the extra call.
  if (signal.aborted || !lastDigest) {
    if (lastDigest) {
      // Covers EVERY digest gathered this turn, not just the last one -- see
      // `summarizeDigestsForFallback`'s doc comment.
      yield { type: 'delta', content: lastResortMessage };
    }
    return { usage: undefined };
  }

  // Outbound scrub, same as every other adapter.chatStream call this turn makes. The instruction
  // itself is appended AFTER the scrub (`withNoTextSynthesisInstruction` below): it is static
  // first-party text with no user data in it, so there is nothing for the pseudonymizer to find,
  // and running it through would only risk `prescanAndMint` mangling a word in our own copy --
  // the same reasoning `withFinalRoundAnswerInstruction` records for FINAL_ROUND_ANSWER_INSTRUCTION.
  const scrubbedMessages = privacyCtx
    ? scrubMessagesForProvider(messages, privacyCtx.pseudonymizer)
    : messages;
  const outboundMessages = withNoTextSynthesisInstruction(
    scrubbedMessages,
    tableOnScreen,
  );
  // Inbound un-scrub and duplicate-table suppression, same pipeline as every round of the main
  // loop. The suppressor starts ACTIVE only when a non-empty table is already on screen: on a
  // zero-row turn there is nothing rendered to duplicate, so suppression must stay off rather than
  // silently swallowing a table the model legitimately writes.
  const depseudonymizer = privacyCtx
    ? new StreamDepseudonymizer(privacyCtx.pseudonymizer)
    : undefined;
  const tableSuppressor = tableOnScreen
    ? new MarkdownTableSuppressor()
    : undefined;

  /** Same drain contract as the main loop's `drainRoundBuffers` (this file, ~line 1678): flushes
   * the depseudonymizer's leftover buffer THROUGH the table suppressor before releasing the table
   * suppressor's own remainder, so held-back text is never lost on any exit from the loop below --
   * error, mid-stream abort, or a normal 'done'. */
  function drainBuffers(): string {
    let text = depseudonymizer ? depseudonymizer.flush() : '';
    if (tableSuppressor) {
      text = tableSuppressor.push(text) + tableSuppressor.flush();
    }
    return text;
  }

  let producedText = false;
  let usage: StreamUsage | undefined;

  try {
    for await (const event of adapter.chatStream(
      providerConfig,
      outboundMessages,
      signal,
      {}, // (c): no `tools` offered -- this round cannot re-enter the tool loop.
    )) {
      if (signal.aborted) {
        // Mid-stream abort: still drain whatever the depseudonymizer/table suppressor are
        // holding back so the client is never left mid-word or mid-table-row -- the same reason
        // every exit of the main round loop routes through `drainRoundBuffers`.
        const trailing = drainBuffers();
        if (trailing) {
          if (hasMeaningfulText(trailing)) {
            producedText = true;
          }
          yield { type: 'delta', content: trailing };
        }
        return { usage };
      }
      if (event.type === 'delta') {
        // Reasoning-channel fallback text (openai-compatible.ts's `reasoningFallback`) is raw
        // deliberation, not an answer -- same reason the main loop's deferred-offer interception
        // excludes it (`roundHadReasoningFallback`). Letting it set `producedText` here would let
        // deliberation displace the truthful digest sentence, which is strictly worse.
        let content = depseudonymizer
          ? depseudonymizer.push(event.content)
          : event.content;
        if (content && tableSuppressor) {
          content = tableSuppressor.push(content);
        }
        if (content) {
          if (hasMeaningfulText(content) && !event.reasoningFallback) {
            producedText = true;
          }
          yield { type: 'delta', content };
        }
        continue;
      }
      if (event.type === 'done') {
        const trailing = drainBuffers();
        if (trailing) {
          if (hasMeaningfulText(trailing)) {
            producedText = true;
          }
          yield { type: 'delta', content: trailing };
        }
        usage = event.usage;
        break;
      }
      if (event.type === 'error') {
        // (b): flush first -- any text already streamed this retry must not be lost -- then fall
        // through to the deterministic digest sentence below (only if that flush did not already
        // count as `producedText`). Never surfaced to the client as an 'error' event, since the
        // turn already has a complete, non-empty table on screen and this retry is purely
        // additive narration, not something the user asked for.
        const trailing = drainBuffers();
        if (trailing) {
          if (hasMeaningfulText(trailing)) {
            producedText = true;
          }
          yield { type: 'delta', content: trailing };
        }
        break;
      }
      // tool_call/status/table/etc. should never occur (no tools were offered) -- ignore
      // defensively rather than crash a fallback path whose entire job is to never leave the
      // turn worse off.
    }
  } catch {
    // Same policy as the 'error' branch above: flush before swallowing so a retry that had
    // already produced meaningful text does not get truncated mid-word/mid-row.
    const trailing = drainBuffers();
    if (trailing) {
      if (hasMeaningfulText(trailing)) {
        producedText = true;
      }
      yield { type: 'delta', content: trailing };
    }
  }

  if (!producedText) {
    // Same coverage-statement fix as the abort-safety branch above -- describe every tool call
    // this turn gathered, not only the one `pickDigestForFallback` chose.
    // On a zero-row turn the caller supplies `noTextFallbackMessage`'s own copy instead, so a
    // failed retry there degrades to EXACTLY the pre-change answer, never to a "the table below has
    // the details" sentence pointing at an empty table.
    yield { type: 'delta', content: lastResortMessage };
  }

  return { usage };
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
 * Metadata-fallback RELEVANCE gate (see the fallback's own doc comment
 * below): the name-based path's `\bname\b` match is itself the relevance gate that keeps
 * `OFFER_MARKER_RE`'s near-universal closing vocabulary ("let me know", "happy to", "i can") from
 * force-calling a tool on ordinary boilerplate -- "Let me know if you need anything else." matches
 * `OFFER_MARKER_RE` but names no tool, so the name-based path is inert on it. The metadata fallback
 * has no name to match against, so without an equivalent gate it force-calls
 * `CHAIN_PAIRS[lastSuccessfulToolName][0]` on THAT EXACT sentence and on every other unnamed
 * closer, on every turn that ran a `CHAIN_PAIRS`-keyed summary tool. This requires the offer
 * sentence to actually reference MORE/SPECIFIC/FURTHER data before the fallback may fire --
 * a generic "let me know if you need anything else" has none of that vocabulary and now degrades
 * to base behaviour, same as an unrecognized offer phrasing already does.
 */
const METADATA_FALLBACK_DETAIL_RE =
  /\b(more|further|specific|additional|extra|detail|details|breakdown|full list|individual|underlying|exact|failing checks)\b/i;

/**
 * Metadata-fallback ESCAPE-HATCH exclusion: `FORCE_EXEMPT_TOOL_NAMES`
 * only protects the `search_wazuh_data` offer when the offer NAMES it -- prompts.ts's designed
 * offer ("say so and offer to query it with search_wazuh_data instead of speculating" for a field
 * a typed result lacks) can be paraphrased without the literal tool name ("I can run a custom
 * query for those fields if you'd like"), which the name-based exemption cannot see at all. That
 * paraphrase still matches `METADATA_FALLBACK_DETAIL_RE` above (it says "those fields"), so
 * without this second gate it would be force-called into whatever `CHAIN_PAIRS` detail tool the
 * last summary tool happens to declare -- voiding the exemption's intent for exactly the phrasing
 * class it exists to cover. Matches the field/custom-query vocabulary prompts.ts's own escape-hatch
 * instruction uses, so an offer shaped like that instruction degrades to base behaviour here
 * instead of being misattributed to an unrelated chained tool.
 */
const METADATA_FALLBACK_ESCAPE_HATCH_RE =
  /\b(custom quer(?:y|ies)|raw quer(?:y|ies)|those fields|that field|these fields|specific fields|additional fields|missing fields)\b/i;

/**
 * DEFERRED-OFFER INTERCEPTION, detection half (see `orchestrate`'s
 * `forcedFollowUpTool`/`forcedFollowUpSpent` for the delivery half). The measured failure this
 * exists for: a turn correctly summarizes a tool's results, then ends the turn asking permission
 * to run an obvious next tool ("I can run get_sca_checks to list the failing checks — want me
 * to?") instead of just running it, even though tool rounds remain unspent. Round-budget answer
 * fixes at the PROMPT layer measured 0/3 on this exact class (see this file's own
 * FINAL_ROUND_ANSWER_INSTRUCTION precedent) -- this is the
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
 *    actual name boundary. The sentence-level offer gate is what
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
 * further") is undetectable at this layer, since the name-token gate only covers offers that
 * name a tool. The METADATA FALLBACK below narrows that
 * residual for the specific case where the un-named offer follows a `CHAIN_PAIRS`-declared summary
 * tool (server/tools/router.ts) -- it still degrades to base behaviour for any offer that names no
 * tool AND whose preceding summary tool has no chain-pair entry; (b) `OFFER_MARKER_RE` is a finite
 * vocabulary over the model's own prose, so an unusual offer phrasing simply degrades to base
 * behaviour (the turn ends on the offer) -- the trigger is end-to-end only as deterministic as the
 * text it reads, which is why the DELIVERY half (`toolChoice: {name}`) is the part this item
 * counts as guaranteed.
 */
export function findOfferedFollowUpTool(
  roundText: string,
  offeredTools: ToolSpec[],
  executedToolNames: ReadonlySet<string>,
  lastSuccessfulToolName?: string,
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
  // "candidate" and force-called it.
  const mentioned = offeredTools.filter(tool => {
    const nameRe = new RegExp(`\\b${tool.name}\\b`);
    return offerSentences.some(sentence => nameRe.test(sentence));
  });
  if (mentioned.length === 0) {
    // METADATA FALLBACK: offer-shaped text exists, but
    // it names NO tool at all -- e.g. "I can pull the specific failing checks if you'd like" gives
    // the model no tool token for the name-based gate above to catch. Fall back to
    // `CHAIN_PAIRS` (server/tools/router.ts), keyed by the LAST tool that succeeded THIS turn: a
    // summary tool (e.g. get_sca_results -> get_sca_checks) whose result the round text is
    // narrating right before the vague offer is exactly this shape. Bounded by the same
    // three gates the name-based path applies -- offered this turn, not the suggest-discover
    // handoff, not already executed -- PLUS two gates the name-based path does not need because a
    // named tool IS its own relevance/exemption signal: the offer sentence must reference
    // more/specific/further data (METADATA_FALLBACK_DETAIL_RE) and must not be the field/
    // custom-query phrasing the search_wazuh_data escape hatch is designed to produce
    // (METADATA_FALLBACK_ESCAPE_HATCH_RE) -- so an un-chained (or already-run) summary tool, a
    // generic closing sentence, or an unnamed search_wazuh_data-shaped offer all degrade to base
    // behaviour exactly like an unrecognized offer phrasing does.
    if (!lastSuccessfulToolName) {
      return undefined;
    }
    // Relevance gate (see METADATA_FALLBACK_DETAIL_RE/METADATA_FALLBACK_ESCAPE_HATCH_RE's doc
    // comments above): at least one offer-shaped sentence must ALSO reference more/specific/
    // further data, and that same sentence must NOT be the field/custom-query phrasing the
    // search_wazuh_data escape hatch is designed to produce. Without this, every unnamed offer
    // sentence -- including ordinary closing boilerplate like "Let me know if you need anything
    // else." -- would force-call CHAIN_PAIRS[lastSuccessfulToolName][0] purely because
    // OFFER_MARKER_RE's closing-phrase vocabulary matched somewhere in the round.
    const relevantOfferSentences = offerSentences.filter(
      sentence =>
        METADATA_FALLBACK_DETAIL_RE.test(sentence) &&
        !METADATA_FALLBACK_ESCAPE_HATCH_RE.test(sentence),
    );
    if (relevantOfferSentences.length === 0) {
      return undefined;
    }
    const offeredNames = new Set(offeredTools.map(tool => tool.name));
    for (const detailToolName of CHAIN_PAIRS[lastSuccessfulToolName] ?? []) {
      if (
        offeredNames.has(detailToolName) &&
        detailToolName !== SUGGEST_DISCOVER_QUERY_TOOL.name &&
        !FORCE_EXEMPT_TOOL_NAMES.has(detailToolName) &&
        !executedToolNames.has(detailToolName)
      ) {
        return detailToolName;
      }
    }
    return undefined;
  }
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
 * Extracts the bounded error string from a `{error: "..."}` tool-result payload, or `undefined`
 * when `content` is not that shape (same shape test as `isToolResultError` -- kept as a separate
 * function rather than having that one return the string too, so its existing boolean call sites
 * are untouched).
 *
 * WHY THIS EXISTS: `get_field_values`'s own `buildRequest` already throws a specific, genuinely
 * useful error for an unknown field or an invalid field/family pairing -- "Closest known fields:
 * host.os.platform, ..." for a typo, "Valid surfaces: findings, events" for a wrong family. Before
 * this fix, that message reached `messages` as the tool-result content (so the MODEL could read
 * it), but if the model's own next turn produced no text, the deterministic fallback
 * (`buildNoMatchingResultsMessage`) discarded it entirely and substituted the generic "No matching
 * results were found for that query" sentence -- indistinguishable, to the user, from a genuine
 * zero-row search. A rejected/errored call and an executed-but-empty one are different findings
 * ("the request itself was invalid" vs. "the request was valid and nothing matched") and deserve
 * different copy.
 */
function extractToolErrorMessage(content: string): string | undefined {
  try {
    const parsed: unknown = JSON.parse(content);
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      typeof (parsed as Record<string, unknown>).error === 'string'
    ) {
      return (parsed as Record<string, unknown>).error as string;
    }
  } catch {
    // Not JSON, or not the error shape -- no message to extract.
  }
  return undefined;
}

/**
 * The deferred-offer interception's round-level gate, extracted as a pure function so it is
 * testable without scripting a whole turn. Under the cost budget (MAX_TOOL_ROUNDS=6 plus
 * the cost/context/futility triggers), this IS load-bearing: `round < maxRounds - 1` alone admits
 * several rounds, and the actual number that offer tools is additionally gated by budget/futility
 * state this function does not see, same as `willBeFinalRound` above -- this gate is intentionally
 * the coarser of the two, since a missed interception opportunity just degrades to base behaviour
 * (the turn ends on the offer), unlike `retryRoundAvailable`'s stricter requirement.
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
 * server/settings/types.ts's `AssistantSettingsAttributes`). */
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
 * SECURITY PRINCIPLE (replay-leak fix, live-proven gap): the SERVER NEVER TRUSTS client-replayed
 * content to already be protected. Two trust boundaries exist here — the tool digest reaching the
 * provider (`applyFieldPolicy` in privacy.ts, server-internal, unaffected by any of this) and this
 * function's boundary, CLIENT -> SERVER REPLAY: the browser hands back real-valued `assistant`
 * prose, `toolCalls[].arguments` (kept in REAL form server-side by design — see chat-history.ts),
 * and a resumed conversation's whole history, and the server used to assume the client-held
 * pseudonym map (re-seeded into `pseudonymizer` from the request body) already protects it. That
 * map is emptied by two entirely ordinary client actions: resuming a saved conversation
 * (chat-page.tsx's `applyLoadedConversation`, `setPseudonymMap([])`), and — far more likely in
 * practice, since privacy ships OFF by default (index-settings-provider.ts's
 * `privacyDefaultOn: false`) — a user chatting with privacy off, then toggling it ON mid-
 * conversation, which resends the ENTIRE accumulated real-valued history against a map that has
 * never minted anything. Against an empty/stale map, a pure map-SUBSTITUTION pass (`applyToText`,
 * `applyToObject`) is a no-op by construction — there is nothing yet to substitute. So EVERY inbound
 * role/shape now gets an unconditional SHAPE SCAN (`prescanAndMint`/`prescanAndMintToolContent`,
 * IPv4/IPv6/dotted-FQDN) first, independent of what the map does or doesn't contain, with the map
 * substitution layered on top as a reuse/consistency optimization, never as the sole mechanism this
 * boundary depends on. `user`/`tool` content already had this (see "First-mention pre-scan" below);
 * `assistant` content and `toolCalls[].arguments` did not, and are fixed by this same principle.
 *
 * WIRE-PROOF FOLLOW-UP (AI/qa/wire-proof-v35/capture.jsonl): the shape scan above has a real blind
 * spot — a bare, non-dotted real value (most commonly a Wazuh AGENT NAME, e.g. `wazuh-aio-5`) has
 * no shape a regex can single out, and the field policy that would normally anonymize
 * `wazuh.agent.name` only ever runs when a digest is CREATED, never when a client-supplied one is
 * REPLAYED. Rather than trying to shape-scan harder, the owner-chosen fix is structural: a digest
 * or assistant-prose history entry captured while privacy was OFF is never resent at all once
 * privacy is ON for the CURRENT turn — see `excludePrivacyOffHistory`'s doc comment
 * (common/chat-history.ts) for the exact mechanism, which THIS function's caller (below,
 * `initialMessages`) applies as the server-side authority before any of this function even runs.
 * Practical consequence, worth being explicit about: turning privacy ON mid-conversation
 * intentionally COSTS CONTEXT — the model loses its own prior tool results (and, for the same
 * privacy-off turns, its own prior narration) and may re-run a query it already ran, rather than
 * risk resending real-valued history disguised as safe.
 *
 * ONE DELIBERATE EXCEPTION to "EVERY inbound role/shape": below, `toolCalls.map(call => ({ ...call,
 * arguments: ... }))` spreads `call` before overwriting only `arguments` — so `ToolCall.vendorExtras`
 * / `functionVendorExtras` (common/types.ts) are forwarded completely untouched, no shape scan and
 * no map substitution. This is intentional, not an oversight: those fields are opaque, PROVIDER-
 * origin passthrough blobs (the motivating case is Gemini's `thought_signature`, which the provider
 * rejects the next request outright if it comes back even slightly altered) that must round-trip
 * byte-identical for the adapter contract they exist for to keep working — running them through a
 * scan/substitution pass built for CUSTOMER-origin text would risk corrupting a value this function
 * has no business interpreting at all, for a boundary (provider-issued opaque tokens) that was never
 * customer data to begin with.
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
 * `assistant` content gets the SAME shape-scan-first treatment (see
 * the `else` branch below) — it is no longer `applyToText`-only.
 *
 * For `user` content specifically, `prescanAndMint` alone only mints
 * IPv4/IPv6 addresses and DOTTED hostnames — a BARE hostname the user types without its domain
 * suffix (`dbprod07`), or a username (`jsmith`), has no shape a regex can single out and would
 * otherwise reach the provider verbatim even with privacy on, regardless of whether that same
 * identifier had already been minted from Wazuh data earlier in the conversation (case variance
 * between how the indexer rendered it and how the user retyped it defeats `applyToText`'s
 * case-sensitive exact match). This gap is closed by additionally running `scrubKnownEntities` —
 * the same known-entity dictionary scan `scrubFieldValue`'s `allow-scan` branch already uses —
 * over the pre-scanned user text.
 *
 * Running the general, UNFILTERED `applyToText` pass after `scrubKnownEntities` for `user` content
 * is deliberately NOT done: `applyToText`
 * matches EVERY known value's EXACT case, not just the ones `scrubKnownEntities` just replaced:
 * a value minted under the generic VAL kind (the escape hatch's fail-closed default for a field
 * with no host/ip/user keyword — see `scrubKnownEntities`'s own doc comment) that happens to equal
 * an ordinary English word IN THE SAME CASE it was minted (a lowercase "critical" or "root" is a
 * completely ordinary way to type either word) is a corruption vector for
 * `applyToText` itself, even when `scrubKnownEntities` is restricted with
 * `identifiersOnly: true` below. For `user` content, `applyToText`'s unfiltered pass is therefore
 * REMOVED entirely rather than layered on top: `scrubKnownEntities({ identifiersOnly: true })`
 * already subsumes everything `applyToText` would do FOR THE KINDS this path trusts (its
 * case-insensitive boundary match is a strict superset of `applyToText`'s case-sensitive one), and
 * a freshly-minted IP/FQDN from `prescanAndMint` above is already substituted in place by that same
 * call — there is nothing left for a further `applyToText` pass to legitimately catch that
 * `identifiersOnly` did not already deliberately exclude. The accepted residual: a `user` message
 * that happens to retype, EXACTLY, some OTHER already-minted VAL/URL-kind value (e.g. a full
 * `process.command_line` string) no longer gets masked via this path — the same class of residual
 * `scrubKnownEntities`'s own doc comment already documents for VAL/URL kinds, just extended from
 * "never scanned" to "never scanned OR exact-matched" for `user` content specifically. `tool`/
 * `assistant` content is unaffected: only the `user` branch below skips this call.
 *
 * What this closes: a previously-minted entity (any kind — HOST/IP/USER/VAL — from Wazuh tool data,
 * or from a prior `user` message) retyped bare, in ANY casing, later in the SAME MOUNTED SESSION —
 * NOT "the same conversation" in the sense of the conversation record stored server-side. The
 * dictionary this closes against lives entirely client-side (chat-page.tsx's `pseudonymMap`
 * useState) and is explicitly reset to empty both on `handleNewConversation` and on loading a
 * conversation's history back from storage (chat-page.tsx:1347's `setPseudonymMap([])` inside the
 * conversation-restore path), and is lost outright on unmount (this component — the chat flyout's
 * contents — unmounts whenever the flyout closes). So the precise residual is: reopen the flyout,
 * or reload/reopen a stored conversation, and its restored history is RE-SENT to this same function
 * with a freshly empty pseudonym map — every identifier that conversation ever minted has to be
 * re-discovered (shape scan only; the dictionary scan below has nothing left to match) before it is
 * masked again, exactly as if the conversation were brand new.
 *
 * For `user` content specifically, `scrubKnownEntities` is called
 * with `{ identifiersOnly: true }` — narrower than the dictionary scan `scrubFieldValue`'s
 * `allow-scan` branch runs over already-curated tool-value fields — because arbitrary user prose
 * has no field-policy review behind it at all; see `scrubKnownEntities`'s own doc comment for the
 * exact IP/HOST/USER-kind + identifier-shape filter this applies and why.
 *
 * What this does NOT close (the accepted residual — see `scrubKnownEntities`'s own doc comment for
 * why a general bare-token masker is deliberately not attempted): a bare identifier that has never
 * been minted anywhere in this session — the very first time the user types it, or the first retype
 * after a flyout reopen/conversation reload emptied the map — has no dictionary entry to match and
 * no recognizable shape, so it reaches the provider unmasked. A pasted secret/credential is the
 * same residual: nothing here classifies free text as sensitive by content, only by prior mint or
 * IP/FQDN shape.
 *
 * A SECOND, honestly-documented residual in the OPPOSITE direction (over-masking, a quality issue
 * rather than a leak): `scrubKnownEntities`'s `IDENTIFIER_STOP_WORDS` list is curated and short, not
 * exhaustive. The dominant real-world instance of this residual — see
 * `looksLikeIdentifierValue`'s own doc comment for the live-verified repro and the length/kind
 * mitigation applied — is a SHORT, plain process/file/package NAME minted as HOST via
 * `inferPseudonymKind`'s bare-`.name`-segment rule (`process.name`/`file.name`/`package.name`/
 * `service.name`/`group.name` all qualify): common Unix command names like "top"/"find"/"make"/
 * "less" are exactly this shape, which is why that mitigation exists. What that mitigation does
 * NOT close, and remains an honest residual, is any LONGER (>= 5 char) or non-`*.name`-sourced
 * ordinary word not on the stop-list — "database", "primary", "backup", "cluster", and plenty of
 * others — that happens to have been minted under the HOST/USER kind and is still masked if the
 * user later retypes it in an unrelated sentence. This is the accepted trade-off of a curated
 * stop-list (plus the length/kind mitigation) over either extreme (a raw length/shape floor, which
 * under-masked real short identifiers — see `IDENTIFIER_STOP_WORDS`'s own doc comment for why that
 * was tried and reverted — or no filter at all, which was the original defect): some sentence
 * corruption on an uncommon word is preferable to a real short identifier (a username like `jdoe`,
 * a hostname like `titan`) reaching the provider unmasked.
 */
// Exported purely so a colocated test can drive this directly with a scripted Pseudonymizer,
// same rationale as this file's exported chatRequestMessageSchema.
export function scrubMessagesForProvider(
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
      // Shape scan (prescanAndMint) THEN known-entity dictionary scan (scrubKnownEntities,
      // catches a previously-minted identifier retyped bare/in different casing) — see this
      // function's doc comment for the residual this does not cover.
      // `identifiersOnly: true` restricts the dictionary scan to IP/HOST/USER-kind,
      // identifier-shaped entries — arbitrary user prose has no field-policy review behind it, so
      // this must not treat every string the pseudonymizer ever minted as a search-and-replace
      // target (see scrubKnownEntities's doc comment for the exact filter and the corruption this
      // closes). The general, UNFILTERED `applyToText` pass is deliberately NOT run for `user`
      // content — see this function's doc comment above for why that reintroduces the same
      // corruption `identifiersOnly` closes.
      content = scrubKnownEntities(
        prescanAndMint(message.content, pseudonymizer),
        pseudonymizer,
        { identifiersOnly: true },
      );
    } else if (message.role === 'tool') {
      content = pseudonymizer.applyToText(
        prescanAndMintToolContent(message.content, pseudonymizer),
      );
    } else {
      // This is `assistant` content — the model's OWN prior narration,
      // which the client resends verbatim on every subsequent turn as part of the accumulated
      // history (never persisted/re-scrubbed server-side in between). An unconditional shape scan
      // (`prescanAndMint`) runs FIRST, not `applyToText` alone, which is a SUBSTITUTION, not a
      // scan: it can only replace a value this
      // `pseudonymizer` instance already holds a mapping for. The server has no way to verify the
      // client-held pseudonym map it was seeded from is non-empty or even accurate for THIS
      // content — a user can toggle privacy mode ON mid-conversation (privacy ships OFF by
      // default, see index-settings-provider.ts's `privacyDefaultOn: false`), at which point every
      // assistant message accumulated so far is real-valued prose that has never been scrubbed by
      // anything, and gets resent with an effectively empty map. Closed the same way the `user`
      // and `tool` branches already are: an unconditional shape scan (`prescanAndMint`) runs
      // FIRST, regardless of what the map does or does not contain, so a real IP/dotted-FQDN in
      // replayed assistant prose is caught even with a map that has nothing relevant in it.
      // Principle (see this function's header doc comment too): the server never trusts
      // client-replayed content to already be protected — every inbound role gets an
      // unconditional shape scan; the pseudonym map is a REUSE/consistency optimization on top of
      // that, never the sole mechanism a boundary depends on.
      content = pseudonymizer.applyToText(
        prescanAndMint(message.content, pseudonymizer),
      );
    }
    return {
      ...message,
      content,
      ...(message.toolCalls
        ? {
            toolCalls: message.toolCalls.map(call => ({
              ...call,
              // Tool-call arguments are kept in REAL form server-side by
              // design (see chat-history.ts's doc comments on why — the client needs real-valued
              // arguments to render the tool-call panel, and `reverseObject` puts them back to
              // real form for that on the way out). chat-history.ts's own doc comment is explicit
              // that this is safe ONLY because `scrubMessagesForProvider` re-scrubs them before
              // every outbound call — i.e. THIS function is the one place that promise has to
              // hold. `applyToObject` alone is a pure substitution against the pseudonymizer's
              // map, same limitation as `applyToText` above: against an empty/stale map (privacy
              // toggled on mid-conversation, or a resumed conversation) it is a no-op, and a real
              // IP/hostname sitting in an earlier tool call's arguments would reach the provider
              // verbatim. Closed with the same unconditional shape-scan-first principle used above,
              // applied to every string leaf of the arguments object via `deepMapStrings`-over-
              // `prescanAndMint` (reusing `Pseudonymizer.applyToObject`'s own deep-map machinery,
              // just with the shape scan as the mapping function) before the existing
              // map-substitution pass.
              arguments: pseudonymizer.applyToObject(
                deepMapStrings(call.arguments, value =>
                  prescanAndMint(value, pseudonymizer),
                ) as Record<string, unknown>,
              ),
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
  // Wire-proof fix (common/types.ts's `ChatMessage.privacyEnabled` doc comment): the client resends
  // this on every replayed history entry so `excludePrivacyOffHistory` (common/chat-history.ts) can
  // fail closed on a privacy-off-captured digest/prose message once privacy is on for this request.
  // `@osd/config-schema` rejects unknown keys by default, so this needs an explicit place here too.
  privacyEnabled: schema.maybe(schema.boolean()),
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

      // Reads go through the internal user (server/settings/ai-providers-client.ts's `get`) — see
      // that class's doc comment for why: the underlying endpoint requires
      // `plugin:wazuh/ai_assistant/settings/read`, but any authenticated dashboard user must be
      // able to chat with whichever provider they select.
      const stored = await context.wazuh_ai_assistant.aiProviders
        .get(context, providerId)
        .catch(() => undefined);
      if (!stored) {
        logger.error(`wazuhAiAssistant: unknown provider ${providerId}`);
        return response.notFound({
          body: { message: `Unknown provider "${providerId}"` },
        });
      }
      const providerAttributes = stored.attributes;

      // Decrypt-on-read (server/crypto/api-key-cipher.ts): the document may hold `enc:v1:`
      // ciphertext (AAD-bound to `providerId`, the id this exact document was fetched by
      // above) — anything else (a legacy PLAINTEXT key from a pre-release build) makes decrypt()
      // throw: plaintext keys are never used, the admin must re-enter them. Passing `providerId`
      // here is what makes the substitution-attack detection real for chat: if this document's
      // `apiKey` were ever a ciphertext blob copied in from a DIFFERENT provider's row,
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

      // context.wazuh_ai_assistant.assistantSettings (server/settings/route-handler-context.ts)
      // is this plugin's single AssistantSettingsManager; getOrCreateSettings fans out to every
      // registered provider, each of which reads through the internal user — same split as the
      // provider lookup a few lines up.
      const assistantSettings =
        await context.wazuh_ai_assistant.assistantSettings.getOrCreateSettings(
          context,
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

      // Wire-proof fix (AI/qa/wire-proof-v35/capture.jsonl): the SERVER-SIDE authority for the
      // "never replay privacy-off history once privacy is on" rule -- common/chat-history.ts's
      // `excludePrivacyOffHistory` doc comment has the full mechanism and why the client-side call
      // in `buildOutgoingMessages` is not enough on its own to depend on. Applied to the CLIENT-SENT
      // history only, once, right here, before any of it seeds the orchestration loop's own
      // accumulator -- everything that loop appends afterwards is this request's own live activity,
      // never client-replayed, and is already correctly protected by `scrubMessagesForProvider` on
      // every round regardless.
      const initialMessages: ChatMessage[] = [
        // Per-request only: never persisted, never echoed back by the client. Any system message
        // the client itself sent (it doesn't today) is dropped so ours is always the sole one.
        { role: 'system', content: buildSystemPrompt(nowIso) },
        ...excludePrivacyOffHistory(
          messages.filter(message => message.role !== 'system'),
          privacyEnabled,
        ),
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
 * sums correctly (chat-usage.test.ts) or reading the code by inspection.
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
   * outside the round loop below, so without this field its `done`/usage would be consumed and
   * dropped right here, undercounting every routed turn by however much stage 1 cost.
   * `undefined` on every fallback path that returns before a `done` event is ever read
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

  // `step` classifies this for the browser, which renders a translated label instead of the raw
  // English below (public/components/chat/turn-status.ts). `message` stays exactly what it always
  // was: the eval harness and every log reader still see "Routing…".
  yield { type: 'status', message: 'Routing…', step: 'understanding' };

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
 * Orchestration loop: drives the adapter through tool rounds bounded by whichever of the cost
 * budget, the context-char stop, the futility/all-rejected triggers, or the structural
 * `MAX_TOOL_ROUNDS` backstop fires first (see `willBeFinalRound`), executing every `tool_call`
 * the model emits locally (validate -> guardrails -> execute -> emit
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
  // The most recent REAL tool call this turn attempted to
  // execute (name + real/reversed arguments), regardless of outcome — the only state
  // `noTextFallbackMessage`'s zero-row branch has available to describe WHAT was searched when
  // the model itself never wrote a word (see `describeEmptySearchScope` below, and that
  // function's doc comment for why this must stay mechanism-free). Overwritten on every real
  // tool-call attempt (not just successful ones) so it always reflects the LAST thing this turn
  // actually tried, which is what the empty-result copy is standing in for.
  let lastAttemptedToolCall:
    | { name: string; args: Record<string, unknown>; errorMessage?: string }
    | undefined;
  // True once ANY delta text has happened in the CURRENT round -- see
  // NO_ANALYSIS_TEXT_MESSAGE/NO_MATCHING_RESULTS_MESSAGE/NO_ANSWER_MESSAGE above. `toolUsedThisTurn`
  // picks WHICH fallback copy fits (tables-oriented vs. the generic one) — every no-text ending
  // gets *some* fallback text; see the `!roundSawAnyDelta` branches below. It no longer gates
  // whether a fallback fires at all: a plain no-tool conversational turn that ends with no text is
  // exactly the case a `general`-routed reasoning-only stream produces, and it deserves a
  // sentence, not a silently empty bubble.
  //
  // This flag is round-scoped rather than whole-turn: a whole-turn flag (set once and never
  // cleared) cannot work here. A multi-kind inventory sweep routinely narrates once
  // early ("I checked the agent list... let me pull that data") and then spends every remaining
  // round on back-to-back tool_calls with no further text, so by the time the round budget closes
  // mid-sweep a whole-turn flag would already be permanently `true` from that first round and its
  // `!sawAnyDelta` guards would never fire for the round that actually ends the turn -- exactly the
  // gap the comment above describes wanting ("every no-text ending gets *some* fallback text") but
  // a whole-turn flag cannot deliver, since it never forgets an earlier round's text. Declared here
  // (outside the round loop) but reset to `false` at the TOP of every loop iteration (not
  // re-`let`-declared inside the loop body) so it still holds the LAST round's value once the loop
  // exits, for the post-loop round-budget-exhaustion check.
  let roundSawAnyDelta = false;
  // Round separation for the CLIENT's single message bubble. Every
  // round's text is appended into the same bubble, so a round that narrates before calling a tool
  // ("I'll check the SCA results for this box.") ran straight into the next round's answer with no
  // separator at all -- measured live as "...for it.The most frequent finding...", two sentences
  // fused mid-word, and one bubble restating itself with two different counts. The model cannot fix
  // this: from its side each round is a fresh completion that legitimately starts at column 0.
  // A blank line is the minimum that makes them separate paragraphs in the rendered markdown.
  // Orthogonal to `roundSawAnyDelta` above (a separator decision, not a fallback-selection one) --
  // safe to keep tracking across the same per-round resets.
  let lastTextRound = -1;
  function* separateRoundText(round: number): Generator<StreamEvent> {
    if (lastTextRound !== -1 && lastTextRound !== round) {
      yield { type: 'delta', content: ROUND_TEXT_SEPARATOR };
    }
    lastTextRound = round;
  }
  let toolUsedThisTurn = false;
  // Bounds the suggest_discover_query self-correction loop to ONE retry per turn: the first
  // `unknown_fields` resolution this turn is returned as a tool error instead of a
  // `suggested_query` event, so the model gets one chance to rewrite the call with real field names
  // -- see the `SUGGEST_DISCOVER_QUERY_TOOL.name` branch below. A SECOND `unknown_fields` this turn
  // falls through to the stripped-DSL-plus-disclosure path instead of erroring again: the round
  // loop's own termination (the structural `MAX_TOOL_ROUNDS` cap plus the cost/context/futility
  // budget -- see `willBeFinalRound`) is what actually bounds the loop from spinning forever, but
  // this flag stops it from burning more than one of those rounds on the same self-correction.
  let suggestDiscoverUnknownFieldsRetried = false;
  // DEFERRED-OFFER INTERCEPTION state (detection half is
  // `findOfferedFollowUpTool` above). `executedToolNames` is every REAL tool this turn ran
  // SUCCESSFULLY (added after execution in the real-tool branch below -- never for a
  // rejected/errored call, never for the routing/suggest_discover_query pseudo-tools) -- it is
  // what lets the detector tell "the model is naming a tool it already used" apart from "the
  // model is deferring a NEW one", including the retry case where the earlier attempt failed.
  // `forcedFollowUpTool`, when set, is consumed by exactly the NEXT round's `streamOptions`
  // (forcing `toolChoice:{name:...}` instead of `'auto'`) and cleared immediately after — so a
  // forced call can only ever happen once per detected offer. `forcedFollowUpSpent` bounds this
  // to ONE forced round per WHOLE TURN (not per offer). HONESTY NOTE:
  // load-bearing under the round budget (MAX_TOOL_ROUNDS=6 plus the cost/context/
  // futility triggers) -- several rounds can now genuinely offer tools, so a turn CAN reach the
  // deferred-offer check more than once, and this flag is what keeps the forced round to exactly
  // one per turn. Its bound is pinned through the pure `shouldConsiderDeferredOffer` helper rather
  // than an orchestrate-level script, mirroring `suggestDiscoverUnknownFieldsRetried` right above.
  //
  // DETERMINISTIC vs NOT (state this honestly: code-level fixes are reliable while prompt-level
  // fixes are not): the DETECTION
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
  // The LAST real tool that executed SUCCESSFULLY this turn (set right alongside
  // `executedToolNames.add` below, never for a rejected/errored call) -- feeds the metadata
  // fallback in `findOfferedFollowUpTool` so an offer that names no tool
  // can still be keyed to `CHAIN_PAIRS` by the summary tool the model is narrating.
  let lastSuccessfulToolName: string | undefined;
  let forcedFollowUpTool: string | undefined;
  let forcedFollowUpSpent = false;
  // DUPLICATE-ANSWER LATCH. `true` once a round of THIS turn produced
  // a complete answer on the user's screen and the turn was nevertheless extended by the
  // deferred-offer interception — the one path that grants a further provider call after a round
  // that streamed final text and made NO tool call. Once latched, the final round is given
  // FINAL_ROUND_CONTINUATION_INSTRUCTION instead of the "Now answer the user's question directly"
  // order, which is what made the reported turn ship a second, complete "As noted above…" answer.
  //
  // Deliberately NOT latched by the ordinary `sawToolCall` path: a round that wrote text and then
  // called a tool wrote PARTIAL text ("let me check X"), the user has not been answered yet, and
  // the final round still owes them the whole answer. Set only where the mechanism itself decided
  // to keep the turn alive past a finished answer.
  let answerAlreadyStreamedThisTurn = false;
  // Whole-turn tracking for `shouldEnterFinalRoundEarly` above — `true` once any EARLIER
  // round in this turn had at least one successful (non-rejected/non-errored) tool call, and set
  // when the round loop below should make its NEXT iteration the final round early.
  let hadSuccessfulRoundEarlier = false;
  let forceFinalRoundEarly = false;
  // Independent bound on a turn that NEVER succeeds even once (see
  // `MAX_CONSECUTIVE_REJECTED_ROUNDS`'s doc comment for why the whole-turn tracking above does not
  // cover this shape).
  // Incremented at round-end whenever the round had a real tool call and none of them succeeded;
  // reset to 0 the moment any round succeeds. Deliberately untouched by a round that only ran a
  // pseudo-tool (`suggest_discover_query`/routing) -- those never reach `executeToolCall` and carry
  // no signal about whether the model is "stuck" on real data tools.
  let consecutiveRejectedRounds = 0;
  // CONTEXT-CHAR STOP (see `CONTEXT_CHAR_BUDGET` above): running sum of every
  // `toolResultContentForModel` character count appended to `messages` this turn, across every
  // round -- independent of, and in addition to, the cost-unit budget below (that budget prices
  // BACKEND query weight; this prices PROVIDER CONTEXT, which the cost budget does not see at
  // all). Grows monotonically; never reset mid-turn.
  let cumulativeToolResultChars = 0;
  // TOOL-ROUND COST BUDGET state -- see the doc comments right above
  // `BASE_BUDGET_UNITS`/`HARD_CEILING_UNITS`/`MAX_TOOL_ROUNDS` near the top of this file for the
  // overall shape. `budgetCeiling` starts at the base and is raised
  // ONCE, straight to the hard ceiling, the first time `shouldGrantBudgetExtension` allows it --
  // never incrementally, never past the hard ceiling. `totalSpentUnits` only ever grows (a
  // successful real tool call's cost, `toolCallCostUnits`); a rejected/errored call adds nothing.
  let budgetCeiling = BASE_BUDGET_UNITS;
  let totalSpentUnits = 0;
  // Forces the round AFTER the one that just finished to be the final (tools-off) round --
  // distinct from `forceFinalRoundEarly` above so the two triggers stay independently
  // testable/auditable: this one fires from EITHER the futility stop or a
  // budget exhaustion with no extension granted, never from an all-rejected round (that
  // remains `shouldEnterFinalRoundEarly`'s own, narrower concern -- see `isRoundFutile`'s doc
  // comment for why the two never overlap).
  let budgetForcesFinalRoundEarly = false;
  // Per-TURN latch for the one-and-only-one zero-row widening round (see
  // `shouldGrantZeroRowWideningRound`). Set the first time the grace is granted and never reset, so
  // the turn's second all-zero-row round closes it out like any other futile round -- this latch is
  // the whole bound that keeps the mechanism from becoming a retry loop.
  let zeroRowWideningRoundGranted = false;
  // Enumerable-remaining heuristic: computed ONCE, from the turn's
  // CURRENT (most recent) user message, never re-derived mid-turn (see
  // `extractEnumeratedTargets`'s doc comment for exactly what it does and does not detect).
  // `undefined` when no explicit literal list was found -- the safe default that keeps
  // `shouldGrantBudgetExtension` from ever firing.
  //
  // `initialMessages` is the FULL client-sent conversation
  // history (every turn's messages, resent verbatim -- see this route's `messages.filter` above),
  // not just this turn's question, so taking the FIRST `user` message (the old behavior) returned
  // whatever was asked on turn 1 of the conversation on every later follow-up turn -- gating the
  // extension for, and matching `coveredEnumerationTargets` against, a completely different
  // question's token list. Reversing to find the LAST `user` message is what "the turn's current
  // question" actually means for a resent-history array like this one.
  const currentUserMessage = [...initialMessages]
    .reverse()
    .find(message => message.role === 'user');
  const enumeratedTargets = currentUserMessage
    ? extractEnumeratedTargets(currentUserMessage.content)
    : undefined;
  // Every enumerated-list token (lower-cased) that has appeared in a SUCCESSFUL real tool call's
  // arguments THIS TURN -- grows monotonically, read by `shouldGrantBudgetExtension` at every
  // budget-exhaustion check.
  const coveredEnumerationTargets = new Set<string>();
  // Every `${toolName}|${JSON.stringify(realArguments)}` signature of a SUCCESSFUL real tool call
  // executed so far this turn -- the "duplicate of a previous round's identical query" half of
  // `isRoundFutile`. Approximate by construction (plain `JSON.stringify` key order, not a
  // canonicalized/sorted form): a false negative here (two calls that are semantically identical
  // but serialize differently) merely degrades to "not detected as a duplicate", which is the
  // safe direction -- it costs budget normally instead of wrongly forcing an early stop.
  const executedCallSignatures = new Set<string>();
  // Sum of every provider call's `usage` THIS TURN — the stage-1 routing call (if the router ran)
  // plus every round of the loop below, INCLUDING non-final rounds whose `done` is otherwise
  // suppressed (see the round loop's `if (sawToolCall) { break; }`). Without this, only the last
  // round's usage would reach the client on a multi-round turn. Every call that ends in a tool
  // call (every non-final round, and the stage-1 call above) must hand this accumulator a non-zero
  // usage -- see openai-compatible.ts's `toolCallsFinalized` handling. See chat-usage.ts for why
  // the accumulator helper itself lives in its own dependency-free module.
  let usageTotals = ZERO_USAGE_TOTALS;

  /** Every real tool call's digest yielded this turn, in order -- fed to `synthesizeNoTextFallback`
   * (`summarizeDigestForFallback` reads the LAST one) so the forced-synthesis mechanism below has
   * something truthful to fall back to. Pushed alongside the existing `digest` StreamEvent yield
   * in the real-tool branch, never for the `SUGGEST_DISCOVER_QUERY_TOOL` handoff (which never
   * yields a `digest` event either -- see that branch's own doc comment on why it does not set
   * `toolUsedThisTurn`). */
  const turnDigests: DigestRecord[] = [];

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

  /** FORCED SYNTHESIS (a)/(b)/(c) -- see `synthesizeNoTextFallback`'s doc comment above for the
   * mechanism itself. This closure is the single call site every `!roundSawAnyDelta` exit point
   * below goes through, and it is what enforces (c)'s "at most one retry per turn" bound: the very
   * first qualifying call flips `noTextSynthesisAttempted`, so even though three DIFFERENT exit
   * points in this function each reach `!roundSawAnyDelta` (only one of which can ever fire per
   * turn, since each is itself a terminating exit -- but the flag is kept anyway as a structural,
   * not merely positional, guarantee). Turns that do not qualify (`!toolUsedThisTurn`, or no
   * digest at all to ground a summary in) are untouched -- they still resolve through the original
   * deterministic `noTextFallbackMessage`, exactly as before this mechanism existed. */
  let noTextSynthesisAttempted = false;
  async function* emitNoTextFallback(
    roundsExhausted: boolean,
  ): AsyncGenerator<StreamEvent> {
    const deterministicMessage = noTextFallbackMessage(
      toolUsedThisTurn,
      sawNonEmptyTable,
      roundsExhausted,
      lastAttemptedToolCall,
    );
    // The gate deliberately does NOT require `sawNonEmptyTable`: a zero-row result is still an
    // ANSWER ("none of your agents has a finding matching that") and the digest proving it is
    // already in `turnDigests`. The three bounds that do matter: `toolUsedThisTurn` (a no-tool turn
    // has nothing to synthesise from), at least one digest to ground the answer in, and once per
    // turn. If the retry produces nothing, `lastResortMessage` hands back the deterministic copy,
    // so the floor never drops.
    if (
      toolUsedThisTurn &&
      !noTextSynthesisAttempted &&
      turnDigests.length > 0
    ) {
      noTextSynthesisAttempted = true;
      const result = yield* synthesizeNoTextFallback(
        adapter,
        providerConfig,
        messages,
        signal,
        privacyCtx,
        turnDigests,
        {
          tableOnScreen: sawNonEmptyTable,
          // Only the zero-row case overrides the digest coverage statement: with a real table on
          // screen that statement is the better last resort, because it names every tool call this
          // turn made.
          ...(sawNonEmptyTable
            ? {}
            : { lastResortMessage: deterministicMessage }),
        },
      );
      usageTotals = addUsage(usageTotals, result.usage);
      return;
    }
    yield {
      type: 'delta',
      content: deterministicMessage,
    };
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

  // TERMINATION (prove this loop cannot spin forever):
  //  1. `round` is a plain incrementing counter with a fixed upper bound (`round += 1` every
  //     iteration, loop condition `round <= MAX_TOOL_ROUNDS`) -- this alone already bounds the
  //     loop to at most `MAX_TOOL_ROUNDS + 1` iterations regardless of anything else below, the
  //     same structural guarantee the OLD fixed-round-count design always had.
  //  2. Independently, `totalSpentUnits` (the cost budget) is MONOTONICALLY NON-DECREASING --
  //     every round either adds >=0 to it (a successful real tool call's class-derived cost) or
  //     nothing at all (no successful call) -- and `budgetCeiling` is capped at
  //     `HARD_CEILING_UNITS`, raised there AT MOST ONCE and never lowered. Once
  //     `totalSpentUnits >= budgetCeiling` with no further extension possible (the ceiling
  //     already at its hard maximum), `budgetForcesFinalRoundEarly` latches permanently `true`,
  //     which keeps `isFinalRound` `true` for every subsequent round -- a final round offers no
  //     `tools`, so no further tool call (and therefore no further cost) can occur, making this a
  //     terminating condition on its own, reached in a bounded number of rounds because each
  //     round that keeps the budget open must have spent >=1 unit (a round with zero cost neither
  //     advances the budget toward exhaustion NOR is itself unbounded, per guarantee 1 above).
  // The two guarantees are independent (either alone bounds the loop) and both hold regardless of
  // model behavior, so the loop terminates unconditionally.
  for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
    if (signal.aborted) {
      return;
    }

    // TRUE for exactly the round a deferred-offer interception forced:
    // read by the 'error' branch and the loop-bottom dead-stream guard below, because a FORCED
    // round must never end the turn worse than the clean termination the suppressed offer-round
    // 'done' would have produced on base -- same recorded policy as stage 1 ("a stage-1 failure
    // must not produce a dead turn").
    const forcedRound = forcedFollowUpTool !== undefined;
    // `forceFinalRoundEarly` (set at the end of the PREVIOUS round below) short-circuits
    // the normal `round === MAX_TOOL_ROUNDS` budget check once a fully-rejected round has already
    // followed an earlier successful one this turn — see `shouldEnterFinalRoundEarly`'s doc comment.
    // `budgetForcesFinalRoundEarly` (set at the end of the PREVIOUS round below) is
    // the cost-budget's own early trigger -- either the futility stop or an exhausted budget with
    // no extension granted (see that flag's own declaration above for why it never overlaps
    // `shouldEnterFinalRoundEarly`'s narrower "every call failed" case). `round === MAX_TOOL_ROUNDS`
    // remains the structural backstop that fires regardless of spend. This is the single
    // `willBeFinalRound` predicate (see its doc comment) rather than an inline re-derivation, so
    // the `suggest_discover_query` retry gate below can ask the exact same question about a FUTURE
    // round without drifting out of sync with this one.
    const isFinalRound = willBeFinalRound(
      round,
      forceFinalRoundEarly,
      budgetForcesFinalRoundEarly,
    );
    // Final round: omit `tools` entirely rather than send `{tools, toolChoice: 'none'}`. That hint
    // depends on the model complying with it — Groq's own docs warn some models call a tool anyway
    // and the API then 400s ("Tool choice is none, but model called a tool"), observed on
    // openai/gpt-oss-120b in 1 of 3 runs. With no tools
    // offered there is nothing to call and no compliance to depend on: the adapter's own
    // `if (options?.tools?.length)` guard (openai-compatible.ts/anthropic.ts) already omits
    // `tools`/`tool_choice` from the wire body whenever `tools` is empty/undefined, so this is a
    // structural terminator instead of a request-level one.
    const streamOptions: ChatStreamOptions = isFinalRound
      ? {}
      : {
          tools,
          // DEFERRED-OFFER INTERCEPTION delivery: when the PREVIOUS round's
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
          // malformed tool calls. Only set when this
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
    // Final round of a tool-using turn: ask for the answer. Dropping `tools` above
    // terminates the tool loop, but on its own it only stops the model from CALLING anything — it
    // never asks for a conclusion. The model is handed a transcript of tool results with no
    // outstanding request, so "I already presented the data, nothing to add" is a rational
    // completion rather than a malfunction, and the turn ends with no text at all: measured on
    // openai/gpt-oss-120b over a 40-question analyst-persona bank, 6/40 turns ended on the
    // `!roundSawAnyDelta` fallback below, every one with the same 4-tool-call signature (the 3
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
      answerAlreadyStreamedThisTurn,
    );
    // Inbound un-scrub: this is why the ANSWER the analyst reads carries real hostnames/IPs even
    // with privacy mode on — every delta is run back through the pseudonym map here, so `HOST_1`
    // becomes the real hostname again before it leaves the server. Pseudonyms exist for the provider
    // request above, not for the reader; the field policy's boundaries are spelled out
    // in server/tools/privacy.ts's module header.
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
    // Reset every round -- see `roundSawAnyDelta`'s declaration above the loop for why this is a
    // reset (not a fresh `let`): it must still hold this iteration's value once the loop exits.
    roundSawAnyDelta = false;
    // Deferred-offer interception, per-round state: `roundText` is every
    // delta this round actually yielded to the client (main deltas plus both trailing-buffer
    // flushes), reset fresh each round so a PRIOR round's text can never be mistaken for THIS
    // round's offer. `forcedFollowUp` is set only when this round's 'done' is suppressed to force
    // a follow-up call next round -- it exists solely so the loop-bottom guard below (which
    // otherwise treats any `!sawToolCall` round as a dead adapter stream) does not return early on
    // the ONE round type that legitimately ends with no tool call yet still has a next round.
    let roundText = '';
    // How much of `roundText` has already been attributed to an assistant history message this
    // round: a round can legitimately contain more than one tool_call (narration,
    // tool_call, more narration, another tool_call), and each `messages` entry pushed below must
    // carry only the prose that arrived SINCE the previous one -- otherwise the second tool_call's
    // assistant message would repeat the first's narration verbatim. Sliced out at each tool_call
    // history-append below, then advanced to `roundText.length` so the next slice starts clean.
    let roundTextConsumed = 0;
    let forcedFollowUp = false;
    // TRUE when any delta this round was the adapter's reasoning-channel fallback
    // (openai-compatible.ts's `reasoningFallback`, flagged on the event): that text is raw
    // deliberation shown to the user only because no real answer arrived, and deliberation
    // routinely names exactly one tool the model decided NOT to call -- the interception below
    // must never read it as an offer.
    let roundHadReasoningFallback = false;
    // Round-scoped (reset every round, unlike the whole-turn flags above) — feeds
    // `shouldEnterFinalRoundEarly` once this round finishes. `roundHadRealToolCall` covers only the
    // real data-tool path below (the one that also sets `toolUsedThisTurn`), deliberately excluding
    // the `SUGGEST_DISCOVER_QUERY_TOOL` handoff — that tool is never rejected by field-validation and
    // never produces a `tableEvent` by design, so counting it here would misread its normal success
    // as a "fully rejected round".
    let roundHadRealToolCall = false;
    let roundHadSuccessfulToolCall = false;
    // TOOL-ROUND COST BUDGET, round-scoped: one entry per SUCCESSFUL real tool
    // call this round -- `isRoundFutile` reads this array at round-end, and its cost is folded
    // into `totalSpentUnits` there too. A rejected/errored call never gets an entry (it costs 0
    // and cannot be "futile" in this mechanism's sense -- see `isRoundFutile`'s doc comment).
    const roundSuccessfulCalls: Array<{
      toolName: string;
      cost: number;
      hadRows: boolean;
      isDuplicate: boolean;
    }> = [];

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
            yield* separateRoundText(round);
            roundSawAnyDelta = true;
          }
          roundText += content;
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
              // Same round separation as the main delta path: a round whose text arrives ONLY
              // through this drain (the depseudonymizer holds back the tail of every chunk) still
              // needs the blank line before it.
              yield* separateRoundText(round);
              roundSawAnyDelta = true;
            }
            roundText += trailing;
            yield { type: 'delta', content: trailing };
          }
        }

        // Graceful-failure handoff (server/tools/suggest-discover-query.ts): intercepted HERE,
        // before any real tool execution below, because this is not a data tool — it never
        // touches the Indexer/Manager API and must never be run through `executeToolCall`, same
        // reasoning as `ROUTE_QUESTION_TOOL` in `runStage1Routing` above. `toolUsedThisTurn` is
        // deliberately NOT set for this branch (unlike the real-tool path below): it exists only
        // to pick between the two TABLE-oriented no-text fallbacks, and this tool never
        // renders a table, so a turn that calls ONLY this and then produces no text should not
        // fall back to table-flavored copy (see noTextFallbackMessage's doc comment).
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
            // helps if a FUTURE tool-bearing round exists to retry in. This must ask the SAME
            // question `isFinalRound` asks for the round after this one --
            // not just "is there another round by INDEX" (a naive `round < MAX_TOOL_ROUNDS - 1`
            // check), which knows nothing about the cost budget or futility triggers and could
            // therefore promise a retry round that the budget/futility logic has already decided
            // would offer no tools. Reusing `willBeFinalRound` for `round + 1` is what keeps this
            // in lockstep with `isFinalRound` above -- if the next round would offer no tools for
            // ANY reason (structural cap, `shouldEnterFinalRoundEarly`, or the cost/futility
            // budget), fall through to
            // strip-plus-disclose instead of erroring into a retry that will never arrive (a
            // regression against base, which always showed the stripped link).
            const retryRoundAvailable = !willBeFinalRound(
              round + 1,
              forceFinalRoundEarly,
              budgetForcesFinalRoundEarly,
            );

            if (
              (resolution.outcome === 'unknown_fields' ||
                resolution.outcome === 'unsupported_clauses') &&
              !suggestDiscoverUnknownFieldsRetried &&
              retryRoundAvailable
            ) {
              // First unknown-fields failure this turn: do NOT show the
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
                  'The suggested query was shown to the user as an "Open in Discover" link, not ' +
                  'as visible query text. Now tell the user plainly, in your own words, what you ' +
                  'could not check and why — do not repeat the query itself, the link already ' +
                  'shows it, and if you mention the handoff at all call it "the Discover link", ' +
                  'never "the query below" or similar wording that implies a query block is ' +
                  'displayed.',
              });
            }
          }

          {
            // Issue C4: carry this round's own narration (already streamed to the user above)
            // into its own history turn instead of discarding it as `content: ''` — otherwise the
            // model has no record of having said it and re-narrates near-identically on a retry
            // round (the `unknown_fields` self-correction just above is exactly that retry path).
            // Trim before it reaches history: models often emit a bare priming newline (or
            // whitespace run) right before a tool call (see the "\n\n"-before-tool-call note at
            // this file's top), and Anthropic's Messages API 400s on a whitespace-only text
            // block (anthropic.ts pushes any truthy `content` as a text block). The offset
            // bookkeeping below stays on the UNtrimmed `roundText.length` so later slices are
            // still measured from the right position.
            const priorRoundText = roundText.slice(roundTextConsumed).trim();
            roundTextConsumed = roundText.length;
            messages = [
              ...messages,
              // ORIGINAL (pseudonym-form) toolCall — wire consistency, same as the real-tool path.
              // `vendorExtras` (e.g. Gemini's `thought_signature`) is spread only when the adapter
              // actually captured one this round — see StreamEvent's `tool_call` doc comment.
              {
                role: 'assistant',
                content: priorRoundText,
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
          }
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
        // N1: recorded for EVERY real attempt (success, rejection, or execution error alike) —
        // see `lastAttemptedToolCall`'s doc comment above for why the outcome does not gate this.
        lastAttemptedToolCall = {
          name: event.toolCall.name,
          args: realArguments,
        };

        // Forwarded for transparency and for the eval harness: which tool ran, with which
        // arguments. The UI currently ignores it (unknown types fall through in chat-page.tsx).
        // Carries the REVERSED (real) args: local display is trusted.
        yield { type: 'tool_call', toolCall: toolCallForClient };

        // `detail` names the tool whose call is running, so the reader sees WHICH question is
        // being asked of the data rather than one undifferentiated "Querying Wazuh…" for a turn
        // that runs four calls. A tool name is catalog vocabulary — never customer data — so it is
        // safe to surface regardless of privacy mode.
        yield {
          type: 'status',
          message: 'Querying Wazuh…',
          step: 'querying',
          detail: event.toolCall.name,
        };

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

        // CONTEXT-CHAR STOP: every tool-result string appended to `messages`
        // grows what every SUBSEQUENT round re-sends, whether the call succeeded or was
        // rejected/errored (a rejected call's error string is far smaller than a digest, but it is
        // not free either) -- see `CONTEXT_CHAR_BUDGET`'s doc comment.
        cumulativeToolResultChars += toolResultContentForModel.length;

        // Deferred-offer interception: only a SUCCESSFUL call marks this
        // tool as executed for the exclusion in findOfferedFollowUpTool. A rejected/errored call
        // must stay forceable -- "that call needs a policy_id; I can retry get_sca_checks, want
        // me to?" is the retry sibling of the measured failure, and keying the exclusion on the
        // ATTEMPT rather than the outcome structurally immunizes it against that gap. A
        // successful earlier call still excludes by NAME, not name+arguments: an offer naming a
        // tool that already produced a result is far more often the model summarizing its own
        // work than proposing a genuinely different call, and force-repeating succeeding tools
        // risks loops -- recorded as a deliberate bound of this mechanism, not an oversight.
        if (!isToolResultError(outcome.toolResultContent)) {
          executedToolNames.add(event.toolCall.name);
          lastSuccessfulToolName = event.toolCall.name;
        }

        // Backfills the specific error text onto the already-recorded
        // `lastAttemptedToolCall` (set before `outcome` existed, above) now that it does. Only
        // ever set for the error shape -- `extractToolErrorMessage` returns `undefined` for a
        // real result, leaving `errorMessage` unset so `buildNoMatchingResultsMessage`'s generic
        // branch is unaffected for a genuinely empty successful call.
        const attemptedErrorMessage = extractToolErrorMessage(
          toolResultContentForModel,
        );
        if (attemptedErrorMessage && lastAttemptedToolCall) {
          lastAttemptedToolCall.errorMessage = attemptedErrorMessage;
        }

        if (outcome.tableEvent) {
          // Only a successful execution ever sets `tableEvent` (every rejection/error
          // path above returns `toolResultContent` alone) — this is the round's "did anything
          // actually succeed" signal `shouldEnterFinalRoundEarly` needs below.
          roundHadSuccessfulToolCall = true;

          // TOOL-ROUND COST BUDGET: this call reached the backend and produced a
          // real result, so (and only so) it is chargeable -- see `toolCallCostUnits`'s doc
          // comment for why a rejected/errored call never reaches this branch at all.
          const callSignature = `${event.toolCall.name}|${JSON.stringify(
            realArguments,
          )}`;
          const isDuplicateCall = executedCallSignatures.has(callSignature);
          executedCallSignatures.add(callSignature);
          const hadRows = outcome.tableEvent.spec.rows.length > 0;
          roundSuccessfulCalls.push({
            toolName: event.toolCall.name,
            cost: toolCallCostUnits(event.toolCall.name, true),
            hadRows,
            isDuplicate: isDuplicateCall,
          });
          // Enumerable-remaining coverage tracking: a target counts as
          // "done" once a successful call's arguments named it, regardless of row count -- the
          // point is "was this item queried", not "did it come back non-empty".
          if (enumeratedTargets) {
            const argsText = JSON.stringify(realArguments).toLowerCase();
            for (const target of enumeratedTargets) {
              if (argsText.includes(target.toLowerCase())) {
                coveredEnumerationTargets.add(target.toLowerCase());
              }
            }
          }

          // A multi-call turn can run several tool calls before
          // landing on a table, and the client renders one chip per call — attach THIS call's own
          // id to its provenance so the chip that actually produced this table is the only one the
          // client enriches with it (message-bubble.tsx matches on this id, never on position).
          // Set here rather than in executor.ts: this is where `event.toolCall.id` is in scope,
          // and executor.ts has no notion of "which call in the turn" it is being invoked for.
          if (outcome.tableEvent.spec.provenance) {
            outcome.tableEvent.spec.provenance.toolCallId = event.toolCall.id;
          }
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
          turnDigests.push({
            toolName: event.toolCall.name,
            content: toolResultContentForModel,
          });
        }

        {
          // Issue C4: see the identical comment on the suggest_discover_query branch above --
          // this round's own narration, already shown to the user, belongs in its own history
          // turn instead of being dropped as `content: ''`.
          // Trim before it reaches history for the same reason as the suggest_discover_query
          // branch above: a whitespace-only text block 400s against Anthropic. Offset
          // bookkeeping stays on the UNtrimmed `roundText.length`.
          const priorRoundText = roundText.slice(roundTextConsumed).trim();
          roundTextConsumed = roundText.length;
          messages = [
            ...messages,
            // ORIGINAL (pseudonym-form) toolCall, not toolCallForClient — wire consistency.
            // `vendorExtras` (e.g. Gemini's `thought_signature`) is spread only when the adapter
            // actually captured one this round — see StreamEvent's `tool_call` doc comment.
            {
              role: 'assistant',
              content: priorRoundText,
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
        }
        continue;
      }

      if (event.type === 'done') {
        {
          const trailing = drainRoundBuffers();
          if (trailing) {
            if (hasMeaningfulText(trailing)) {
              // Same round separation as the main delta path: a round whose text arrives ONLY
              // through this drain (the depseudonymizer holds back the tail of every chunk) still
              // needs the blank line before it.
              yield* separateRoundText(round);
              roundSawAnyDelta = true;
            }
            roundText += trailing;
            yield { type: 'delta', content: trailing };
          }
        }
        // Accumulate BEFORE the sawToolCall branch below: a non-final round's 'done' is suppressed
        // (never forwarded to the client) but its usage was still real spend for this turn and must
        // not be dropped — otherwise only the LAST round's usage would reach the client.
        usageTotals = addUsage(usageTotals, event.usage);
        if (sawToolCall) {
          // Text streamed AFTER this round's LAST tool call (e.g. a closing
          // remark before the round ended) is not captured by either tool_call history-append
          // above -- both only consume the text that arrived BEFORE their own call. Append the
          // unconsumed tail onto its own assistant history turn now, before the next round
          // starts, so it is not silently dropped. Trimmed for the same
          // whitespace-only-text-block reason as the tool_call sites above.
          const roundTail = roundText.slice(roundTextConsumed).trim();
          if (roundTail) {
            messages = [...messages, { role: 'assistant', content: roundTail }];
          }
          // More rounds needed: suppress this 'done' (the turn isn't over) and start the next
          // round with the grown message history instead of ending the SSE stream here.
          break;
        }

        // DEFERRED-OFFER INTERCEPTION: this round made no tool call AND
        // streamed text -- the exact shape of "summary, then ask permission for an obvious next
        // tool". Fires only when a next TOOL-BEARING round genuinely exists to force the call
        // into, only on a turn that is actually gathering data, and only ONCE per turn -- see
        // shouldConsiderDeferredOffer (the pure, testable form of that gate). When `tools` is
        // `undefined` (an adapter with `supportsTools === false`, or -- structurally impossible
        // here since `toolUsedThisTurn` implies a tool round already offered tools -- a
        // `general`-routed no-tool turn) there is nothing to force a call into, so the detector
        // is not even asked. `roundHadReasoningFallback`: a round whose text
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
            ? findOfferedFollowUpTool(
                roundText,
                tools,
                executedToolNames,
                lastSuccessfulToolName,
              )
            : undefined;
          if (offeredTool) {
            forcedFollowUpTool = offeredTool;
            forcedFollowUpSpent = true;
            forcedFollowUp = true;
            // The offer text the user has ALREADY READ becomes part of the provider-bound
            // history: without this, the forced round and the final round
            // are authored blind of the summary-plus-offer on screen, and the turn ships two
            // independently-authored summaries that can contradict each other. `roundText` is
            // the depseudonymized client-visible text; scrubMessagesForProvider re-applies the
            // pseudonym map to assistant content on every outbound call, so known entities go
            // back out as the same pseudonyms the model produced.
            messages = [...messages, { role: 'assistant', content: roundText }];
            // That same text is on the user's screen. Latch it so the
            // final round of this turn is asked to CONTINUE it rather than to answer again — see
            // `answerAlreadyStreamedThisTurn`/FINAL_ROUND_CONTINUATION_INSTRUCTION. Without this,
            // appending the answer to history (just above) plus the "Now answer the user's
            // question directly" order below is the exact recipe for two complete answers.
            answerAlreadyStreamedThisTurn = true;
            // Suppress this 'done' exactly like the sawToolCall branch above: no privacy_map, no
            // no-text fallback, no client-visible 'done' -- the turn is NOT over, it is being
            // redirected into one more forced tool round.
            //
            // CONSENT CONTRACT, recorded deliberately: the streamed sentence asks permission
            // ("want me to?") and this code then acts without an answer. That is deliberate: a
            // turn with rounds remaining must not END on a permission question the
            // user cannot see the cost of; holding the offer sentence
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
        if (!roundSawAnyDelta) {
          yield* emitNoTextFallback(isFinalRound);
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
        // A FORCED round's provider error must not reach the client: the interception
        // suppressed a CLEAN 'done' to buy this round, so
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
      // legitimate exception: that round's 'done' had no tool call either,
      // but it was deliberately suppressed above to redirect into a forced next round, not a dead
      // stream — without this exemption this guard would return right after the `break` above and
      // silently undo the interception.
      if (forcedRound) {
        // The FORCED round dead-streamed: on base the
        // turn had already terminated cleanly on the offer round's 'done' that the interception
        // suppressed -- returning bare here would close the SSE stream with no terminating frame,
        // strictly worse than base. Emit the clean termination the suppressed 'done' owed the
        // client (same policy as the forced-round 'error' branch above).
        if (!roundSawAnyDelta) {
          yield* emitNoTextFallback(false);
        }
        yield* emitPrivacyMapOnce();
        yield { type: 'done', usage: toStreamUsage(usageTotals) };
      }
      return;
    }

    // Decide BEFORE folding this round's own success into `hadSuccessfulRoundEarlier`
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

    // Independent bound on a turn that NEVER succeeds even once --
    // see `MAX_CONSECUTIVE_REJECTED_ROUNDS`'s doc comment. Reset the moment any round succeeds;
    // otherwise increment and, once the bound is reached, force the next round final regardless of
    // `hadSuccessfulRoundEarlier` (which `shouldEnterFinalRoundEarly`'s own gate above requires and
    // this one does not).
    if (roundHadSuccessfulToolCall) {
      consecutiveRejectedRounds = 0;
    } else if (roundHadRealToolCall) {
      consecutiveRejectedRounds += 1;
      if (consecutiveRejectedRounds >= MAX_CONSECUTIVE_REJECTED_ROUNDS) {
        forceFinalRoundEarly = true;
      }
    }

    // CONTEXT-CHAR STOP: checked every round, independent of and in addition to
    // `forceFinalRoundEarly`/the cost budget below -- this bounds PROVIDER CONTEXT directly (see
    // `CONTEXT_CHAR_BUDGET`'s doc comment), a dimension the cost-unit budget never prices at all.
    // Latches the same flag the futility/cost-exhaustion triggers use, so `willBeFinalRound`
    // automatically picks it up without a fourth code path.
    if (cumulativeToolResultChars > CONTEXT_CHAR_BUDGET) {
      budgetForcesFinalRoundEarly = true;
    }

    // TOOL-ROUND COST BUDGET: charge this round's successful real-tool-call cost,
    // then decide whether the NEXT round must be forced tools-off -- either because this round
    // was futile (checked FIRST: a futile round must stop immediately
    // regardless of remaining budget) or because charging its cost exhausted the current ceiling
    // with no extension granted. Skipped entirely once `forceFinalRoundEarly`
    // (`shouldEnterFinalRoundEarly` or the all-rejected-round bound just above) already forces the
    // next round early on its own narrower ground --
    // no need to layer a second reason on top, and `isRoundFutile([])` would return `false` for an
    // all-rejected round anyway (see that function's doc comment), so this would be a no-op here
    // regardless.
    if (!forceFinalRoundEarly) {
      totalSpentUnits += roundSuccessfulCalls.reduce(
        (sum, call) => sum + call.cost,
        0,
      );
      // As originally designed, "futile = all
      // successful calls are duplicates OR zero-row" aborted exactly the enumerable sweep the
      // extension mechanism exists to finish -- a single empty agent mid-sweep (agent 007 has no
      // failing SCA checks) is the ORDINARY case, not the corner case, and `isRoundFutile` would
      // read that round as "taught us nothing new" even though `coveredEnumerationTargets`
      // (immediately below) counts the very same call as progress. `sweepInProgress` is `true`
      // only while an enumerated list was found AND at least one of its targets has not yet been
      // covered by a successful call this turn -- i.e. there is a specific, named, still-open
      // sweep item left to query. A round that is futile for any OTHER reason (duplicates,
      // zero-row calls with no enumerable sweep behind them) is unaffected and still stops
      // immediately, as designed.
      const sweepInProgress =
        !!enumeratedTargets &&
        enumeratedTargets.some(
          target => !coveredEnumerationTargets.has(target.toLowerCase()),
        );
      if (isRoundFutile(roundSuccessfulCalls) && !sweepInProgress) {
        // The zero-row half of futility gets ONE widening round before the turn is closed out --
        // see `shouldGrantZeroRowWideningRound`'s doc comment for every bound that keeps it to one.
        // The duplicate half, and every subsequent futile round, still stop immediately.
        if (
          shouldGrantZeroRowWideningRound({
            successfulCalls: roundSuccessfulCalls,
            alreadyGranted: zeroRowWideningRoundGranted,
          })
        ) {
          zeroRowWideningRoundGranted = true;
          // The grace buys a ROUND, never budget: if this round's cost exhausted the ceiling the
          // turn still ends here, exactly as it would have without the grace.
          if (totalSpentUnits >= budgetCeiling) {
            budgetForcesFinalRoundEarly = true;
          }
        } else {
          budgetForcesFinalRoundEarly = true;
        }
      } else if (totalSpentUnits >= budgetCeiling) {
        const roundHadNewInfo = roundSuccessfulCalls.some(
          call => !call.isDuplicate && call.hadRows,
        );
        if (
          shouldGrantBudgetExtension({
            roundHadNewInfo,
            enumeratedTargets,
            coveredTargets: coveredEnumerationTargets,
            currentCeiling: budgetCeiling,
          })
        ) {
          budgetCeiling = HARD_CEILING_UNITS;
        } else {
          budgetForcesFinalRoundEarly = true;
        }
      }
    }

    // Third and last step label of the turn: the NEXT provider call is the one that turns the tool
    // results into the answer. Emitted at the very end of the round body — after every early
    // `return` above — so it can never claim the assistant is writing an answer that is not
    // actually coming. Purely advisory: the client discards it the instant the first `delta` of
    // real text arrives (chat-page.tsx's `flushPendingDelta` clears `statusMessage`).
    //
    // Gated on the NEXT round actually being the final (tools-off) one, using the same
    // `willBeFinalRound` predicate the loop head itself uses. Without that gate a turn running
    // several tool rounds walked the label BACKWARDS — "Writing the answer…" then "Querying …"
    // again, once per round — which reads as the assistant changing its mind rather than as
    // progress. `round + 1` with the flags as they stand after this round's own bookkeeping above
    // is exactly the question "is the next round the last one".
    if (
      roundHadRealToolCall &&
      willBeFinalRound(
        round + 1,
        forceFinalRoundEarly,
        budgetForcesFinalRoundEarly,
      )
    ) {
      yield {
        type: 'status',
        message: 'Writing the answer…',
        step: 'writing',
      };
    }
  }

  // Exhausted the round budget and the forced-final (no-tools) round still didn't end cleanly
  // above; close the SSE stream rather than hang the client. Same widened no-text guard as the
  // main 'done' branch above — a model that never produced text deserves a written answer, not a
  // bare done, regardless of whether a tool ran.
  if (!roundSawAnyDelta) {
    yield* emitNoTextFallback(true);
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
