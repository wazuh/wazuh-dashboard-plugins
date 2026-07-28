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
  timeRangeProperties,
} from './common';

const TABLE_COLUMNS = [
  { field: '@timestamp', label: 'Time' },
  { field: 'wazuh.agent.name', label: 'Agent' },
  { field: 'host.os.name', label: 'OS' },
  { field: 'wazuh.rule.description', label: 'Description' },
  { field: 'wazuh.rule.level', label: 'Level', severity: true },
];
const SAMPLE_COLUMNS = [
  '@timestamp',
  'wazuh.agent.name',
  'host.os.name',
  'wazuh.rule.level',
];

/**
 * Ported from 4.14, which used the retired agent.os.name field with a wildcard match
 * (agent.os.name:*{{os_name}}*); a plain analyzed match on that same retired field reproduced this
 * for the common cases ("Windows", "Ubuntu", "CentOS", ...) without a wildcard.
 * 5.0: retargeted to wazuh-findings-v5*; the OS field moved from that retired 4.x field to
 * `host.os.name` (ECS) — unchanged by this rename, since `host.os.name` was always an ECS field,
 * never a `wazuh.*`-prefixed one — and min_severity is now a categorical severity word (see
 * common.ts's severitiesAtOrAbove) applied only when supplied, rather than a numeric rule.level
 * floor defaulting to 0.
 */
export const searchAlertsByOsTool: ToolDefinition = {
  spec: {
    name: 'search_alerts_by_os',
    description:
      'Searches security findings for findings from agents running a given operating system ' +
      '(e.g. "Windows", "Ubuntu"), at or above a minimum severity, within a time range.',
    parameters: objectSchema(
      {
        os_name: {
          type: 'string',
          description: 'Operating system name to filter by, e.g. "Windows".',
        },
        min_severity: minSeverityProperty(),
        limit: limitProperty(
          'Max number of alerts to return (default 20, max 500).',
        ),
        ...timeRangeProperties(),
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
    const minSeverity = optionalStringParam(params.min_severity);
    const limit = clampLimit(params.limit, 20, 500);
    const { gte, lte } = resolveTimeRange(params);
    // 5.0 CORRECTNESS FIX: `match` on `host.os.name` ALONE silently returned nothing for the most
    // natural phrasing of this question. `host.os.name` is `keyword` in 5.0 and stores the full
    // display string, so a single-token analyzed `match` only hits when that token IS the entire
    // value. Proven live on identical data: `match "Windows"` -> 0, `match "Microsoft Windows Server
    // 2019"` -> 41, `match "Ubuntu"` -> 188. "Ubuntu" worked only BY ACCIDENT (it happens to be the
    // whole stored value) — which is exactly why this was easy to miss: the tool looked correct on
    // Linux data and was dead on Windows data.
    //
    // Matches the ECS-normalised `host.os.platform` (a low-cardinality keyword holding values like
    // `ubuntu`/`windows`) while KEEPING the `host.os.name` match so an exact full display name
    // still works. Same `bool.should` + `minimum_should_match: 1` shape
    // `get_brute_force` uses; the mandatory time range stays in `filter` so the guardrail's
    // required-context time check still counts it.
    const filter: Record<string, unknown>[] = [
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
      },
    };
  },
  tableSpec: {
    columns: TABLE_COLUMNS,
    rowFields: alertRowFields(TABLE_COLUMNS.map(column => column.field)),
  },
  digest: { sampleColumns: alertDigestColumns(SAMPLE_COLUMNS) },
};
