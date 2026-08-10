import {
  DEFAULT_TIME_RANGE_GTE,
  DEFAULT_TIME_RANGE_LTE,
} from './catalog/common';

/**
 * Narrowed-window zero-row disclosure (issue #8920 item 3): a 0-row result from a caller-narrowed
 * time window ("what happened in the last hour") is exactly as consistent with "genuinely
 * nothing in that window" as with "there IS data, just outside the window the model/user
 * happened to pick" -- and a model left to infer that distinction on its own has measurably
 * failed to (see #8913, which needed four attempts because three of them were prompt-level).
 * This module supplies the two PURE helpers executor.ts's `executeIndexerRequest` uses to make
 * the distinction mechanical: locate the `@timestamp` range a query actually ran with, and build
 * a size:0/aggs-free recount of the SAME query against the plugin's own default window instead.
 *
 * Deliberately operates on the EXECUTED request body (post `applySafetyValves`), not a tool's
 * own params -- see executor.ts's call site. That is what makes this a chokepoint guarantee
 * rather than a per-tool opt-in: every typed tool with a time axis, AND the `search_wazuh_data`
 * escape hatch (whose body the model hand-writes), share the exact same
 * `{range: {'@timestamp': {...}}}` shape by the time it reaches here, because `guardrails.ts`'s
 * `lintDsl` requires it on every time-based index query. A `wazuh-states-*` tool's body never
 * contains an `@timestamp` range (there is no event-time axis to bound a snapshot query by), so
 * `findTimestampRange` correctly reports nothing to widen for those, and executor.ts never fires
 * a recount for them.
 */

/** The `@timestamp` range clause's own bounds object, e.g. `{gte: 'now-24h', lte: 'now'}` -- may
 * carry additional OpenSearch range keys (`format`, `time_zone`, ...) verbatim, since this is a
 * reference into the executed clause, not a reconstruction of it. */
export type TimestampRangeClause = Record<string, unknown> & {
  gte?: unknown;
  lte?: unknown;
};

/**
 * Locates the `@timestamp` range clause inside `body.query.bool.filter` -- the shape every typed
 * tool's `buildRequest` and the `search_wazuh_data` escape hatch both produce by the time
 * `applySafetyValves`'s `normalizeMustToFilter` has run (any `bool.must` is folded into
 * `bool.filter` before this is ever called from executor.ts). Returns `undefined` for:
 *  - a states-index body with no event-time axis at all (get-agent-inventory.ts,
 *    get-sca-checks.ts, ...), and
 *  - the exact-ID-lookup shape guardrails.ts's `isExactIdLookupQuery` exempts from the mandatory
 *    time range (find_document_by_field, or a same-shaped hand-built escape-hatch query) --
 *    there is no window to have narrowed in the first place.
 * A `bool.should`/`bool.must_not`-nested range is deliberately NOT found here (this only walks
 * the top-level `filter` array, mirroring the REQUIRED-context restriction guardrails.ts's own
 * `hasTimeRange` applies for the same reason: an optional/negated range does not actually bound
 * what the query matched, so widening it would not be describing the query that actually ran).
 */
export function findTimestampRange(
  body: Record<string, unknown>,
): TimestampRangeClause | undefined {
  const filters = (body.query as { bool?: { filter?: unknown } } | undefined)
    ?.bool?.filter;
  if (!Array.isArray(filters)) {
    return undefined;
  }
  for (const clause of filters) {
    if (!clause || typeof clause !== 'object') {
      continue;
    }
    const range = (clause as { range?: unknown }).range;
    if (!range || typeof range !== 'object' || Array.isArray(range)) {
      continue;
    }
    const timestampRange = (range as Record<string, unknown>)['@timestamp'];
    if (
      timestampRange &&
      typeof timestampRange === 'object' &&
      !Array.isArray(timestampRange)
    ) {
      return timestampRange as TimestampRangeClause;
    }
  }
  return undefined;
}

/** True when a range's bounds are already exactly the plugin's own default window -- widening it
 * again would just re-run the identical query for no benefit. */
function isAlreadyDefaultWindow(range: TimestampRangeClause): boolean {
  return (
    range.gte === DEFAULT_TIME_RANGE_GTE && range.lte === DEFAULT_TIME_RANGE_LTE
  );
}

/** Returns a copy of `clause` with its `@timestamp` range (if any) replaced by the plugin's default
 * window; every other filter clause (and every other key of an `@timestamp` range clause, e.g. a
 * `format`) passes through unchanged. Non-range clauses are returned as-is. */
function widenRangeClause(clause: unknown): unknown {
  if (!clause || typeof clause !== 'object' || Array.isArray(clause)) {
    return clause;
  }
  const record = clause as Record<string, unknown>;
  const range = record.range as Record<string, unknown> | undefined;
  if (
    !range ||
    typeof range !== 'object' ||
    Array.isArray(range) ||
    !range['@timestamp']
  ) {
    return clause;
  }
  return {
    ...record,
    range: {
      ...range,
      '@timestamp': { gte: DEFAULT_TIME_RANGE_GTE, lte: DEFAULT_TIME_RANGE_LTE },
    },
  };
}

/**
 * Builds a size:0, aggs-free, `track_total_hits:true` copy of `body` with its `@timestamp` range
 * widened to the plugin's own default window (`now-90d`..`now`) -- the recount query executor.ts
 * fires only when a tool call's narrowed window returned 0 rows (see this module's header comment).
 * Never mutates `body` (same convention as `guardrails.ts`'s `applySafetyValves`).
 *
 * Returns `undefined` -- "nothing for the caller to run" -- when:
 *  - `body` has no `@timestamp` range at all (`findTimestampRange` found nothing), or
 *  - the range is already exactly the default window (re-running it would be pointless).
 *
 * The result still needs `applySafetyValves`/`lintDsl` run over it at the call site before
 * executing, same as any other outbound request -- this function only rewrites the query shape, it
 * does not re-derive the guardrail pass.
 */
export function widenToDefaultWindow(
  body: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const range = findTimestampRange(body);
  if (!range || isAlreadyDefaultWindow(range)) {
    return undefined;
  }
  const query = body.query as { bool: Record<string, unknown> };
  const filters = (query.bool.filter as unknown[] | undefined) ?? [];
  // `aggs`/`aggregations` are dropped (not merely zeroed) -- a plain count needs neither, and
  // stripping them keeps this recount cheap and keeps `checkTopLevelAggCount`/`checkAggs`
  // (guardrails.ts) with nothing to evaluate.
  const { aggs: _aggs, aggregations: _aggregations, ...rest } = body;
  return {
    ...rest,
    query: {
      ...query,
      bool: { ...query.bool, filter: filters.map(widenRangeClause) },
    },
    size: 0,
    track_total_hits: true,
  };
}
