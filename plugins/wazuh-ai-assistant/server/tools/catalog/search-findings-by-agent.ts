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
            '("this box"/"this server") with no known name -- the call resolves automatically ' +
            'when exactly one agent appears in the findings data, and is rejected with the ' +
            'candidate names when more than one does. If the question names or describes a host ' +
            'at all, pass that host here rather than omitting it.',
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
  //
  // The candidate source MUST be an `indexer-terms` aggregation over the exact index and field this
  // tool's own `buildRequest` filters on, never `manager-agents`: the Manager's active-agent list and
  // `wazuh-findings-v5*`'s `wazuh.agent.name` values are different populations. A deployment whose
  // Manager API knows exactly ONE agent (the manager node) can still have many distinct agent names
  // in the findings index, so a manager-agents lookup takes the `kind: 'single'` path and silently
  // filters by an agent with no findings, while the ambiguity-enumerate branch that exists to refuse
  // exactly that never fires because it counted the wrong population. Aggregating the field the query
  // itself matches makes "is this ambiguous" a question about the data being searched.
  //
  // `valueFrom` is meaningless here -- an indexer-terms bucket key IS the agent name this param is
  // matched as. `noteEntityKind: 'HOST'` is mandatory, not decorative: `wazuh.agent.name` values are
  // hostnames, and without the declaration neither the assumption note nor the candidate list is
  // pseudonymized under privacy mode.
  soleCandidateParams: [
    {
      param: 'agent_name',
      source: {
        kind: 'indexer-terms',
        index: 'wazuh-findings-v5*',
        field: 'wazuh.agent.name',
        noteEntityKind: 'HOST',
      },
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
