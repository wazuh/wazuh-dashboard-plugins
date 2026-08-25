import { RequestHandlerContext, Logger } from '../../../../src/core/server';
import { ToolSpec } from '../../common/types';
import {
  extractTimeRange,
  hasExplicitTimeRange,
} from '../../common/discover-url';
import { describeError } from '../../common/errors';
import { checkIndexAllowlist } from './guardrails';

/**
 * The graceful-failure handoff (issue 13-suggested-query-discover-handoff.md): when the data a
 * user asked about is out of the assistant's reach — a blocked index, a filter search_wazuh_data
 * cannot express within its rules, a >90-day range — the model calls this INSTEAD of guessing or
 * silently answering a narrower question. server/routes/chat.ts's orchestrate loop intercepts it
 * before `executeToolCall` (same reasoning as `ROUTE_QUESTION_TOOL` in router.ts): this is not a
 * data tool, it never touches the Indexer/Manager API, and it must never be run through the normal
 * tool-execution path. The loop turns a valid call directly into a `suggested_query` StreamEvent
 * (common/types.ts) the browser renders as an "Open in Discover" handoff — see
 * public/components/chat/chat-page.tsx and message-bubble.tsx.
 *
 * Registered ALONGSIDE the real stage-2 tool list in chat.ts's `orchestrate`, not through
 * server/tools/registry.ts: the registry is the catalog of DATA tools `resolveStage2Tools`
 * (router.ts) routes by category, and this tool has no data-fetching behavior to route to.
 *
 * #8915 — why there is no DETERMINISTIC (non-model) emission path, only the sharpened prompt/
 * description guidance above: a deterministic "the turn is ending with nothing useful, auto-emit
 * a suggested_query" backstop was evaluated and declined, for two independent reasons:
 *  1. It already exists, structurally, for the one case where it would be safe to build: every
 *     Indexer-backed tool call (executor.ts's `executeIndexerRequest`) already attaches a
 *     `TableSpec.discover` link to its `table` event UNCONDITIONALLY — rows or not, truncated or
 *     not (common/types.ts's `TableSpec.discover` doc comment). A zero-row or truncated result
 *     from a real tool call this turn is therefore never actually link-less; the gap this issue
 *     reports is that the model's own NARRATION doesn't call it out, which is a prompting problem
 *     (fixed above), not a missing link.
 *  2. For the two cases that genuinely have no such link, a safe deterministic query cannot be
 *     built without fabricating one: (a) "no tool covers the data at all" means no tool call ever
 *     ran this turn, so there is no executed index/DSL to derive anything from — synthesizing one
 *     would mean guessing which index the user's free-text question maps to outside any tool
 *     call, i.e. reimplementing the model's own topic-to-index judgment in code; (b) a Manager-API
 *     tool's zero-item result (executeManagerRequest) has no index/DSL concept at all — Discover
 *     searches OpenSearch indices, not Manager REST endpoints, so there is nothing sound to link
 *     to. Both would violate the anti-fabrication constraint this fix is built under (the handoff
 *     must be an admission the assistant cannot answer, never an invented query standing in for
 *     one) — the model already carries the language-understanding needed to pick the right index
 *     and reason for these cases; a deterministic backstop cannot.
 * What it would take: a static, versioned map from tool-catalog category (router.ts's
 * `resolveStage2Tools` categories, or `get_agents`/`get_vulnerabilities`-style tool names) to a
 * default index/time-range DSL, so an "empty domain" turn with NO tool call could still resolve
 * an index deterministically instead of relying on the model's own guess. That is a real feature
 * (and a maintenance burden — it drifts every time a tool's backing index changes), not a small
 * addition, so it is left to a follow-up rather than folded into this fix.
 */
