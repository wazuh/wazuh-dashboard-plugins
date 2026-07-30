import { ToolDefinition } from '../types';
import {
  clampLimit,
  limitProperty,
  objectSchema,
  resolveTimeRange,
  severitiesAtOrAbove,
  timeRangeProperties,
} from './common';

/**
 * Medium-to-critical findings within a time range, aggregated by rule category. `size: 0`
 * (aggregation-only, no hit documents fetched) — same shape as `get_top_rules`. The severity
 * floor is a `terms` filter over severity words at or above `medium` (see common.ts's
 * severitiesAtOrAbove), and the aggregation field is `wazuh.rule.category`.
 */
export const getSecuritySummaryTool: ToolDefinition = {
  spec: {
    name: 'get_security_summary',
    description:
      'Aggregates medium-to-critical findings within a time range, grouped by rule category ' +
      '(rule.category). Use for "summarize security events"/"what kinds of findings" questions, ' +
      'not for a list of individual findings.',
    parameters: objectSchema({
      limit: limitProperty(
        'Max number of rule-category buckets to return (default 20, max 100).',
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
              { terms: { 'wazuh.rule.level': severitiesAtOrAbove('medium') } },
              { range: { '@timestamp': { gte, lte } } },
            ],
          },
        },
        aggs: {
          finding_categories: {
            terms: { field: 'wazuh.rule.category', size: limit },
          },
        },
        size: 0,
      },
    };
  },
  tableSpec: {
    columns: [
      { field: 'key', label: 'Category' },
      { field: 'doc_count', label: 'Count' },
    ],
  },
  digest: { sampleColumns: ['key', 'doc_count'] },
};
