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
      { field: 'key', label: 'Technique ID' },
      { field: 'doc_count', label: 'Count' },
      { field: 'wazuh.rule.mitre.technique.name', label: 'Technique' },
      { field: 'wazuh.rule.mitre.tactic.name', label: 'Tactic' },
    ],
  },
  // `wazuh.rule.mitre.tactic.name`: already sampled by
  // the top_hits sub-agg's `_source` above and already a visible table column; the digest
  // whitelist was the only place lagging.
  digest: {
    sampleColumns: [
      'key',
      'doc_count',
      'wazuh.rule.mitre.technique.name',
      'wazuh.rule.mitre.tactic.name',
    ],
  },
};
