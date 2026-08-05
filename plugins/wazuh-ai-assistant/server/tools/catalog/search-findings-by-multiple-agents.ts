import { ToolDefinition } from '../types';
import {
  findingDigestColumns,
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
 * `wazuh.agent.name` is mapped `keyword` at the top level with no `.keyword` subfield needed, so
 * this filters with a single `terms` clause on the exact agent names rather than one `match`
 * clause per name. `severity` matches that exact severity word by default; `severity_comparison`
 * opts into "or above"/"or below" (see common.ts's severityFilterValues), applied only when
 * `severity` is supplied.
 */
export const searchFindingsByMultipleAgentsTool: ToolDefinition = {
  spec: {
    name: 'search_findings_by_multiple_agents',
    description:
      'Searches security findings from any of several named agents (hosts/machines/endpoints), ' +
      `within a time range. ${FINDING_SCOPE_NOTE} Optional severity narrows to exactly that ` +
      'severity, or to a floor/ceiling via severity_comparison. Use when the question names two ' +
      'or more agents; use search_findings_by_agent instead for a single agent.',
    parameters: objectSchema(
      {
        agent_names: {
          type: 'array',
          description: 'Exact agent names to filter by (matches any of them).',
          items: { type: 'string' },
        },
        severity: severityProperty(),
        severity_comparison: severityComparisonProperty(),
        limit: limitProperty(
          'Max number of findings to return (default 20, max 500).',
        ),
        ...timeRangeProperties(),
      },
      ['agent_names'],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const agentNames = params.agent_names;
    if (
      !Array.isArray(agentNames) ||
      agentNames.length === 0 ||
      !agentNames.every(name => typeof name === 'string' && name.trim() !== '')
    ) {
      throw new Error(
        'Parameter "agent_names" is required and must be a non-empty array of strings.',
      );
    }
    const severity = optionalStringParam(params.severity);
    const severityComparison = optionalStringParam(params.severity_comparison);
    const limit = clampLimit(params.limit, 20, 500);
    const { gte, lte } = resolveTimeRange(params);
    const filter: Record<string, unknown>[] = [
      { terms: { 'wazuh.agent.name': agentNames } },
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
    columns: STANDARD_FINDING_TABLE_COLUMNS,
    rowFields: findingRowFields(STANDARD_FINDING_TABLE_COLUMN_FIELDS),
  },
  digest: {
    sampleColumns: findingDigestColumns(STANDARD_FINDING_SAMPLE_COLUMNS),
  },
};
