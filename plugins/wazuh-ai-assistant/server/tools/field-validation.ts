import { RequestHandlerContext } from '../../../../src/core/server';
import { GuardrailCheck, walk } from './guardrails';

/**
 * Field-name existence check for the search_wazuh_data escape hatch (see search-wazuh-data.ts's
 * `validateFieldNames` opt-in flag and executor.ts's `executeIndexerRequest` call site) — a raw
 * model-supplied DSL body can reference a field that does not exist (e.g. "agent.name.keyword",
 * a plausible-looking guess), and OpenSearch does NOT error on that: a `terms` agg on a
 * nonexistent field returns zero buckets, and a `term`/`match` filter on one matches zero
 * documents, both indistinguishable from "the data genuinely says zero". This is the silent
 * wrong-answer this module exists to close, by checking against the index's live mapping BEFORE
 * the query ever reaches OpenSearch. Deliberately NOT wired into every catalog tool: a typed
 * tool builds its own field paths from constants (`common/wazuh-fields.ts`), so it cannot guess a
 * field name wrong — paying a `_field_caps` round trip on every one of those calls would be pure
 * overhead. Gated on the tool opting in instead (`ToolDefinition.validateFieldNames`).
 */

/** DSL clause keys whose value's own keys ARE field paths — the same shape guardrails.ts's
 * `VULN_FIELD_CLAUSE_KEYS` walks, minus `exists` (handled separately below: its field lives under
 * a `field` key, not as the clause's own key). */
const FIELD_KEYED_CLAUSE_KEYS = new Set([
  'term',
  'terms',
  'match',
  'match_phrase',
  'prefix',
  'range',
]);

/** Aggregation types whose field lives directly under a `field` key one level down (mirrors
 * guardrails.ts's `TERMS_LIKE_AGG_KEYS` plus the common metric aggs). Because `walk` recurses
 * unconditionally, a `composite` aggregation's `sources[].<name>.terms.field` is ALSO picked up by
 * this same `terms` case — no special-casing needed, its nested shape still has a bare `terms` key
 * with a string `field`. `multi_terms` is the one real gap: its fields live in an ARRAY of
 * `{field: ...}` specs (`multi_terms.terms == [{field: "a"}, {field: "b"}]`), so there is no single
 * key here whose OWN value is `{field: string}` — left unhandled rather than special-cased for one
 * rarely-used agg type; a made-up field there is still caught by guardrails.ts's `checkAggs`
 * low-cardinality allowlist, just for a different reason (not on the allowed list, vs. not
 * existing). */
const FIELD_PARAM_AGG_KEYS = new Set([
  'terms',
  'cardinality',
  'significant_terms',
  'avg',
  'sum',
  'min',
  'max',
  'value_count',
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Walks the parsed request body for field names in positions this function can attribute WITH
 * CERTAINTY: filter/query clauses, aggregation `field` params, `sort`, and `_source`. Anything
 * this walker doesn't recognize (a construct it wasn't taught, e.g. `multi_terms` aggs, `_script`
 * sort, a wildcard `_source` entry) is silently skipped, never rejected — a
 * false negative (a bad field name that slips through unvalidated) is an acceptable cost; a false
 * positive (a good query rejected because the walker misread its shape) is not, since it would
 * burn the model's one bounded retry on a correction that doesn't fix anything.
 */
export function extractFieldNames(body: Record<string, unknown>): string[] {
  const fields = new Set<string>();
  walk(body, (key, value) => {
    if (key === 'sort' && Array.isArray(value)) {
      for (const entry of value) {
        if (typeof entry === 'string' && !entry.startsWith('_')) {
          fields.add(entry);
        } else if (isPlainObject(entry)) {
          // A sort entry's own (non-underscore) keys ARE field paths, e.g.
          // `{"@timestamp": {"order": "desc"}}` — `_script`-based sort has no field to check and
          // is skipped by the same leading-underscore filter as `_score`/`_doc`.
          for (const sortKey of Object.keys(entry)) {
            if (!sortKey.startsWith('_')) {
              fields.add(sortKey);
            }
          }
        }
      }
      return;
    }
    if (key === '_source' && Array.isArray(value)) {
      // A wildcard entry ("wazuh.*") is not a single field name this check can look up as-is —
      // left unvalidated rather than misread.
      for (const entry of value) {
        if (typeof entry === 'string' && !entry.includes('*')) {
          fields.add(entry);
        }
      }
      return;
    }
    if (!isPlainObject(value)) {
      return;
    }
    if (key === 'exists') {
      if (typeof value.field === 'string') {
        fields.add(value.field);
      }
      return;
    }
    // "terms" and "range" each spell BOTH a query/filter clause (`{terms: {"the.field": [...]}}`,
    // value's own key IS the field path) AND an aggregation type
    // (`{terms: {field: "the.field", size: N}}`, the field is under a literal `field` key) — the
    // exact same key, two different shapes. Checked for every clause/agg key here (not only
    // `FIELD_PARAM_AGG_KEYS`) because Wazuh's own field paths are always dotted
    // (e.g. "wazuh.agent.name") and never the bare word "field", so this can never misread a real
    // filter on a field actually named "field" as the aggregation shape.
    if (
      (FIELD_KEYED_CLAUSE_KEYS.has(key) || FIELD_PARAM_AGG_KEYS.has(key)) &&
      typeof value.field === 'string'
    ) {
      fields.add(value.field);
      return;
    }
    if (FIELD_KEYED_CLAUSE_KEYS.has(key)) {
      for (const field of Object.keys(value)) {
        fields.add(field);
      }
    }
  });
  return [...fields];
}

/** How long a resolved index pattern's field list is trusted before the next validation re-fetches
 * it — long enough that a burst of tool calls in one conversation shares one lookup, short enough
 * that an index-template/mapping change (rare, but not "never") is picked up within a few minutes
 * rather than requiring a process restart. */
const FIELD_CAPS_CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  fields: Set<string>;
  expiresAt: number;
}

