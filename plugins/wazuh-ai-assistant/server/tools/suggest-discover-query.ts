import { RequestHandlerContext, Logger } from '../../../../src/core/server';
import { ToolSpec } from '../../common/types';
import { extractTimeRange } from '../../common/discover-url';
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
 */
export const SUGGEST_DISCOVER_QUERY_TOOL: ToolSpec = {
  name: 'suggest_discover_query',
  description:
    'Use when the data the user asked about is out of reach for every other tool available to ' +
    'you: a blocked/unsupported index, a filter search_wazuh_data cannot express within its ' +
    'rules, or a time range beyond the 90-day maximum. Shows the user a query they can run ' +
    'themselves in Discover, and your reason is shown alongside it — say plainly what you could ' +
    'not check. This is NOT a way to fetch data yourself; nothing here is executed on your behalf.',
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
          'One or two plain sentences, in the user\'s own language, saying what you could not ' +
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
      reason:
        `Parameter "query_dsl" is not valid JSON (${
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
 * original `dsl` carried no recognizable range at all). */
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

/**
 * Best-effort walk collecting every field name a query clause references, recursing through
 * `bool.{filter,must,should,must_not}` (each of those may be a single clause object or an array of
 * them) and reading `exists.field` directly. Not a full DSL walker (this is a suggestion shown to
 * the user, never executed by this plugin) — anything this misses simply isn't validated and falls
 * through to the strip-to-time-range fallback below if `_field_caps` then reports it unknown, which
 * is the safe direction for a miss to fail in.
 */
function collectFieldNames(clause: unknown, acc: Set<string>): void {
  if (Array.isArray(clause)) {
    for (const entry of clause) {
      collectFieldNames(entry, acc);
    }
    return;
  }
  if (!clause || typeof clause !== 'object') {
    return;
  }
  const obj = clause as Record<string, unknown>;

  const bool = obj.bool;
  if (bool && typeof bool === 'object' && !Array.isArray(bool)) {
    const boolObj = bool as Record<string, unknown>;
    for (const key of ['filter', 'must', 'should', 'must_not']) {
      const value = boolObj[key];
      if (value !== undefined) {
        collectFieldNames(value, acc);
      }
    }
  }

  const exists = obj.exists;
  if (exists && typeof exists === 'object' && !Array.isArray(exists)) {
    const field = (exists as Record<string, unknown>).field;
    if (typeof field === 'string') {
      acc.add(field);
    }
  }

  for (const clauseType of FIELD_KEYED_CLAUSES) {
    const value = obj[clauseType];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const fieldName of Object.keys(value as Record<string, unknown>)) {
        acc.add(fieldName);
      }
    }
  }
}

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
): Promise<Record<string, unknown>> {
  const timeRangeOnlyDsl = buildTimeRangeOnlyDsl(index, dsl);

  const allowlistCheck = checkIndexAllowlist(index);
  if (!allowlistCheck.ok) {
    logger.debug(
      `wazuhAiAssistant: suggest_discover_query targets index "${index}", outside the executor's ` +
        'allowlist, so its field names cannot be verified via _field_caps -- stripping the ' +
        'suggested query to index + time range only rather than widening the allowlist for a ' +
        'metadata read (see suggest-discover-query.ts\'s resolveSuggestedDsl doc comment).',
    );
    return timeRangeOnlyDsl;
  }

  const fieldNames = new Set<string>();
  collectFieldNames(dsl, fieldNames);
  if (fieldNames.size === 0) {
    // Nothing field-level to verify (e.g. the model already only asked for a time range) -- the
    // original clause is already the same shape resolveSuggestedDsl would otherwise strip TO.
    return dsl;
  }

  try {
    const response = await context.core.opensearch.client.asCurrentUser.fieldCaps(
      {
        index,
        fields: [...fieldNames].join(','),
      },
    );
    const knownFields = new Set(
      Object.keys(
        (response.body as { fields?: Record<string, unknown> } | undefined)
          ?.fields ?? {},
      ),
    );
    const allKnown = [...fieldNames].every(name => knownFields.has(name));
    return allKnown ? dsl : timeRangeOnlyDsl;
  } catch (error) {
    logger.debug(
      `wazuhAiAssistant: suggest_discover_query's _field_caps check failed for index "${index}" ` +
        `(${describeError(error)}) -- stripping the suggested query to index + time range only.`,
    );
    return timeRangeOnlyDsl;
  }
}
