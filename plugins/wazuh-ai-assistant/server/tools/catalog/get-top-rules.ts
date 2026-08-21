import { ToolDefinition } from '../types';
import {
  aggLimitProperty,
  clampAggLimit,
  objectSchema,
  resolveTimeRange,
  severitiesAtOrAbove,
  timeRangeProperties,
} from './common';

/**
 * A `terms` aggregation on `wazuh.rule.id` (on the guardrail low-cardinality allowlist) with a
 * `top_hits` sub-aggregation sampling one `wazuh.rule.title` per bucket, `size: 0`
 * (aggregation-only, no hit documents fetched).
 *
 * Column design (issue #8921, the sampled-label-falsehood item): `wazuh.rule.id` is a bucket KEY,
 * but `wazuh.rule.title` is only a SAMPLE of one document out of the bucket's full `doc_count` —
 * one rule id can legitimately fire under more than one title (templated/parameterized rule
 * text), so pairing a big `doc_count` next to a single sampled title reads as "this exact title
 * fired N times", which is false whenever the bucket's titles vary. Two sub-aggs close that gap
 * without touching digest.ts: `distinct_titles` (a `cardinality` sub-agg, merges into the row as a
 * number via digest.ts's existing metric-sub-agg branch) discloses the spread — 1 means the
 * sampled title IS the whole bucket, >1 means it is one of several. `high_or_critical` (a `filter`
 * sub-agg, merges via digest.ts's existing filter-sub-agg branch, same precedent as
 * get-sca-results.ts's passed/failed/not_applicable) delivers a severity signal as a count rather
 * than a label: a `max`/`min` metric agg on `wazuh.rule.level` is not an option here — it is a
 * `keyword` field, and OpenSearch rejects a numeric metric on a keyword field with an
 * `illegal_argument_exception` (live-verified) — and merging the bucket's own severity words as a
 * nested `terms` nested under `top_rules` would require digest.ts to understand a second bucketed
 * shape, which is A2's file, not this one. A count of how many of the bucket's hits were
 * high/critical is a cheap, honest, data-driven proxy for "does this rule matter" without either.
 *
 * Column order is meaning -> magnitude -> spread -> identity: the sampled title (what a reader
 * scans first), then the hit count (how often), then the spread and severity signals that qualify
 * the title, with the numeric rule id demoted to LAST rather than deleted — `sampleColumns` keeps
 * `key` too, since the model's own aggregate-then-lookup workflow (aggregate here, then look up a
 * specific rule id with another tool) depends on it staying visible.
 */
export const getTopRulesTool: ToolDefinition = {
  spec: {
    name: 'get_top_rules',
    description:
      'Aggregates the most frequently triggered rules within a time range, with a sample ' +
      'title per rule. The title shown is a sample -- one rule id can span many titles; ' +
      'distinct_titles gives the spread.',
    parameters: objectSchema({
      limit: aggLimitProperty('distinct rules', 20),
      ...timeRangeProperties(),
    }),
  },
  target: 'indexer',
  tier: 'T1',
  // Cost-budget class 1 (chat.ts's tool-round budget): this request is `size: 0` --
  // aggregation-only, no hit documents (see this file's own doc comment above).
  costClass: 1,
  buildRequest(params) {
    const limit = clampAggLimit(params.limit, 20);
    const { gte, lte } = resolveTimeRange(params);
    return {
      target: 'indexer',
      index: 'wazuh-findings-v5*',
      body: {
        query: {
          bool: { filter: [{ range: { '@timestamp': { gte, lte } } }] },
        },
        aggs: {
          top_rules: {
            terms: { field: 'wazuh.rule.id', size: limit },
            aggs: {
              sample_doc: {
                top_hits: { size: 1, _source: ['wazuh.rule.title'] },
              },
              distinct_titles: {
                cardinality: { field: 'wazuh.rule.title' },
              },
              // `severitiesAtOrAbove('high')` resolves to exactly ['high', 'critical'] against the
              // 5-word SEVERITY_LEVELS scale -- reused rather than a second hardcoded literal so
              // this can never drift from the severity floor every other finding tool shares.
              high_or_critical: {
                filter: {
                  terms: { 'wazuh.rule.level': severitiesAtOrAbove('high') },
                },
              },
            },
          },
        },
        size: 0,
      },
    };
  },
  tableSpec: {
    columns: [
      { field: 'wazuh.rule.title', label: 'Rule (sample)' },
      { field: 'doc_count', label: 'Hits' },
      { field: 'distinct_titles', label: 'Distinct titles' },
      { field: 'high_or_critical', label: 'High/critical hits' },
      { field: 'key', label: 'Rule ID' },
    ],
  },
  digest: {
    sampleColumns: [
      'key',
      'doc_count',
      'wazuh.rule.title',
      'distinct_titles',
      'high_or_critical',
    ],
  },
};
