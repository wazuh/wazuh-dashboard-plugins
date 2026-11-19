import {
  AgentStatus,
  CaseManagementOverview,
  CaseStatusCounts,
  CaseSummary,
  CountsByKey,
  ScaBenchmark,
  ScaTilesData,
  SeriousFindings,
  SeriousLevel,
  SeriousRule,
  SeverityBand,
  SeverityCounts,
  TopItem,
  IncidentResponseOverview,
} from '../interfaces/types';
import {
  CASE_STATUSES,
  COMPLIANCE_FRAMEWORK_FIELDS,
  FINDING_SEVERITY_BANDS,
  SERIOUS_FINDING_LEVELS,
} from './fields';
import { AGG, SCA_RESULT_BUCKET } from './constants';
import { CheckResult } from '../../../../overview/sca/utils/constants';

interface FiltersAggBucket {
  doc_count?: number;
}
interface TermsBucket {
  key: string | number;
  doc_count?: number;
}
type Aggregations =
  | {
      severity?: { buckets?: Record<string, FiltersAggBucket> };
      [aggName: string]: { buckets?: unknown } | undefined;
    }
  | undefined;

interface AgentConnectionSummary {
  active?: number;
  disconnected?: number;
  pending?: number;
  never_connected?: number;
  total?: number;
}

export function mapSeverityCounts(
  aggregations: Aggregations,
  aggName: string = AGG.severity,
  bands: SeverityBand[] = FINDING_SEVERITY_BANDS,
): SeverityCounts {
  const buckets = aggregations?.[aggName]?.buckets ?? {};
  return bands.reduce((acc, band) => {
    acc[band] = (buckets as Record<string, FiltersAggBucket>)?.[
      band
    ]?.doc_count;
    return acc;
  }, {} as SeverityCounts);
}

export function mapCardinality(
  aggregations: Aggregations,
  aggName: string,
): number | undefined {
  return (aggregations?.[aggName] as unknown as { value?: number } | undefined)
    ?.value;
}

/** Total hits count, for heroes that are the whole result set, not an agg. */
export function mapDocCount(
  response: { hits?: { total?: number } } | undefined,
): number | undefined {
  return response?.hits?.total;
}

export function mapScaTiles(aggregations: Aggregations): ScaTilesData {
  const buckets =
    (
      aggregations?.[AGG.scaResult] as unknown as
        | { buckets?: Record<string, FiltersAggBucket> }
        | undefined
    )?.buckets ?? {};
  const passed = buckets[SCA_RESULT_BUCKET.passed]?.doc_count;
  const failed = buckets[SCA_RESULT_BUCKET.failed]?.doc_count;
  const notApplicable = buckets[SCA_RESULT_BUCKET.notApplicable]?.doc_count;
  // No passed or failed checks means nothing to score, not a 0% score.
  const score =
    typeof passed === 'number' &&
    typeof failed === 'number' &&
    passed + failed > 0
      ? passed / (passed + failed)
      : undefined;
  return { passed, failed, notApplicable, score };
}

export function mapScaBenchmarks(aggregations: Aggregations): ScaBenchmark[] {
  const buckets = (
    aggregations?.[AGG.scaBenchmarks] as unknown as
      | {
          buckets?: Array<{
            key: string | number;
            result?: { buckets?: TermsBucket[] };
          }>;
        }
      | undefined
  )?.buckets;
  if (!Array.isArray(buckets)) {
    return [];
  }
  return buckets.map(bucket => {
    const resultBuckets = bucket[AGG.scaBenchmarkResult]?.buckets ?? [];
    const passed =
      resultBuckets.find(result => result.key === CheckResult.Passed)
        ?.doc_count ?? 0;
    const failed =
      resultBuckets.find(result => result.key === CheckResult.Failed)
        ?.doc_count ?? 0;
    const total = passed + failed;
    return {
      name: String(bucket.key),
      passed,
      failed,
      score: total > 0 ? passed / total : 0,
    };
  });
}

/** Cloud Security card counts: doc_count per bucket key (app id) from a filters agg. */
export function mapCloudSecurityByModule(
  aggregations: Aggregations,
): CountsByKey {
  const buckets =
    (aggregations?.[AGG.cloudSecurityByModule]?.buckets as
      | Record<string, FiltersAggBucket>
      | undefined) ?? {};
  return Object.entries(buckets).reduce((acc, [appId, bucket]) => {
    acc[appId] = bucket?.doc_count;
    return acc;
  }, {} as CountsByKey);
}

/** Distinct controls implicated per framework (cardinality), keyed by framework id. */
export function mapComplianceControls(aggregations: Aggregations): CountsByKey {
  return Object.keys(COMPLIANCE_FRAMEWORK_FIELDS).reduce((acc, frameworkId) => {
    acc[frameworkId] = mapCardinality(
      aggregations,
      `${AGG.complianceControlsPrefix}${frameworkId}`,
    );
    return acc;
  }, {} as CountsByKey);
}