export const SUGGEST_DISCOVER_QUERY_TOOL: ToolSpec = {
  name: 'suggest_discover_query',
  // #8915: this description previously read as one optional capability among several, and
  // measured live traffic showed the model never called it — including on the turns it exists
  // for. It now states plainly that the call is the REQUIRED close-out of an unanswerable turn,
  // not an extra, and names all three trigger conditions — kept in sync with prompts.ts's
  // buildSystemPrompt, which states the same three conditions in the system prompt.
  description:
    'The required final step of a turn you cannot fully answer — not an optional extra. Call it ' +
    'before you finish whenever: no other tool available to you covers what the user asked about ' +
    'at all; a tool call came back with zero rows and that zero is your whole answer; or the ' +
    'rows you would need were truncated away and the question depends on seeing every row. Shows ' +
    'the user your reason plus an "Open in Discover" link they can click to run the query ' +
    'themselves — no query text is displayed, only that link, so say plainly what you could not ' +
    'check or confirm and, if you refer to the handoff at all, call it "the Discover link", never ' +
    '"the query below" or any other description of a visible query block. This is NOT a way to ' +
    'fetch data yourself: nothing here is executed on your behalf, and it never replaces ' +
    'answering with data you already have — use it to close out only the parts you could not ' +
    'verify.',
  parameters: {
    type: 'object',
    properties: {
      index: {
        type: 'string',
        description:
          'The index or index pattern the user should search in Discover (e.g. ' +
          '"wazuh-findings-v5-*").',
      },
      query_dsl: {
        type: 'string',
        // Same jsonString convention as search_wazuh_data.ts's query_dsl (common/types.ts's
        // JsonSchemaPrimitive.jsonString doc comment) — lets a model that emits nested JSON as a
        // live object avoid being hard-rejected for not hand-serializing it.
        jsonString: true,
        description:
          'A JSON-encoded (stringified) OpenSearch query clause (the "query" value only, not a ' +
          'full search body) expressing what the user should look for, e.g. ' +
          '"{\\"bool\\":{\\"filter\\":[...]}}". Best-effort: it is shown to the user as a ' +
          'starting point, not executed or validated against your own tool constraints.',
      },
      reason: {
        type: 'string',
        description:
          "One or two plain sentences, in the user's own language, saying what you could not " +
          'check and why (e.g. "this index is outside what I can query directly" or "this needs ' +
          'a date range beyond the 90 days I can search"). Shown to the user verbatim.',
      },
    },
    required: ['index', 'query_dsl', 'reason'],
  },
};

export type SuggestDiscoverQueryValidation =
  | { ok: true; index: string; dsl: Record<string, unknown>; reason: string }
  | { ok: false; reason: string };

/**
 * Validates a `suggest_discover_query` call's arguments — deliberately stricter than the general
 * schema-validator.ts pass (which only checks JSON types), because every field here is about to be
 * shown DIRECTLY to the user rather than fed to a query the executor runs: an empty index or reason
 * would render a broken or silent callout, and unparseable `query_dsl` would either crash the
 * renderer or ship a garbage string as if it were a real filter.
 */
export function validateSuggestDiscoverQueryArgs(
  args: Record<string, unknown>,
): SuggestDiscoverQueryValidation {
  const index = args.index;
  if (typeof index !== 'string' || index.trim().length === 0) {
    return {
      ok: false,
      reason: 'Parameter "index" must be a non-empty string.',
    };
  }

  const rawDsl = args.query_dsl;
  if (typeof rawDsl !== 'string' || rawDsl.trim().length === 0) {
    return {
      ok: false,
      reason: 'Parameter "query_dsl" must be a non-empty JSON-encoded string.',
    };
  }
  let dsl: unknown;
  try {
    dsl = JSON.parse(rawDsl);
  } catch (error) {
    return {
      ok: false,
      reason: `Parameter "query_dsl" is not valid JSON (${
        error instanceof Error ? error.message : String(error)
      }). Re-send it as a single JSON-encoded string, e.g. "{\\"bool\\":{...}}".`,
    };
  }
  if (typeof dsl !== 'object' || dsl === null || Array.isArray(dsl)) {
    return {
      ok: false,
      reason:
        'Parameter "query_dsl" must decode to a JSON object (a query clause), got ' +
        `${Array.isArray(dsl) ? 'an array' : typeof dsl}.`,
    };
  }

  const reason = args.reason;
  if (typeof reason !== 'string' || reason.trim().length === 0) {
    return {
      ok: false,
      reason: 'Parameter "reason" must be a non-empty string.',
    };
  }

  return {
    ok: true,
    index,
    dsl: dsl as Record<string, unknown>,
    reason,
  };
}

/**
 * Which `@timestamp`-equivalent field a stripped-down time-range-only clause should use for
 * `index` — mirrors the field set common/discover-url.ts's `extractTimeRange` already recognizes
 * (kept as a small local duplicate rather than exporting internals from that file, since this is
 * the only other place that needs to pick a WRITE-side field name instead of just reading one).
 */
function timeFieldForIndex(index: string): string {
  return index.startsWith('wazuh-states') ? 'state.modified_at' : '@timestamp';
}

