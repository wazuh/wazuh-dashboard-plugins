import { ToolDefinition } from '../types';
import {
  aggLimitProperty,
  clampAggLimit,
  objectSchema,
  resolveTimeRange,
  timeRangeProperties,
} from './common';

/**
 * A `terms` aggregation on `wazuh.rule.id` (on the guardrail low-cardinality allowlist) with a
 * `top_hits` sub-aggregation sampling one `wazuh.rule.title` per bucket, `size: 0`
 * (aggregation-only, no hit documents fetched).
 */
export const getTopRulesTool: ToolDefinition = {
  spec: {
    name: 'get_top_rules',
    description:
      'Aggregates the most frequently triggered rules within a time range, with a sample ' +
      'title per rule.',
    parameters: objectSchema({
      limit: aggLimitProperty('distinct rules', 20),
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
          bool: { filter: [{ range: { '@timestamp': { gte, lte } } }] },
        },
        aggs: {
          top_rules: {
            terms: { field: 'wazuh.rule.id', size: limit },
            aggs: {
              sample_doc: {
                top_hits: { size: 1, _source: ['wazuh.rule.title'] },
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
      { field: 'wazuh.rule.title', label: 'Title' },
    ],
  },
  digest: { sampleColumns: ['key', 'doc_count', 'wazuh.rule.title'] },
};
