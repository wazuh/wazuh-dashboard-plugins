import {
  COMPLIANCE_FRAMEWORKS,
  COMPLIANCE_FRAMEWORK_FIELDS,
  ComplianceFramework,
} from '../../../common/wazuh-fields';
import { ToolDefinition } from '../types';
import {
  clampLimit,
  limitProperty,
  objectSchema,
  resolveTimeRange,
  timeRangeProperties,
} from './common';

/** Same cap `guardrails.ts`'s `lintDsl` enforces on top-level aggregations (`MAX_TOP_LEVEL_AGGS`)
 * — checked here too so a too-large `framework` array gets a specific, actionable tool-level error
 * instead of a generic guardrail rejection. */
const MAX_FRAMEWORKS_PER_CALL = 5;

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
  if (frameworks.length > MAX_FRAMEWORKS_PER_CALL) {
    throw new Error(
      `Parameter "framework" accepts at most ${MAX_FRAMEWORKS_PER_CALL} frameworks per call; ` +
        'split into separate calls instead.',
    );
  }
  return frameworks;
}

/**
 * Replaces `get_pci_dss_summary` (retired): each requested framework aggregates on its own
 * `wazuh.rule.compliance.<framework>` field, so this builds one top-level `terms` aggregation per
 * requested framework rather than a single combined agg. When more than one framework is
 * requested, digest.ts's multi-agg digest path (`buildBreakdown`) tags each bucket with its owning
 * aggregation name; the rendered table still only reflects the FIRST framework's buckets
 * (documented limitation shared with search_wazuh_data).
 */
export const getComplianceSummaryTool: ToolDefinition = {
  spec: {
    name: 'get_compliance_summary',
    description:
      'Aggregates compliance findings within a time range, grouped by the specific requirement ' +
      'tag for one or more frameworks (e.g. pci_dss_10.2.5, gdpr_II_5.1.1). Use for "summarize ' +
      '<framework> compliance" questions, not for a list of individual findings. Accepts at most ' +
      `${MAX_FRAMEWORKS_PER_CALL} frameworks per call.`,
    parameters: objectSchema(
      {
        framework: {
          type: 'array',
          description: 'One or more compliance frameworks to summarize.',
          items: { type: 'string', enum: [...COMPLIANCE_FRAMEWORKS] },
          minItems: 1,
        },
        limit: limitProperty(
          'Max number of requirement buckets to return per framework (default 20, max 100).',
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
    const limit = clampLimit(params.limit, 20, 100);
    const { gte, lte } = resolveTimeRange(params);
    const existsClauses = frameworks.map(framework => ({
      exists: { field: COMPLIANCE_FRAMEWORK_FIELDS[framework] },
    }));
    const complianceFilter =
      existsClauses.length === 1
        ? existsClauses[0]
        : { bool: { should: existsClauses, minimum_should_match: 1 } };
    const aggs: Record<string, unknown> = {};
    for (const framework of frameworks) {
      aggs[`${framework}_requirements`] = {
        terms: { field: COMPLIANCE_FRAMEWORK_FIELDS[framework], size: limit },
      };
    }
    return {
      target: 'indexer',
      index: 'wazuh-findings-v5*',
      body: {
        query: {
          bool: {
            filter: [complianceFilter, { range: { '@timestamp': { gte, lte } } }],
          },
        },
        aggs,
        size: 0,
      },
    };
  },
  tableSpec: {
    columns: [
      { field: 'key', label: 'Requirement' },
      { field: 'doc_count', label: 'Count' },
    ],
  },
  digest: { sampleColumns: ['key', 'doc_count'] },
};
