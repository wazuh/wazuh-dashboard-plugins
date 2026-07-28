import { ToolDefinition } from '../types';
import {
  clampLimit,
  limitProperty,
  objectSchema,
  resolveTimeRange,
  timeRangeProperties,
} from './common';

/**
 * NEW module (MITRE ATT&CK), same aggregation shape as `get_top_rules.ts`: a `terms` agg on the
 * technique-id field with a `top_hits` sub-aggregation sampling one technique-name/tactic-name
 * pair per bucket, `size: 0`. In 4.14 this was a `terms` agg on the retired rule.mitre.id sampling
 * the retired rule.mitre.technique/rule.mitre.tactic; those fields were added to `guardrails.ts`'s
 * `AGG_FIELD_ALLOWLIST` for this tool (both confirmed `keyword`-mapped and low-cardinality — a
 * finite technique catalog — in the wazuh-dashboard-plugins clone; see that file's comment for the
 * exact citation).
 * 5.0: retargeted to wazuh-findings-v5*; the retired 4.14 rule.mitre.id field has no 5.0
 * equivalent and is replaced by `wazuh.rule.mitre.technique.id`, the retired 4.14
 * `rule.mitre.technique` field is replaced by `wazuh.rule.mitre.technique.name`, and the retired
 * 4.14 rule.mitre.tactic field is replaced by `wazuh.rule.mitre.tactic.name`.
 */
export const getMitreSummaryTool: ToolDefinition = {
  spec: {
    name: 'get_mitre_summary',
    description:
      'Aggregates MITRE ATT&CK-tagged alerts within a time range, grouped by technique ID, with a ' +
      'sample technique/tactic name per group. Use for "which techniques are most common" ' +
      'questions, not for a list of individual alerts.',
    parameters: objectSchema({
      limit: limitProperty(
        'Max number of distinct techniques to return (default 20, max 100).',
      ),
      ...timeRangeProperties(),
    }),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const limit = clampLimit(params.limit, 20, 100);
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
