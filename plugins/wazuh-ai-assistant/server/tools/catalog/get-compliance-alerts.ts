import {
  COMPLIANCE_FRAMEWORKS,
  COMPLIANCE_FRAMEWORK_FIELDS,
  ComplianceFramework,
} from '../../../common/wazuh-fields';
import { ToolDefinition } from '../types';
import {
  findingDigestColumns,
  findingRowFields,
  FINDING_BREAKDOWN_AGGS,
  FINDING_BREAKDOWN_DIMENSIONS,
  clampLimit,
  limitProperty,
  objectSchema,
  resolveTimeRange,
  STANDARD_FINDING_SAMPLE_COLUMNS,
  STANDARD_FINDING_TABLE_COLUMN_FIELDS,
  STANDARD_FINDING_TABLE_COLUMNS,
  timeRangeProperties,
} from './common';

const COMPLIANCE_ROW_FIELDS = COMPLIANCE_FRAMEWORKS.map(
  framework => COMPLIANCE_FRAMEWORK_FIELDS[framework],
);

function parseFrameworks(value: unknown): ComplianceFramework[] {
  const raw = Array.isArray(value) ? value : [];
  const frameworks = raw.filter(
    (entry): entry is ComplianceFramework =>
      typeof entry === 'string' &&
      (COMPLIANCE_FRAMEWORKS as readonly string[]).includes(entry),
  );
  if (frameworks.length === 0) {
    throw new Error(
      'Parameter "framework" is required and must be one or more of: ' +
        `${COMPLIANCE_FRAMEWORKS.join(', ')}.`,
    );
  }
  return frameworks;
}

/** Same shape as `parseFrameworks` but optional (an absent/empty `exclude_framework` means "no
 * exclusion"), for the "framework A but not framework B" case no single `should` clause can
 * express. */
function parseExcludeFrameworks(value: unknown): ComplianceFramework[] {
  const raw = Array.isArray(value) ? value : [];
  return raw.filter(
    (entry): entry is ComplianceFramework =>
      typeof entry === 'string' &&
      (COMPLIANCE_FRAMEWORKS as readonly string[]).includes(entry),
  );
}

/**
 * Replaces `get_pci_dss_findings` (retired): each framework is its own
 * `wazuh.rule.compliance.<framework>` field, not a value of one shared field, so "one or many
 * frameworks" is an `exists`-per-framework `should` clause (`minimum_should_match: 1` for more
 * than one) rather than a single `terms` filter.
 */
export const getComplianceAlertsTool: ToolDefinition = {
  spec: {
    name: 'get_compliance_alerts',
    description:
      'Searches security findings tagged with a compliance requirement for one or more ' +
      'frameworks (wazuh.rule.compliance.<framework> present), within a time range, most recent ' +
      'first. Optional exclude_framework filters out findings that ALSO carry a requirement tag ' +
      'for any of those frameworks -- use for "framework A but not framework B" questions.',
    parameters: objectSchema(
      {
        framework: {
          type: 'array',
          description:
            'One or more compliance frameworks to filter by (matches any of them).',
          items: { type: 'string', enum: [...COMPLIANCE_FRAMEWORKS] },
          minItems: 1,
        },
        exclude_framework: {
          type: 'array',
          description:
            'Optional: exclude findings that also carry a requirement tag for any of these ' +
            'frameworks. Omit for no exclusion.',
          items: { type: 'string', enum: [...COMPLIANCE_FRAMEWORKS] },
        },
        limit: limitProperty(
          'Max number of findings to return (default 20, max 500).',
        ),
        ...timeRangeProperties(),
      },
      ['framework'],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const frameworks = parseFrameworks(params.framework);
    const excludeFrameworks = parseExcludeFrameworks(params.exclude_framework);
    const limit = clampLimit(params.limit, 20, 500);
    const { gte, lte } = resolveTimeRange(params);
    const existsClauses = frameworks.map(framework => ({
      exists: { field: COMPLIANCE_FRAMEWORK_FIELDS[framework] },
    }));
    const complianceFilter =
      existsClauses.length === 1
        ? existsClauses[0]
        : { bool: { should: existsClauses, minimum_should_match: 1 } };
    const excludeClauses = excludeFrameworks.map(framework => ({
      exists: { field: COMPLIANCE_FRAMEWORK_FIELDS[framework] },
    }));
    return {
      target: 'indexer',
      index: 'wazuh-findings-v5*',
      body: {
        query: {
          bool: {
            filter: [
              complianceFilter,
              { range: { '@timestamp': { gte, lte } } },
            ],
            ...(excludeClauses.length > 0 ? { must_not: excludeClauses } : {}),
          },
        },
        sort: [{ '@timestamp': { order: 'desc' } }],
        size: limit,
        // Population-true agent/rule-title breakdown over the FULL matched set -- same mechanism
        // as the other finding-hits tools (common.ts's FINDING_BREAKDOWN_AGGS doc comment).
        aggs: FINDING_BREAKDOWN_AGGS,
      },
    };
  },
  tableSpec: {
    columns: STANDARD_FINDING_TABLE_COLUMNS,
    rowFields: [
      ...findingRowFields(STANDARD_FINDING_TABLE_COLUMN_FIELDS),
      ...COMPLIANCE_ROW_FIELDS,
    ],
  },
  digest: {
    sampleColumns: [
      ...findingDigestColumns(STANDARD_FINDING_SAMPLE_COLUMNS),
      ...COMPLIANCE_ROW_FIELDS,
    ],
    breakdownDimensions: FINDING_BREAKDOWN_DIMENSIONS,
  },
};
