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
 * Column design (issue #8921), the WORSE case of the sampled-label-falsehood class than
 * get-top-rules.ts: `wazuh.rule.mitre.technique.name`/`tactic.name` are MULTI-VALUE arrays on the
 * underlying document (one finding can carry several MITRE techniques), so the bucket key (one
 * technique id) does not even structurally determine which element of the sampled document's name
 * array corresponds to it — a doc tagged `technique.id: [T1059, T1071]` /
 * `technique.name: ["Command and Scripting Interpreter", "Application Layer Protocol"]`, sampled
 * into the T1059 bucket, has no positional guarantee that "Command and Scripting Interpreter" (the
 * first name) is actually T1059's name rather than T1071's. Adding `technique.id` itself to the
 * `top_hits` `_source` fixes that structurally: the id array and name array on any one document are
 * parallel by construction, so a consumer can zip them and pick the name at whichever index its own
 * id equals the bucket key — a positional match that was previously impossible because the id array
 * was never even sent. `distinct_names` (a `cardinality` sub-agg, same merge path as
 * get-top-rules.ts's `distinct_titles`) discloses the spread the same way; the visible columns are
 * relabeled "(sample)" so the falsehood is legible even without reading the id array.
 *
 * The adopted rule, verbatim: a sampled label may only be displayed where the key determines the
 * label; otherwise carry the spread and mark the label as a sample. Enforced registry-wide by
 * `catalog/sampled-label-coverage.test.ts`.
 *
 * `distinct_tactics` deliberately goes beyond this issue's literal column-design brief (which named
 * only a `technique.name` spread guard): `wazuh.rule.mitre.tactic.name` is sampled and relabeled
 * "(sample)" by that same brief, and it is EXACTLY the same multi-value-array failure mode as
 * `technique.name` (one technique routinely maps to more than one MITRE tactic) — shipping the rule
 * for one sampled column of this tool and not its sibling would make
 * `sampled-label-coverage.test.ts` fail against this very file, or force a false "1:1" justification
 * into that test's exemption map, which would be dishonest (a technique is not 1:1 with a tactic).
 * Digest-only (no new visible `tableSpec` column, keeping the 5-column design this issue asked
 * for) — same precedent as `catalog/common.ts`'s `FINDING_DIGEST_EXTRA_COLUMNS` (digest-visible
 * fields that are not table columns).
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
              distinct_names: {
                cardinality: { field: 'wazuh.rule.mitre.technique.name' },
              },
              distinct_tactics: {
                cardinality: { field: 'wazuh.rule.mitre.tactic.name' },
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
      { field: 'distinct_names', label: 'Distinct names' },
      { field: 'wazuh.rule.mitre.tactic.name', label: 'Tactic (sample)' },
      { field: 'key', label: 'Technique ID' },
    ],
  },
  digest: {
    sampleColumns: [
      'key',
      'doc_count',
      'wazuh.rule.mitre.technique.name',
      'distinct_names',
      'wazuh.rule.mitre.tactic.name',
      'distinct_tactics',
      'wazuh.rule.mitre.technique.id',
    ],
  },
};
