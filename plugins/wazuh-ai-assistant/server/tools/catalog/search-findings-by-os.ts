import { ToolDefinition } from '../types';
import {
  findingArtifactFilterClauses,
  findingArtifactFilterProperties,
  findingDigestColumns,
  findingRowFields,
  FINDING_BREAKDOWN_AGGS,
  FINDING_BREAKDOWN_DIMENSIONS,
  clampLimit,
  limitProperty,
  objectSchema,
  optionalStringParam,
  requireNonEmptyString,
  resolveTimeRange,
  severityComparisonProperty,
  severityFilterValues,
  severityProperty,
  timeRangeProperties,
} from './common';

const TABLE_COLUMNS = [
  { field: '@timestamp', label: 'Time' },
  { field: 'wazuh.agent.name', label: 'Agent' },
  { field: 'host.os.name', label: 'OS' },
  { field: 'wazuh.rule.title', label: 'Title' },
  { field: 'wazuh.rule.level', label: 'Level', severity: true },
];
const SAMPLE_COLUMNS = [
  '@timestamp',
  'wazuh.agent.name',
  'host.os.name',
  'wazuh.rule.level',
];

/**
 * Matches findings from agents running a given OS via the ECS `host.os.name`/`host.os.platform`
 * fields, without a wildcard match. `severity` matches that exact severity word by default;
 * `severity_comparison` opts into "or above"/"or below" (see common.ts's severityFilterValues),
 * applied only when `severity` is supplied.
 */
export const searchFindingsByOsTool: ToolDefinition = {
  spec: {
    name: 'search_findings_by_os',
    description:
      'Searches security findings for findings from agents running a given operating system ' +
      '(e.g. "Windows", "Ubuntu"), within a time range. Optional severity narrows to exactly ' +
      'that severity, or to a floor/ceiling via severity_comparison.',
    parameters: objectSchema(
      {
        os_name: {
          type: 'string',
          description: 'Operating system name to filter by, e.g. "Windows".',
        },
        severity: severityProperty(),
        severity_comparison: severityComparisonProperty(),
        limit: limitProperty(
          'Max number of findings to return (default 20, max 500).',
        ),
        ...timeRangeProperties(),
        ...findingArtifactFilterProperties(),
      },
      ['os_name'],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const osName = requireNonEmptyString(
      params.os_name,
      'Parameter "os_name" is required and must be a non-empty string.',
    );
    const severity = optionalStringParam(params.severity);
    const severityComparison = optionalStringParam(params.severity_comparison);
    const limit = clampLimit(params.limit, 20, 500);
    const { gte, lte } = resolveTimeRange(params);
    // `host.os.name` is `keyword` and stores the full display string, so a single-token analyzed
    // `match` on it alone only hits when that token IS the entire value (e.g. it would match
    // "Ubuntu" but not "Windows" when the stored value is "Microsoft Windows Server 2019").
    //
    // Matches the ECS-normalised `host.os.platform` (a low-cardinality keyword holding values like
    // `ubuntu`/`windows`) while KEEPING the `host.os.name` match so an exact full display name
    // still works. Same `bool.should` + `minimum_should_match: 1` shape
    // `get_brute_force` uses; the mandatory time range stays in `filter` so the guardrail's
    // required-context time check still counts it.
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
        query: {
          bool: {
            filter,
            minimum_should_match: 1,
            should: [
              { term: { 'host.os.platform': osName.trim().toLowerCase() } },
              { match: { 'host.os.name': osName } },
            ],
          },
        },
        sort: [{ '@timestamp': { order: 'desc' } }],
        size: limit,
        // Population-true agent/rule-title breakdown over the FULL matched set (issue #8920 item
        // 1). Same mechanism as the other finding-hits tools (common.ts's FINDING_BREAKDOWN_AGGS
        // doc comment); this tool was missed when that fix first landed.
        aggs: FINDING_BREAKDOWN_AGGS,
      },
    };
  },
  tableSpec: {
    columns: TABLE_COLUMNS,
    rowFields: findingRowFields(TABLE_COLUMNS.map(column => column.field)),
  },
  digest: {
    sampleColumns: findingDigestColumns(SAMPLE_COLUMNS),
    breakdownDimensions: FINDING_BREAKDOWN_DIMENSIONS,
  },
};