/** Builds the "index + time range only" fallback clause: everything field-level is dropped, only
 * the time bound survives (falling back to `extractTimeRange`'s own last-24-hours default when the
 * original `dsl` carried no recognizable range at all).
 *
 * Issue #9008 review: `extractTimeRange` now fills a missing LOWER bound from the epoch rather than
 * from `now-24h`, which changes what happens if the suggestion this emits is later RE-RUN through a
 * real tool. For an `lte`-only original, the re-emitted clause used to be `gte: now-24h` against a
 * PAST `lte` — inverted, and rejected by `lintDsl` with "upper bound before its lower bound". It is
 * now `gte: <epoch>` against that same `lte`: a well-formed but very wide window, which
 * `clampLookbackWindow` narrows to the last 90 days before that `lte` and DISCLOSES, so the re-run
 * succeeds instead of being rejected (`lintDsl`'s 90-day span rejection is what it meets only on a
 * call site that skips the clamp). Strictly better — the suggestion now describes a window that can
 * actually be executed — but it is a different downstream path, not the same one with new text. */
function buildTimeRangeOnlyDsl(
  index: string,
  dsl: Record<string, unknown>,
): Record<string, unknown> {
  const timeRange = extractTimeRange(dsl);
  return {
    bool: {
      filter: [
        {
          range: {
            [timeFieldForIndex(index)]: {
              gte: timeRange.from,
              lte: timeRange.to,
            },
          },
        },
      ],
    },
  };
}

/** Query clause shapes whose immediate object value is `{fieldName: ...}` — the field name IS the
 * key. `range`'s field key is included here too (harmless to also field_caps-check the time field
 * itself; it always exists). */
const FIELD_KEYED_CLAUSES = [
  'term',
  'terms',
  'match',
  'match_phrase',
  'match_phrase_prefix',
  'prefix',
  'wildcard',
  'range',
] as const;

/** Clause types that carry no field name at all and need none — recognized so a `match_all`
 * placeholder or an OpenSearch-document-id lookup (`ids`) does not read as "unrecognized". */
const FIELDLESS_CLAUSES = new Set(['match_all', 'match_none', 'ids']);

/** What the default-deny clause walk (`analyzeQueryClauses`) found. */
interface QueryClauseAnalysis {
  /** Every field name referenced by a RECOGNIZED clause. */
  fieldNames: Set<string>;
  /** Every clause-type key the walk does NOT know how to extract field names from. */
  unrecognizedClauses: string[];
}

/**
 * DEFAULT-DENY walk over a suggested query's clauses, recursing through
 * `bool.{filter,must,should,must_not}` (each may be a single clause object or an array of them),
 * reading `exists.field` directly and the `FIELD_KEYED_CLAUSES` by their field keys. Any OTHER
 * clause-type key is reported in `unrecognizedClauses` rather than silently skipped: an earlier
 * version of this walk was allowlist-only-with-silent-misses, which meant an invented field
 * inside `query_string`/`multi_match`/`nested`/`constant_score`/... contributed ZERO field names,
 * resolved as fully verified, and shipped to Discover with an unmodified reason — the exact
 * silent-divergence class issue #8920 item 9 is about, through the single most likely clause for
 * a Discover handoff (Discover's own query bar IS a query string). The caller strips-and-
 * discloses (or asks the model to rewrite) on any unrecognized clause; nothing falls through
 * unvalidated.
 */
function analyzeQueryClauses(clause: unknown): QueryClauseAnalysis {
  const analysis: QueryClauseAnalysis = {
    fieldNames: new Set<string>(),
    unrecognizedClauses: [],
  };
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const entry of node) {
        walk(entry);
      }
      return;
    }
    if (!node || typeof node !== 'object') {
      return;
    }
    const obj = node as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'bool') {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const boolObj = value as Record<string, unknown>;
          for (const boolKey of ['filter', 'must', 'should', 'must_not']) {
            if (boolObj[boolKey] !== undefined) {
              walk(boolObj[boolKey]);
            }
          }
          // bool's other keys (minimum_should_match, boost, ...) are scalars, not clauses.
        }
        continue;
      }
      if (key === 'exists') {
        const field =
          value && typeof value === 'object' && !Array.isArray(value)
            ? (value as Record<string, unknown>).field
            : undefined;
        if (typeof field === 'string') {
          analysis.fieldNames.add(field);
        }
        continue;
      }
      if ((FIELD_KEYED_CLAUSES as readonly string[]).includes(key)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          for (const fieldName of Object.keys(
            value as Record<string, unknown>,
          )) {
            analysis.fieldNames.add(fieldName);
          }
        }
        continue;
      }
      if (FIELDLESS_CLAUSES.has(key)) {
        continue;
      }
      analysis.unrecognizedClauses.push(key);
    }
  };
  walk(clause);
  return analysis;
}

