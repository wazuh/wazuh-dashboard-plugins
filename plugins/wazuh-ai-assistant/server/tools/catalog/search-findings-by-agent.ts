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
  requireNonEmptyString,
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
 * Matches findings by agent name via `bool.filter` with a `match` clause on `wazuh.agent.name`
 * (exact free-text match, no wildcard) plus a time-range clause. `severity` matches that exact
 * severity word by default; `severity_comparison` opts into "or above"/"or below" (see
 * common.ts's severityFilterValues), applied only when `severity` is supplied.
 */
export const searchFindingsByAgentTool: ToolDefinition = {
  spec: {
    name: 'search_findings_by_agent',
    description:
      'Searches security findings from one named agent (host/machine/endpoint), within a time ' +
      `range. ${FINDING_SCOPE_NOTE} Optional severity narrows to exactly that severity, or to a ` +
      'floor/ceiling via severity_comparison.',
    parameters: objectSchema(
      {
        agent_name: {
          type: 'string',
          description:
            'Exact agent name to filter by. Optional: omit this for a deictic host reference ' +
            '("this box"/"this server") with no known name -- the call resolves to the only ' +
            'active agent automatically.',
        },
        severity: severityProperty(),
        severity_comparison: severityComparisonProperty(),
        limit: limitProperty(
          'Max number of findings to return (default 20, max 500).',
        ),
        ...timeRangeProperties(),
        ...findingArtifactFilterProperties(),
      },
      [],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  // Issue: generic sole-candidate parameter resolution (template: #8913's
  // resolveDeicticAgentParams in get-agent-inventory.ts). A strictly-required `agent_name`
  // measured 0/40 invocations on deictic findings questions ("what happened on this host").
  // `valueFrom: 'name'` since this param is matched as free text against `wazuh.agent.name`
  // (see buildRequest below), not a numeric Manager id.
  soleCandidateParams: [
    {
      param: 'agent_name',
      source: { kind: 'manager-agents' },
      valueFrom: 'name',
    },
  ],
  buildRequest(params) {
    const agentName = requireNonEmptyString(
      params.agent_name,
      'Parameter "agent_name" is required and must be a non-empty string.',
    );
    const severity = optionalStringParam(params.severity);
    const severityComparison = optionalStringParam(params.severity_comparison);
    const limit = clampLimit(params.limit, 20, 500);
    const { gte, lte } = resolveTimeRange(params);
    const filter: Record<string, unknown>[] = [
      { match: { 'wazuh.agent.name': agentName } },
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
