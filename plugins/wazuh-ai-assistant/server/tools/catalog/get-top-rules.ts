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
 * without touching digest.ts: `distinct_title_count` (a `cardinality` sub-agg, merges into the row as a
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
 * Column order is meaning -> severity -> magnitude -> spread -> identity: the sampled title (what
 * a reader scans first), then the severity badge (the at-a-glance triage signal issue #8921 flags
 * as missing whenever a finding tool has level data reachable — see `wazuh.rule.level` below),
 * then the hit count (how often), then the spread signals that qualify the title, with the numeric
 * rule id demoted to LAST rather than deleted — `sampleColumns` keeps `key` too, since the model's
 * own aggregate-then-lookup workflow (aggregate here, then look up a specific rule id with another
 * tool) depends on it staying visible.
 *
 * Severity column (issue #8921's "missing severity" item): the vulnerability table's Severity
 * badge column is per-DOCUMENT data (each vulnerability row carries its own `vulnerability.severity`).
 * A bucket here has no single severity — like the sampled title, `wazuh.rule.level` can only be
 * read off the one document `sample_doc` already samples, so it is exactly as much a SAMPLE as the
 * title is, not a bucket-wide "max"/"dominant" level (a `max`/`min` metric on this keyword field is
 * rejected by OpenSearch, and a per-bucket `terms` sub-agg over the level word would need digest.ts
 * to understand a second bucketed shape — see the `distinct_title_count`/`high_or_critical` reasoning
 * above). It is added to the SAME `sample_doc` top_hits `_source` the title already samples from
 * (one extra field, zero extra requests) and rendered with the same badge component the
 * vulnerability table uses (`tableSpec.columns[].severity: true` — result-table.tsx's
 * `renderSeverityBadge`). `distinct_level_count` (a `cardinality` sub-agg, same shape/precedent as
 * `distinct_title_count`) discloses this sample's spread exactly like `distinct_title_count` discloses the
 * title's — surfaced through `digest.sampleColumns` (the model-facing surface) rather than as its
 * own visible column, since the 6-column visible-column budget (`MAX_VISIBLE_RESULT_COLUMNS`) is
 * now fully spent by title + level + hits + distinct_title_count + high_or_critical + key.
 *
 * EXPLAIN-WAVE PHASE 7 (the field was renamed from `distinct_titles`): the guard worked as a
 * guard — the model read the number and did not claim the sampled title owned the whole bucket —
 * but it then MISREAD what the number counts, telling the user the rule had "3 distinct title
 * variants, meaning each occurrence recorded a slightly different failure message". That is the
 * wrong mechanism: rule titles are templated and interpolate the ENTITY involved (a user, host,
 * address or file), so a spread above 1 almost always means the rule fired for that many different
 * subjects, not that the wording drifted. A plural noun invites the "variants" reading; a `_count`
 * suffix names the number for what it is, and the tool description now states the mechanism
 * outright. Fixing the label the model reads beats adding a prompt line telling it how to read a
 * label that misleads: the same rename is applied to `distinct_level_count` here and
 * `distinct_name_count` in get-top-agents.ts so the family keeps one convention.
 */
export const getTopRulesTool: ToolDefinition = {
  spec: {
    name: 'get_top_rules',
    description:
      'Aggregates the most frequently triggered rules within a time range, with a sample ' +
      'title per rule. The title shown is a SAMPLE taken from one row of the bucket. ' +
      "distinct_title_count is a COUNT of how many different title strings the bucket's rows " +
      'carry -- rule titles routinely embed the entity involved (a user, host, address or file), ' +
      'so a count above 1 usually means the rule fired for that many different entities, NOT ' +
      'that the message was worded differently; report it as "fired for N different subjects, ' +
      'one of them shown", never as "N variants of this message". distinct_level_count is the ' +
      'same kind of count for the sampled severity beside it: how many different levels the ' +
      "bucket's rows carry.",
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
                top_hits: {
                  size: 1,
                  _source: ['wazuh.rule.title', 'wazuh.rule.level'],
                },
              },
              distinct_title_count: {
                cardinality: { field: 'wazuh.rule.title' },
              },
              distinct_level_count: {
                cardinality: { field: 'wazuh.rule.level' },
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
      { field: 'wazuh.rule.level', label: 'Level (sample)', severity: true },
      { field: 'doc_count', label: 'Hits' },
      { field: 'distinct_title_count', label: 'Distinct titles' },
      { field: 'high_or_critical', label: 'High/critical hits' },
      { field: 'key', label: 'Rule ID' },
    ],
  },
  digest: {
    sampleColumns: [
      'key',
      'doc_count',
      'wazuh.rule.title',
      'wazuh.rule.level',
      'distinct_title_count',
      'distinct_level_count',
      'high_or_critical',
    ],
  },
};