/** Dotted tokens in the model's `reason` prose that could be field paths ("wazuh.threat_intel",
 * "data.win.eventdata.user") — each segment must start with a letter/underscore (so versions,
 * IPs and "e.g."-style abbreviations under 6 chars never match), and only tokens `_field_caps`
 * then confirms as REAL index fields are treated as promised filters. See `resolveSuggestedDsl`:
 * a reason that names a real field the DSL does not filter on is the issue's literal witness
 * ("the field named in the prose was not filtered on at all"). */
const REASON_FIELD_TOKEN_RE = /\b[A-Za-z_@][\w@]*(?:\.[A-Za-z_][\w]*)+\b/g;

function extractReasonFieldTokens(reason: string): string[] {
  const tokens = reason.match(REASON_FIELD_TOKEN_RE) ?? [];
  return [...new Set(tokens.filter(token => token.length >= 6))];
}

/**
 * What `resolveSuggestedDsl` found out about a `suggest_discover_query` call's DSL, as a
 * discriminated result rather than bare DSL (issue #8920 items 4/9): the caller (chat.ts) needs to
 * know WHICH kind of "could not fully verify" happened, because the two are handled differently --
 * `unknown_fields` names field(s) the MODEL chose and can plausibly correct (a bounded
 * self-correction retry, same contract as every other tool), whereas `unverifiable_index` and
 * `no_field_filters` are not the model's fault to fix by retrying with different field names.
 * `strippedDsl` (present on both non-`verified`, non-`no_field_filters` outcomes) is the same
 * index+time-range-only fallback the old bare-DSL return silently produced -- now paired with
 * enough information for the caller to also disclose the strip to the user, per this file's SAFETY
 * DECISION below.
 */
export type SuggestedDslResolution =
  | {
      outcome: 'verified';
      dsl: Record<string, unknown>;
      /** Real index fields the model's `reason` prose names but the DSL does not filter on —
       * the issue's literal witness shape when the MODEL authored the divergence (see
       * `extractReasonFieldTokens`). chat.ts appends a disclosure when non-empty. */
      reasonFieldsNotFiltered: string[];
    }
  | {
      outcome: 'no_field_filters';
      dsl: Record<string, unknown>;
      reasonFieldsNotFiltered: string[];
    }
  | {
      outcome: 'unknown_fields';
      unknownFields: string[];
      strippedDsl: Record<string, unknown>;
      /** True when the model's DSL carried no readable timestamp range, so `strippedDsl` opens
       * the DEFAULT 24h window rather than a window the model chose — chat.ts's disclosure must
       * say so, or the strip silently replaces the promised window too. */
      timeRangeDefaulted: boolean;
    }
  | {
      outcome: 'unsupported_clauses';
      clauses: string[];
      strippedDsl: Record<string, unknown>;
      timeRangeDefaulted: boolean;
    }
  | {
      outcome: 'unverifiable_index';
      strippedDsl: Record<string, unknown>;
      timeRangeDefaulted: boolean;
    };

/**
 * Resolves what DSL a `suggest_discover_query` call's Discover link should actually carry.
 *
 * SAFETY DECISION (this is the load-bearing part of this file — see issue
 * 13-suggested-query-discover-handoff.md's notes): field-level filters are only ever shown when
 * their field NAMES have been verified against the target index via `_field_caps` — a metadata
 * read, never a document read, and re-using the exact same `checkIndexAllowlist` boundary
 * (guardrails.ts) every other Indexer request in this plugin is already held to. We do NOT widen
 * that allowlist to let this call reach an index the executor could not otherwise touch, even
 * though doing so would make `_field_caps` validation possible for MORE suggestions: widening it
 * "just for a metadata read" is still widening it, and `suggest_discover_query` exists precisely
 * for indices/filters that are already out of the executor's reach — that is the expected, common
 * case for this tool, not a corner case to special-case around. Whenever verification is not
 * possible for that reason (or the `_field_caps` call itself fails for any other reason), every
 * field-level filter is stripped down to index + time range only, so the suggestion never carries
 * an unverifiable field name that could send the user chasing a typo'd/hallucinated field in
 * Discover.
 */
