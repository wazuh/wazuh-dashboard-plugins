import { ToolDefinition } from '../types';
import {
  alertDigestColumns,
  alertRowFields,
  clampLimit,
  limitProperty,
  minSeverityProperty,
  objectSchema,
  optionalStringParam,
  requireNonEmptyString,
  resolveTimeRange,
  severitiesAtOrAbove,
  STANDARD_ALERT_SAMPLE_COLUMNS,
  STANDARD_ALERT_TABLE_COLUMN_FIELDS,
  STANDARD_ALERT_TABLE_COLUMNS,
  timeRangeProperties,
} from './common';

/**
 * Matches findings by agent name via `bool.filter` with a `match` clause on `wazuh.agent.name`
 * (exact free-text match, no wildcard) plus a time-range clause. `min_severity` is a categorical
 * severity word (see common.ts's severitiesAtOrAbove) applied only when supplied.
 */
export const searchAlertsByAgentTool: ToolDefinition = {
  spec: {
    name: 'search_alerts_by_agent',
    description:
      'Searches security findings for findings from one named agent at or above a minimum ' +
      'severity, within a time range.',
    parameters: objectSchema(
      {
        agent_name: {
          type: 'string',
          description: 'Exact agent name to filter by.',
        },
        min_severity: minSeverityProperty(),
        limit: limitProperty(
          'Max number of alerts to return (default 20, max 500).',
        ),
        ...timeRangeProperties(),
      },
      ['agent_name'],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const agentName = requireNonEmptyString(
      params.agent_name,
      'Parameter "agent_name" is required and must be a non-empty string.',
    );
    const minSeverity = optionalStringParam(params.min_severity);
    const limit = clampLimit(params.limit, 20, 500);
    const { gte, lte } = resolveTimeRange(params);
    const filter: Record<string, unknown>[] = [
      { match: { 'wazuh.agent.name': agentName } },
      { range: { '@timestamp': { gte, lte } } },
    ];
    if (minSeverity) {
      filter.push({
        terms: { 'wazuh.rule.level': severitiesAtOrAbove(minSeverity) },
      });
    }
    return {
      target: 'indexer',
      index: 'wazuh-findings-v5*',
      body: {
        query: { bool: { filter } },
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
