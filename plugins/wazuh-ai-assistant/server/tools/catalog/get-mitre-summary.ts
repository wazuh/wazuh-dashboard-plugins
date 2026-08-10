import { ToolDefinition } from '../types';
import {
  aggLimitProperty,
  clampAggLimit,
  objectSchema,
  resolveTimeRange,
  timeRangeProperties,
} from './common';

/**
 * MITRE ATT&CK summary, same aggregation shape as `get_top_rules.ts`: a `terms` agg on
 * `wazuh.rule.mitre.technique.id` with a `top_hits` sub-aggregation sampling one
 * technique-name/tactic-name pair per bucket, `size: 0`. `wazuh.rule.mitre.technique.id` is added
 * to `guardrails.ts`'s `AGG_FIELD_ALLOWLIST` for this tool (`keyword`-mapped and low-cardinality —
 * a finite technique catalog).
 *
 * Column design (issue #8921): `wazuh.rule.mitre.technique.id`/`technique.name`/`tactic.name`
 * are MULTI-VALUE arrays on the underlying document (get-mitre-findings.ts documents the id field
 * as "a keyword-mapped array" — one finding can carry several techniques), so the bucket key (one
 * technique id) does not structurally determine which element of a sampled document's name array
 * corresponds to it: a doc tagged `technique.id: [T1059, T1071]`, sampled into the T1059 bucket,
 * gives no positional guarantee that the FIRST name is T1059's. Adding `technique.id` itself to
 * the `top_hits` `_source` fixes that structurally — the id and name arrays on any one document
 * are parallel by construction, so a consumer can zip them and pick the name whose index matches
 * the bucket key; the visible columns are relabeled "(sample)" so the sampling is legible.
 *
 * DELIBERATELY NOT SHIPPED: a `distinct_names`/`distinct_tactics` cardinality guard (the
 * instrument get-top-rules.ts uses for its sampled title). It is the WRONG instrument here, and
 * would itself be a new falsehood: within a bucket, `cardinality(technique.name)` counts the
 * names of EVERY technique co-tagged on the bucket's documents — so a technique that by ATT&CK
 * definition has exactly ONE name would read "Distinct names: 2" whenever its findings are
 * co-tagged with a second technique. get_top_rules' spread guard is valid precisely because
 * every doc in a rule-id bucket shares that rule id, and titles belong to the rule — no such
 * per-bucket ownership exists for a multi-value MITRE array. The design doc
 * (18-result-table-design.md, "Defect 1" table) records technique id -> technique name as 1:1
 * per the ATT&CK catalog; the residue is POSITIONAL (which array slot belongs to the key), which
 * the sampled id array above makes verifiable. The tactic column's residue is slightly wider (a
 * technique can belong to two tactics) and is carried as a labeled sample for the same reason —
 * see sampled-label-coverage.test.ts's field-scoped justifications, which record both.
 *
 * The adopted rule, verbatim: a sampled label may only be displayed where the key determines the
 * label; otherwise carry the spread and mark the label as a sample. Enforced registry-wide by
 * `catalog/sampled-label-coverage.test.ts`.
 */
export const getMitreSummaryTool: ToolDefinition = {
  spec: {
    name: 'get_mitre_summary',
    description:
      'Aggregates MITRE ATT&CK-tagged findings within a time range, grouped by technique ID, with a ' +
      'sample technique/tactic name per group. Use for "which techniques are most common" ' +
      'questions, not for a list of individual findings.',
    parameters: objectSchema({
      limit: aggLimitProperty('distinct techniques', 20),
      ...timeRangeProperties(),
    }),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const limit = clampAggLimit(params.limit, 20);
    const { gte, lte } = resolveTimeRange(params);
    return {
      target: 'indexer',
      index: 'wazuh-findings-v5*',
      body: {
        query: {
          bool: {
            filter: [
              { exists: { field: 'wazuh.rule.mitre.technique.id' } },
              { range: { '@timestamp': { gte, lte } } },
            ],
          },
        },
        aggs: {
          top_techniques: {
            terms: { field: 'wazuh.rule.mitre.technique.id', size: limit },
            aggs: {
              sample_doc: {
                top_hits: {
                  size: 1,
                  _source: [
                    'wazuh.rule.mitre.technique.id',
                    'wazuh.rule.mitre.technique.name',
                    'wazuh.rule.mitre.tactic.name',
                  ],
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
      { field: 'wazuh.rule.mitre.technique.name', label: 'Technique (sample)' },
      { field: 'doc_count', label: 'Count' },
      { field: 'wazuh.rule.mitre.tactic.name', label: 'Tactic (sample)' },
      { field: 'key', label: 'Technique ID' },
    ],
  },
  digest: {
    sampleColumns: [
      'key',
      'doc_count',
      'wazuh.rule.mitre.technique.name',
      'wazuh.rule.mitre.tactic.name',
      'wazuh.rule.mitre.technique.id',
    ],
  },
};