export async function resolveSuggestedDsl(
  context: RequestHandlerContext,
  index: string,
  dsl: Record<string, unknown>,
  logger: Logger,
  reason = '',
): Promise<SuggestedDslResolution> {
  const timeRangeOnlyDsl = buildTimeRangeOnlyDsl(index, dsl);
  const timeRangeDefaulted = !hasExplicitTimeRange(dsl);
  const analysis = analyzeQueryClauses(dsl);
  // The timestamp field itself does not count as a "field-level filter" for strip/no-strip
  // decisions: `buildTimeRangeOnlyDsl` re-emits (a normalized form of) the range anyway, so a
  // range-only suggestion on an unverifiable index loses NOTHING and must not be told it did —
  // that false disclosure fired on the tool's PRIMARY documented use case (a blocked index).
  const nonTimeFieldNames = [...analysis.fieldNames].filter(
    name => name !== '@timestamp' && name !== 'timestamp',
  );
  const reasonTokens = extractReasonFieldTokens(reason);

  const allowlistCheck = checkIndexAllowlist(index);
  if (!allowlistCheck.ok) {
    if (
      nonTimeFieldNames.length === 0 &&
      analysis.unrecognizedClauses.length === 0
    ) {
      // Nothing field-level to lose: emit the normalized range-only DSL with NO strip
      // disclosure. (The reason-vs-DSL check is skipped here — the index is out of reach for
      // `_field_caps`, so a reason token cannot be confirmed as a real field; documented
      // residual.)
      return {
        outcome: 'no_field_filters',
        dsl: timeRangeOnlyDsl,
        reasonFieldsNotFiltered: [],
      };
    }
    logger.debug(
      `wazuhAiAssistant: suggest_discover_query targets index "${index}", outside the executor's ` +
        'allowlist, so its field names cannot be verified via _field_caps -- stripping the ' +
        'suggested query to index + time range only rather than widening the allowlist for a ' +
        "metadata read (see suggest-discover-query.ts's resolveSuggestedDsl doc comment).",
    );
    return {
      outcome: 'unverifiable_index',
      strippedDsl: timeRangeOnlyDsl,
      timeRangeDefaulted,
    };
  }

  if (analysis.unrecognizedClauses.length > 0) {
    // DEFAULT-DENY (see analyzeQueryClauses): a clause type this walk cannot extract field names
    // from (query_string, multi_match, nested, ...) must never ship unvalidated — chat.ts gives
    // the model one bounded rewrite, then strips-and-discloses.
    return {
      outcome: 'unsupported_clauses',
      clauses: [...new Set(analysis.unrecognizedClauses)],
      strippedDsl: timeRangeOnlyDsl,
      timeRangeDefaulted,
    };
  }

  if (nonTimeFieldNames.length === 0 && reasonTokens.length === 0) {
    // Nothing field-level to verify and no field promises in the prose — the original clause is
    // already the same shape resolveSuggestedDsl would otherwise strip TO.
    return { outcome: 'no_field_filters', dsl, reasonFieldsNotFiltered: [] };
  }

  try {
    // One `_field_caps` covers both checks: the DSL's own field names AND the reason prose's
    // candidate tokens (issue #8920 item 9's "validated against its own reason text" half —
    // only a token that IS a real index field counts as a promised filter).
    const fieldsToCheck = [
      ...new Set([...analysis.fieldNames, ...reasonTokens]),
    ];
    const response =
      await context.core.opensearch.client.asCurrentUser.fieldCaps({
        index,
        fields: fieldsToCheck.join(','),
      });
    const knownFields = new Set(
      Object.keys(
        (response.body as { fields?: Record<string, unknown> } | undefined)
          ?.fields ?? {},
      ),
    );
    const unknownFields = nonTimeFieldNames.filter(
      name => !knownFields.has(name),
    );
    if (unknownFields.length > 0) {
      return {
        outcome: 'unknown_fields',
        unknownFields,
        strippedDsl: timeRangeOnlyDsl,
        timeRangeDefaulted,
      };
    }
    const reasonFieldsNotFiltered = reasonTokens.filter(
      token => knownFields.has(token) && !analysis.fieldNames.has(token),
    );
    if (nonTimeFieldNames.length === 0) {
      return { outcome: 'no_field_filters', dsl, reasonFieldsNotFiltered };
    }
    return { outcome: 'verified', dsl, reasonFieldsNotFiltered };
  } catch (error) {
    // Same "cannot verify, so strip" treatment as the allowlist-blocked branch above: a
    // `_field_caps` transport/cluster failure is just as unverifiable as an out-of-reach index, and
    // just as much NOT the model's fault to fix by retrying with different field names -- so it is
    // folded into `unverifiable_index` (the non-retryable outcome) rather than given a separate
    // outcome.
    logger.debug(
      `wazuhAiAssistant: suggest_discover_query's _field_caps check failed for index "${index}" ` +
        `(${describeError(
          error,
        )}) -- stripping the suggested query to index + time range only.`,
    );
    return {
      outcome: 'unverifiable_index',
      strippedDsl: timeRangeOnlyDsl,
      timeRangeDefaulted,
    };
  }
}
