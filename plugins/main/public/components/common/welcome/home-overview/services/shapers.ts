import { AgentStatus, SeverityCounts, TopItem } from './types';
import { SEVERITY_BANDS } from './aggs';

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
): SeverityCounts {
  const buckets = aggregations?.severity?.buckets ?? {};
  return SEVERITY_BANDS.reduce((acc, band) => {
    acc[band] = buckets?.[band]?.doc_count ?? 0;
    return acc;
  }, {} as SeverityCounts);
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
