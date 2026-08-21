import {
  COMPLIANCE_FRAMEWORKS,
  COMPLIANCE_FRAMEWORK_FIELDS,
  ComplianceFramework,
} from '../../../common/wazuh-fields';
import { ToolDefinition } from '../types';
import {
  aggLimitProperty,
  clampAggLimit,
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
      '<framework> compliance" questions, not for a list of individual findings. Optional ' +
      'exclude_framework excludes findings that also carry a requirement tag for any of those ' +
      'frameworks -- use for "summarize framework A among findings that do not also have ' +
      'framework B" questions. Accepts at most ' +
      `${MAX_FRAMEWORKS_PER_CALL} frameworks per call.`,
    parameters: objectSchema(
      {
        framework: {
          type: 'array',
          description: 'One or more compliance frameworks to summarize.',
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
        limit: aggLimitProperty(
          'requirement buckets to return per framework',
          20,
        ),
        ...timeRangeProperties(),
      },
      ['framework'],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  // Cost-budget class 1 (chat.ts's tool-round budget): this request is `size: 0` --
  // aggregation-only, no hit documents (see this file's own doc comment above).
  costClass: 1,
  buildRequest(params) {
    const frameworks = parseFrameworks(params.framework);
    const excludeFrameworks = parseExcludeFrameworks(params.exclude_framework);
    const limit = clampAggLimit(params.limit, 20);
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
            filter: [
              complianceFilter,
              { range: { '@timestamp': { gte, lte } } },
            ],
            ...(excludeClauses.length > 0 ? { must_not: excludeClauses } : {}),
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