/** index pattern -> its live field names, module-level so every call across every request shares
 * one cache (mirrors discover-link.tsx's `indexPatternIdCache` module-level Map, server-side here:
 * one lookup per distinct index pattern, not one per tool call). */
const fieldCapsCache = new Map<string, CacheEntry>();

/**
 * Resolves an index pattern's live field names via `_field_caps` (the same
 * `context.core.opensearch.client.asCurrentUser` the executor already searches with — no new
 * credential or connection needed). `undefined` on any failure (network error, the index pattern
 * matching zero indices, a client that doesn't expose `fieldCaps`) — a lookup failure must fail
 * OPEN (skip validation) rather than block a query that may well be perfectly valid; see
 * `validateQueryFields` below.
 */
async function getIndexFields(
  context: RequestHandlerContext,
  indexPattern: string,
): Promise<Set<string> | undefined> {
  const cached = fieldCapsCache.get(indexPattern);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.fields;
  }
  try {
    const response =
      await context.core.opensearch.client.asCurrentUser.fieldCaps({
        index: indexPattern,
        fields: '*',
      });
    const rawFields = (response.body as { fields?: Record<string, unknown> })
      .fields;
    const fields = new Set(Object.keys(rawFields ?? {}));
    fieldCapsCache.set(indexPattern, {
      fields,
      expiresAt: Date.now() + FIELD_CAPS_CACHE_TTL_MS,
    });
    return fields;
  } catch {
    return undefined;
  }
}

const MAX_SUGGESTIONS = 5;

/**
 * Known fields most likely to be what the caller meant by `invalidField`: an exact match once a
 * trailing ".keyword"/".raw" subfield suffix is stripped (the pattern from the issue this exists
 * for — the model invents "agent.name.keyword" when the mapping has no such subfield because
 * "agent.name" is already a keyword), else any known field sharing its last dot-path segment.
 * Deliberately simple string matching, not a general edit-distance search — the suffix-guessing
 * pattern is the one actually observed, and this is a hint for a model's self-correction, not a
 * spell-checker that needs to be exhaustive.
 */
function findNearMisses(
  invalidField: string,
  knownFields: Set<string>,
): string[] {
  const base = invalidField.replace(/\.(keyword|raw)$/, '');
  const lastSegment = base.split('.').pop() ?? base;
  const matches = [...knownFields].filter(
    field => field === base || field.split('.').pop() === lastSegment,
  );
  return matches.slice(0, MAX_SUGGESTIONS);
}

/**
 * Appended to every field-validation rejection. Left alone, the reason above tells
 * the model WHAT was wrong but not what to do next — and a rejected field-existence check consumes
 * a tool round exactly like a productive one, so nothing stops the model from spending its whole
 * bounded round budget on cosmetic variations of a field name that will never exist. Every clause
 * is load-bearing, same care as chat.ts's `FINAL_ROUND_ANSWER_INSTRUCTION`:
 *  - "Do not retry this query with a different field name guess" heads off exactly that failure
 *    mode instead of leaving the model to rediscover it one rejected round at a time.
 *  - "answer using only the results already gathered this turn" scopes the redirect to what the
 *    model can actually support — it must not invent an answer the gathered results do not show,
 *    the same anti-fabrication property `FINAL_ROUND_ANSWER_INSTRUCTION` protects.
 *  - "or state plainly that this could not be checked" keeps the honest "I don't know" reachable,
 *    rather than pressuring the model toward a fabricated answer just because it was told to
 *    answer something.
 */
export const FIELD_REJECTION_RECOVERY_GUIDANCE =
  ' Do not retry this query with a different field name guess. Answer using only the results ' +
  'already gathered this turn, or state plainly that this could not be checked.';

/**
 * Validates every field name `extractFieldNames` can find in `body` against `indexPattern`'s live
 * mapping, returning the same `GuardrailCheck` shape guardrails.ts's own checks return so
 * executor.ts can handle a rejection identically either way (bounded tool_result error, the
 * pattern `catalog/common.ts`'s `validateTimeBound` doc comment documents). A mapping-lookup
 * failure (`getIndexFields` returns `undefined`) fails OPEN — this check can only ever REJECT a
 * field it affirmatively confirmed absent from a successfully-fetched mapping, never a field it
 * simply couldn't check.
 */
export async function validateQueryFields(
  context: RequestHandlerContext,
  indexPattern: string,
  body: Record<string, unknown>,
): Promise<GuardrailCheck> {
  const referenced = extractFieldNames(body);
  if (referenced.length === 0) {
    return { ok: true };
  }
  const knownFields = await getIndexFields(context, indexPattern);
  if (!knownFields) {
    return { ok: true };
  }
  for (const field of referenced) {
    if (knownFields.has(field)) {
      continue;
    }
    const alternatives = findNearMisses(field, knownFields);
    return {
      ok: false,
      reason:
        `Field "${field}" does not exist on "${indexPattern}"` +
        (alternatives.length > 0
          ? `; available: ${alternatives.map(f => `"${f}"`).join(', ')}.`
          : '.') +
        FIELD_REJECTION_RECOVERY_GUIDANCE,
    };
  }
  return { ok: true };
}
