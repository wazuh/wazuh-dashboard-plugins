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
 * Ported from SEARCH_ALERTS_BY_RULE_ID: exact match on `wazuh.rule.id` plus a time range. `wazuh.rule.id` is
 * mapped `keyword`, so a `term` query with
 * the value converted to a string is the correct exact-match form; kept string-form deliberately
 * (rather than a bare numeric term) as defense-in-depth, since OpenSearch would also coerce a
 * numeric-string term correctly if the mapping ever changed. The `rule_id` param is typed `number`
 * for a natural model-facing UX (rule IDs are numeric); `schema-validator.ts`'s coercion already
 * accepts a numeric-looking string too.
 * 5.0: retargeted to wazuh-findings-v5*.
 */
export const searchAlertsByRuleIdTool: ToolDefinition = {
  spec: {
    name: 'search_alerts_by_rule_id',
    description:
      'Searches security findings for findings triggered by one exact rule ID, within a time ' +
      'range, most recent first. Use when the question names a specific numeric rule ID.',
    parameters: objectSchema(
      {
        rule_id: {
          type: 'number',
          description: 'Exact Wazuh rule ID, e.g. 5710.',
        },
        limit: limitProperty(
          'Max number of alerts to return (default 20, max 500).',
        ),
        ...timeRangeProperties(),
      },
      ['rule_id'],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const ruleId = params.rule_id;
    if (typeof ruleId !== 'number' || !Number.isFinite(ruleId)) {
      throw new Error('Parameter "rule_id" is required and must be a number.');
    }
    const limit = clampLimit(params.limit, 20, 500);
    const { gte, lte } = resolveTimeRange(params);
    return {
      target: 'indexer',
      index: 'wazuh-findings-v5*',
      body: {
        query: {
          bool: {
            filter: [
              { term: { 'wazuh.rule.id': String(ruleId) } },
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
