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
  resolveTimeRange,
  STANDARD_FINDING_SAMPLE_COLUMNS,
  STANDARD_FINDING_TABLE_COLUMN_FIELDS,
  STANDARD_FINDING_TABLE_COLUMNS,
  timeRangeProperties,
} from './common';

/**
 * Findings at the critical severity level within a time range, built as `bool.filter` of a
 * `terms` filter on the literal `critical` severity word plus a time-range clause — no free-text
 * query parsing.
 */
export const getCriticalFindingsTool: ToolDefinition = {
  spec: {
    name: 'get_critical_findings',
    description:
      'Searches security findings for critical-severity findings across the fleet (all agents/' +
      `hosts/machines) within a time range, most recent first. ${FINDING_SCOPE_NOTE}`,
    parameters: objectSchema({
      limit: limitProperty(
        'Max number of findings to return (default 20, max 500).',
      ),
      ...timeRangeProperties(),
      ...findingArtifactFilterProperties(),
    }),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const limit = clampLimit(params.limit, 20, 500);
    const { gte, lte } = resolveTimeRange(params);
    const filter: Record<string, unknown>[] = [
      { terms: { 'wazuh.rule.level': ['critical'] } },
      { range: { '@timestamp': { gte, lte } } },
      ...findingArtifactFilterClauses(params),
    ];
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