export function mapTopBuckets(
  aggregations: Aggregations,
  aggName: string,
): TopItem[] {
  const buckets = aggregations?.[aggName]?.buckets;
  if (!Array.isArray(buckets)) {
    return [];
  }
  return (buckets as TermsBucket[]).map(bucket => {
    // Present only for aggs built with an external-id sub-agg (MITRE
    // tactics/techniques); plain term lists have no id.
    const externalId = (
      bucket as Record<string, { buckets?: TermsBucket[] } | undefined>
    )[AGG.externalId]?.buckets?.[0]?.key;
    return {
      key: String(bucket.key),
      count: bucket.doc_count ?? 0,
      ...(externalId !== undefined ? { id: String(externalId) } : {}),
    };
  });
}

export function mapAgentStatus(
  connection: AgentConnectionSummary | undefined,
): AgentStatus {
  return {
    active: connection?.active,
    disconnected: connection?.disconnected,
    pending: connection?.pending,
    neverConnected: connection?.never_connected,
    total: connection?.total,
  };
}

interface CaseHit {
  _id: string;
  _source?: {
    wazuh?: {
      case?: {
        title?: string;
        severity?: string;
        priority?: string;
        updated_at?: string;
        created_at?: string;
      };
      agent?: { name?: string };
    };
  };
}

const mapCaseHit = (hit: CaseHit): CaseSummary => {
  const wazuh = hit._source?.wazuh;
  const fields = wazuh?.case ?? {};
  return {
    id: hit._id,
    title: fields.title,
    severity: fields.severity,
    priority: fields.priority,
    updatedAt: fields.updated_at ?? fields.created_at,
    agentName: wazuh?.agent?.name,
  };
};

/** Case management card: see `buildCaseManagementAggs`. */
export function mapCaseManagement(
  response:
    | { hits?: { total?: number }; aggregations?: Aggregations }
    | undefined,
): CaseManagementOverview {
  const aggregations = response?.aggregations;
  const statusBuckets =
    (aggregations?.[AGG.caseStatus]?.buckets as
      | Record<string, FiltersAggBucket>
      | undefined) ?? {};
  const byStatus = CASE_STATUSES.reduce((acc, status) => {
    acc[status] = statusBuckets[status]?.doc_count;
    return acc;
  }, {} as CaseStatusCounts);
  const attention = aggregations?.[AGG.attentionCases] as
    | (FiltersAggBucket & {
        [AGG.attentionTop]?: { hits?: { hits?: CaseHit[] } };
      })
    | undefined;
  return {
    total: mapDocCount(response),
    byStatus,
    openBySeverity: mapSeverityCounts(
      aggregations?.[AGG.openCases] as Aggregations,
      AGG.caseSeverity,
    ),
    attention: {
      total: attention?.doc_count,
      cases: (attention?.[AGG.attentionTop]?.hits?.hits ?? []).map(mapCaseHit),
    },
  };
}

interface LevelBucket extends TermsBucket {
  [subAgg: string]: unknown;
}

const isSeriousLevel = (level: unknown): level is SeriousLevel =>
  (SERIOUS_FINDING_LEVELS as readonly unknown[]).includes(level);

const subBuckets = (bucket: unknown, aggName: string): LevelBucket[] => {
  const buckets = (
    bucket as Record<string, { buckets?: unknown } | undefined>
  )?.[aggName]?.buckets;
  return Array.isArray(buckets) ? (buckets as LevelBucket[]) : [];
};

const cardinalityOf = (bucket: unknown): number =>
  (bucket as Record<string, { value?: number } | undefined>)?.[AGG.answeredDocs]
    ?.value ?? 0;

/** Critical/high findings per level and their top rules (`buildSeriousFindingsAgg`). */
export function mapSeriousFindings(
  aggregations: Aggregations,
): SeriousFindings {
  const byLevel: SeriousFindings['byLevel'] = {};
  const rules: SeriousRule[] = [];
  let partial = false;
  for (const levelBucket of subBuckets(
    aggregations?.[AGG.seriousFindings],
    AGG.byLevel,
  )) {
    if (!isSeriousLevel(levelBucket.key)) {
      continue;
    }
    const level = levelBucket.key;
    byLevel[level] = levelBucket.doc_count ?? 0;
    const ruleAgg = (levelBucket as Record<string, unknown>)[AGG.byRule] as
      | { sum_other_doc_count?: number }
      | undefined;
    partial = partial || (ruleAgg?.sum_other_doc_count ?? 0) > 0;
    for (const rule of subBuckets(levelBucket, AGG.byRule)) {
      rules.push({
        id: String(rule.key),
        title: String(subBuckets(rule, AGG.ruleTitle)[0]?.key ?? rule.key),
        level,
        count: rule.doc_count ?? 0,
      });
    }
  }
  return { byLevel, rules, partial };
}

/** Active responses: total and the critical/high findings they answered (`buildIncidentResponseAggs`). */
export function mapIncidentResponse(
  response:
    | { hits?: { total?: number }; aggregations?: Aggregations }
    | undefined,
): IncidentResponseOverview {
  const answered = response?.aggregations?.[AGG.answeredFindings];
  const byLevel: IncidentResponseOverview['answered']['byLevel'] = {};
  for (const bucket of subBuckets(answered, AGG.byLevel)) {
    if (isSeriousLevel(bucket.key)) {
      byLevel[bucket.key] = cardinalityOf(bucket);
    }
  }
  const byRule: Record<string, number> = {};
  for (const bucket of subBuckets(answered, AGG.byRule)) {
    byRule[String(bucket.key)] = cardinalityOf(bucket);
  }
  return { total: mapDocCount(response), answered: { byLevel, byRule } };
}
