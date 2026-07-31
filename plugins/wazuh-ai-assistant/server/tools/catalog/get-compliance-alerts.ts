import {
  COMPLIANCE_FRAMEWORKS,
  COMPLIANCE_FRAMEWORK_FIELDS,
  ComplianceFramework,
} from '../../../common/wazuh-fields';
import { ToolDefinition } from '../types';
import {
  findingDigestColumns,
  findingRowFields,
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
      'first.',
    parameters: objectSchema(
      {
        framework: {
          type: 'array',
          description:
            'One or more compliance frameworks to filter by (matches any of them).',
          items: { type: 'string', enum: [...COMPLIANCE_FRAMEWORKS] },
          minItems: 1,
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
    const limit = clampLimit(params.limit, 20, 500);
    const { gte, lte } = resolveTimeRange(params);
    const existsClauses = frameworks.map(framework => ({
      exists: { field: COMPLIANCE_FRAMEWORK_FIELDS[framework] },
    }));
    const complianceFilter =
      existsClauses.length === 1
        ? existsClauses[0]
        : { bool: { should: existsClauses, minimum_should_match: 1 } };
    return {
      target: 'indexer',
      index: 'wazuh-findings-v5*',
      body: {
        query: {
          bool: {
            filter: [complianceFilter, { range: { '@timestamp': { gte, lte } } }],
          },
        },
        sort: [{ '@timestamp': { order: 'desc' } }],
        size: limit,
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
  },
};
