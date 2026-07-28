import { ToolDefinition } from '../types';
import {
  clampLimit,
  limitProperty,
  objectSchema,
  resolveTimeRange,
  timeRangeProperties,
} from './common';

/**
 * Ported from GET_TOP_RULES: a `terms` aggregation on `wazuh.rule.id` (on the guardrail low-cardinality
 * allowlist) with a `top_hits` sub-aggregation sampling one `wazuh.rule.description` per bucket,
 * `size: 0` (aggregation-only, no hit documents fetched).
 * 5.0: retargeted to wazuh-findings-v5*; time field @timestamp.
 * rule.id/rule.description survive unchanged in the findings schema.
 */
export const getTopRulesTool: ToolDefinition = {
  spec: {
    name: 'get_top_rules',
    description:
      'Aggregates the most frequently triggered rules within a time range, with a sample ' +
      'description per rule.',
    parameters: objectSchema({
      limit: limitProperty(
        'Max number of distinct rules to return (default 20, max 100).',
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
          bool: { filter: [{ range: { '@timestamp': { gte, lte } } }] },
        },
        aggs: {
          top_rules: {
            terms: { field: 'wazuh.rule.id', size: limit },
            aggs: {
              sample_doc: {
                top_hits: { size: 1, _source: ['wazuh.rule.description'] },
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
      { field: 'key', label: 'Rule ID' },
      { field: 'doc_count', label: 'Count' },
      { field: 'wazuh.rule.description', label: 'Description' },
    ],
  },
  digest: { sampleColumns: ['key', 'doc_count', 'wazuh.rule.description'] },
};
