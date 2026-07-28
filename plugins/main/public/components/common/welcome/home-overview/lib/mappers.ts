import {
  AgentStatus,
  NewestIndicator,
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
  const score =
    typeof passed === 'number' && typeof failed === 'number'
      ? passed + failed > 0
        ? passed / (passed + failed)
        : 0
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
): Record<string, number | undefined> {
  const buckets =
    (aggregations?.[AGG.cloudSecurityByModule]?.buckets as
      | Record<string, FiltersAggBucket>
      | undefined) ?? {};
  return Object.entries(buckets).reduce((acc, [appId, bucket]) => {
    acc[appId] = bucket?.doc_count;
    return acc;
  }, {} as Record<string, number | undefined>);
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

interface NewestIndicatorSource {
  document?: {
    feed?: { name?: string };
    last_seen?: string;
  };
}

/** Reads the `top_hits` (size 1) built by `buildThreatIntelNewestIndicatorAgg`. */
export function mapNewestIndicator(
  aggregations: Aggregations,
): NewestIndicator | undefined {
  const hit = (
    aggregations?.[AGG.newestIndicator] as unknown as
      | { hits?: { hits?: Array<{ _source?: NewestIndicatorSource }> } }
      | undefined
  )?.hits?.hits?.[0];
  const lastSeen = hit?._source?.document?.last_seen;
  if (!lastSeen) {
    return undefined;
  }
  return { feedName: hit?._source?.document?.feed?.name, lastSeen };
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
