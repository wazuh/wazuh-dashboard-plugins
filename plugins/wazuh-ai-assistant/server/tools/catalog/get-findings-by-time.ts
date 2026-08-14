import { ToolDefinition } from '../types';
import {
  findingArtifactFilterClauses,
  findingArtifactFilterProperties,
  findingDigestColumns,
  FINDING_BREAKDOWN_AGGS,
  FINDING_BREAKDOWN_DIMENSIONS,
  findingRowFields,
  clampLimit,
  FINDING_SCOPE_NOTE,
  limitProperty,
  objectSchema,
  optionalStringParam,
  resolveTimeRange,
  severityComparisonProperty,
  severityFilterValues,
  severityProperty,
  STANDARD_FINDING_SAMPLE_COLUMNS,
  STANDARD_FINDING_TABLE_COLUMN_FIELDS,
  STANDARD_FINDING_TABLE_COLUMNS,
  timeRangeProperties,
} from './common';

/**
 * Searches findings across an arbitrary time range with no forced severity filter. The time range
 * is exposed as params (defaulting via `resolveTimeRange`) plus an optional `severity`, so
 * "show me the findings in the last 24 hours" routes here instead of to `get_critical_findings` (which
 * is scoped to the critical severity word only). `severity` matches that exact severity word by
 * default; `severity_comparison` opts into "or above"/"or below" (see common.ts's
 * severityFilterValues).
 */
export const getFindingsByTimeTool: ToolDefinition = {
  spec: {
    name: 'get_findings_by_time',
    description:
      'Searches security findings for ALL findings (alerts/detections/hits) of any severity ' +
      `within a time range, most recent first. ${FINDING_SCOPE_NOTE} Use for general "show me ` +
      'the findings"/"what happened in the last N hours" questions about detections specifically ' +
      '— not restricted to critical findings, and NOT proof nothing happened if it returns 0 (the ' +
      'raw event stream is a separate, unchecked source). Optional severity narrows to exactly ' +
      'that severity, or to a floor/ceiling via severity_comparison.',
    parameters: objectSchema({
      limit: limitProperty(
        'Max number of findings to return (default 20, max 500).',
      ),
      severity: severityProperty(),
      severity_comparison: severityComparisonProperty(),
      ...timeRangeProperties(),
      ...findingArtifactFilterProperties(),
    }),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const limit = clampLimit(params.limit, 20, 500);
    const { gte, lte } = resolveTimeRange(params);
    const severity = optionalStringParam(params.severity);
    const severityComparison = optionalStringParam(params.severity_comparison);
    const filter: Record<string, unknown>[] = [
      { range: { '@timestamp': { gte, lte } } },
    ];
    if (severity) {
      filter.push({
        terms: {
          'wazuh.rule.level': severityFilterValues(
            severity,
            severityComparison,
          ),
        },
      });
    }
    filter.push(...findingArtifactFilterClauses(params));
    return {
      target: 'indexer',
      index: 'wazuh-findings-v5*',
      body: {
        query: { bool: { filter } },
        sort: [{ '@timestamp': { order: 'desc' } }],
        size: limit,
        aggs: FINDING_BREAKDOWN_AGGS,
      },
    };
  },
  tableSpec: {
    columns: STANDARD_FINDING_TABLE_COLUMNS,
    rowFields: findingRowFields(STANDARD_FINDING_TABLE_COLUMN_FIELDS),
  },
  digest: {
    sampleColumns: findingDigestColumns(STANDARD_FINDING_SAMPLE_COLUMNS),
    breakdownDimensions: FINDING_BREAKDOWN_DIMENSIONS,
  },
};
