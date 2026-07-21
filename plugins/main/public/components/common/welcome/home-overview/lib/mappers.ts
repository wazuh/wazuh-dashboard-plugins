import {
  AgentStatus,
  ScaBenchmark,
  ScaTilesData,
  SeverityBand,
  SeverityCounts,
  TopItem,
} from '../interfaces/types';
import { FINDING_SEVERITY_BANDS } from './fields';
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
    acc[band] =
      (buckets as Record<string, FiltersAggBucket>)?.[band]?.doc_count ?? 0;
    return acc;
  }, {} as SeverityCounts);
}

export function mapCardinality(
  aggregations: Aggregations,
  aggName: string,
): number {
  return (
    (aggregations?.[aggName] as unknown as { value?: number } | undefined)
      ?.value ?? 0
  );
}

/** Total hits count, for heroes that are the whole result set, not an agg. */
export function mapDocCount(
  response: { hits?: { total?: number } } | undefined,
): number {
  return response?.hits?.total ?? 0;
}

export function mapScaTiles(aggregations: Aggregations): ScaTilesData {
  const buckets =
    (
      aggregations?.[AGG.scaResult] as unknown as
        | { buckets?: Record<string, FiltersAggBucket> }
        | undefined
    )?.buckets ?? {};
  const passed = buckets[SCA_RESULT_BUCKET.passed]?.doc_count ?? 0;
  const failed = buckets[SCA_RESULT_BUCKET.failed]?.doc_count ?? 0;
  const notApplicable =
    buckets[SCA_RESULT_BUCKET.notApplicable]?.doc_count ?? 0;
  const total = passed + failed;
  return {
    passed,
    failed,
    notApplicable,
    score: total > 0 ? (passed / total) * 100 : 0,
  };
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
      score: total > 0 ? (passed / total) * 100 : 0,
    };
  });
}

export function mapTopBuckets(
  aggregations: Aggregations,
  aggName: string,
): TopItem[] {
  const buckets = aggregations?.[aggName]?.buckets;
  if (!Array.isArray(buckets)) {
    return [];
  }
  return (buckets as TermsBucket[]).map(bucket => ({
    key: String(bucket.key),
    count: bucket.doc_count ?? 0,
  }));
}

export function mapAgentStatus(
  connection: AgentConnectionSummary | undefined,
): AgentStatus {
  return {
    active: connection?.active ?? 0,
    disconnected: connection?.disconnected ?? 0,
    pending: connection?.pending ?? 0,
    neverConnected: connection?.never_connected ?? 0,
    total: connection?.total ?? 0,
  };
}
