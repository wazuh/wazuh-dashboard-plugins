import { ToolDefinition } from '../types';
import {
  alertDigestColumns,
  alertRowFields,
  clampLimit,
  limitProperty,
  minSeverityProperty,
  objectSchema,
  optionalStringParam,
  resolveTimeRange,
  severitiesAtOrAbove,
  STANDARD_ALERT_SAMPLE_COLUMNS,
  STANDARD_ALERT_TABLE_COLUMN_FIELDS,
  STANDARD_ALERT_TABLE_COLUMNS,
  timeRangeProperties,
} from './common';

/**
 * Generalized port of the 4.14 last-24h alerts tool, which hard-coded `now-24h` with no severity
 * floor; this tool exposes the time range as params (defaulting via `resolveTimeRange`) plus an
 * optional `min_severity`, so "show me the alerts in the last 24 hours" routes here instead of to
 * `get_critical_alerts` (rule.level >= 15 only) — the reported gap this tool exists to fix.
 * 5.0: retargeted to wazuh-findings-v5*; min_severity is now one of the categorical severity
 * words (see common.ts's severitiesAtOrAbove) instead of a numeric rule.level floor.
 */
export const getAlertsByTimeTool: ToolDefinition = {
  spec: {
    name: 'get_alerts_by_time',
    description:
      'Searches security findings for ALL findings of any severity within a time range, most ' +
      'recent first. Use for general "show me the alerts"/"what happened in the last N hours" ' +
      'questions — not restricted to critical alerts. Optional min_severity narrows by a ' +
      'severity floor.',
    parameters: objectSchema({
      limit: limitProperty(
        'Max number of alerts to return (default 20, max 500).',
      ),
      min_severity: minSeverityProperty(),
      ...timeRangeProperties(),
    }),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const limit = clampLimit(params.limit, 20, 500);
    const { gte, lte } = resolveTimeRange(params);
    const minSeverity = optionalStringParam(params.min_severity);
    const filter: Record<string, unknown>[] = [
      { range: { '@timestamp': { gte, lte } } },
    ];
    if (minSeverity !== undefined) {
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
