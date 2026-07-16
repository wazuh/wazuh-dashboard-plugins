import {
  AgentStatus,
  ScaBenchmark,
  ScaTilesData,
  SeverityCounts,
  TopItem,
} from './types';
import { SEVERITY_BANDS } from './aggs';
import { CheckResult } from '../../../../overview/sca/utils/constants';

/**
 * Pure transforms from raw OpenSearch aggregation responses / API payloads into
 * widget-ready data. Kept side-effect-free so they can be unit-tested directly
 * with canned responses. `camelcase` is disabled because OpenSearch response
 * fields (`doc_count`, `never_connected`, …) are snake_case.
 */

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

export function shapeSeverityCounts(
  aggregations: Aggregations,
  aggName = 'severity',
): SeverityCounts {
  const buckets = aggregations?.[aggName]?.buckets ?? {};
  return SEVERITY_BANDS.reduce((acc, band) => {
    acc[band] = (buckets as Record<string, FiltersAggBucket>)?.[band]
      ?.doc_count ?? 0;
    return acc;
  }, {} as SeverityCounts);
}

/** Reads a single-value metric agg (e.g. `cardinality`). */
export function shapeCardinality(
  aggregations: Aggregations,
  aggName: string,
): number {
  return (
    (aggregations?.[aggName] as unknown as { value?: number } | undefined)
      ?.value ?? 0
  );
}

/** Total document count from a search response — used for hero numbers that
 * are the whole (filtered) result set rather than an aggregation. */
export function shapeDocCount(response: { hits?: { total?: number } } | undefined): number {
  return response?.hits?.total ?? 0;
}

/** Configuration Assessment tiles from the `sca_result` filters agg. */
export function shapeScaTiles(aggregations: Aggregations): ScaTilesData {
  const buckets = (aggregations?.sca_result as unknown as
    | { buckets?: Record<string, FiltersAggBucket> }
    | undefined)?.buckets ?? {};
  const passed = buckets.passed?.doc_count ?? 0;
  const failed = buckets.failed?.doc_count ?? 0;
  const notApplicable = buckets.not_applicable?.doc_count ?? 0;
  const total = passed + failed;
  return {
    passed,
    failed,
    notApplicable,
    score: total > 0 ? (passed / total) * 100 : 0,
  };
}

/** Top benchmarks from the `sca_benchmarks` nested terms agg. */
export function shapeScaBenchmarks(aggregations: Aggregations): ScaBenchmark[] {
  const buckets = (aggregations?.sca_benchmarks as unknown as
    | { buckets?: Array<{ key: string | number; result?: { buckets?: TermsBucket[] } }> }
    | undefined)?.buckets;
  if (!Array.isArray(buckets)) {
    return [];
  }
  return buckets.map(bucket => {
    const resultBuckets = bucket.result?.buckets ?? [];
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

export function shapeTopBuckets(
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

/** The Wazuh API `/agents/summary/status` returns a `connection` object. */
export function shapeAgentStatus(
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
