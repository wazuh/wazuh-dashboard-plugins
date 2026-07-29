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
 * Ported from GET_SECURITY_SUMMARY: medium-to-critical alerts within a time range, aggregated by
 * rule category. `size: 0` (aggregation-only, no hit documents fetched) — same shape as
 * `get_top_rules`.
 * 5.0: retargeted to wazuh-findings-v5*; the old `rule.level >= 7` numeric floor became a `terms`
 * filter over severity words at or above `medium` (see common.ts's severitiesAtOrAbove), and the
 * aggregation field moved from `rule.groups` (removed) to `rule.category`.
 */
export const getSecuritySummaryTool: ToolDefinition = {
  spec: {
    name: 'get_security_summary',
    description:
      'Aggregates medium-to-critical findings within a time range, grouped by rule category ' +
      '(rule.category). Use for "summarize security events"/"what kinds of alerts" questions, ' +
      'not for a list of individual alerts.',
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
              { terms: { 'rule.level': severitiesAtOrAbove('medium') } },
              { range: { '@timestamp': { gte, lte } } },
            ],
          },
        },
        aggs: {
          alert_categories: { terms: { field: 'rule.category', size: limit } },
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
