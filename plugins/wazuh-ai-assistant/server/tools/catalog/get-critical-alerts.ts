import { ToolDefinition } from '../types';
import {
  alertDigestColumns,
  alertRowFields,
  clampLimit,
  limitProperty,
  objectSchema,
  resolveTimeRange,
  STANDARD_ALERT_SAMPLE_COLUMNS,
  STANDARD_ALERT_TABLE_COLUMN_FIELDS,
  STANDARD_ALERT_TABLE_COLUMNS,
  timeRangeProperties,
} from './common';

/**
 * Ported from 4.14 (rule.level >= 15), which used a `query_string`
 * range-syntax template (`rule.level:>=15 AND timestamp:[...]`); rebuilt here as `bool.filter` of
 * two `range` clauses — same semantics, no free-text query parsing.
 * 5.0: retargeted to wazuh-findings-v5*; rule.level is now a categorical keyword, so the old
 * `rule.level >= 15` range became a `terms` filter on the literal `critical` severity word.
 */
export const getCriticalAlertsTool: ToolDefinition = {
  spec: {
    name: 'get_critical_alerts',
    description:
      'Searches security findings for critical-severity findings within a time range, most ' +
      'recent first.',
    parameters: objectSchema({
      limit: limitProperty(
        'Max number of alerts to return (default 20, max 500).',
      ),
      ...timeRangeProperties(),
    }),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const limit = clampLimit(params.limit, 20, 500);
    const { gte, lte } = resolveTimeRange(params);
    return {
      target: 'indexer',
      index: 'wazuh-findings-v5*',
      body: {
        query: {
          bool: {
            filter: [
              { terms: { 'wazuh.rule.level': ['critical'] } },
              { range: { '@timestamp': { gte, lte } } },
            ],
          },
        },
        sort: [{ '@timestamp': { order: 'desc' } }],
        size: limit,
      },
    };
  },
  tableSpec: {
    columns: STANDARD_ALERT_TABLE_COLUMNS,
    rowFields: alertRowFields(STANDARD_ALERT_TABLE_COLUMN_FIELDS),
  },
  digest: { sampleColumns: alertDigestColumns(STANDARD_ALERT_SAMPLE_COLUMNS) },
};
