/** Status of a single data group: distinguishes "dependency absent" (hide) from
 * "query failed" (error box). */
export type DataGroupStatus = 'loading' | 'available' | 'unavailable' | 'error';

/** Thrown by a fetch to mark its group `unavailable` rather than `error` — the
 * same shape a missing index pattern already throws, reused for a missing
 * Security Analytics plugin. */
export const DATA_SOURCE_NOT_FOUND = 'data_source_not_found';

export interface DataGroupResult<T> {
  status: DataGroupStatus;
  data?: T;
}

export type SeverityBand = 'critical' | 'high' | 'medium' | 'low';

export type SeverityCounts = Record<SeverityBand, number>;

export interface TopItem {
  key: string;
  count: number;
}

export interface AgentStatus {
  active: number;
  disconnected: number;
  pending: number;
  neverConnected: number;
  total: number;
}

export interface FindingsOverview {
  severity: SeverityCounts;
  topTactics: TopItem[];
  /** Threat Hunting's Findings + Techniques widgets piggyback on this same
   * batched search rather than issuing a second scan. */
  totalFindings: number;
  topRules: TopItem[];
  techniquesCount: number;
  topTechniques: TopItem[];
}

export interface ScaTilesData {
  passed: number;
  failed: number;
  notApplicable: number;
  /** Percentage (0-100): passed / (passed + failed). */
  score: number;
}

export interface ScaBenchmark {
  name: string;
  passed: number;
  failed: number;
  /** Percentage (0-100): passed / (passed + failed). */
  score: number;
}

export interface ScaOverview {
  tiles: ScaTilesData;
  benchmarks: ScaBenchmark[];
}

export interface FimOverview {
  /** Fleet-wide files & registry objects baselined. */
  total: number;
  platforms: TopItem[];
}

export interface MalwareOverview {
  /** IOC matches, last 24 hours. */
  iocMatches: number;
}

export interface VulnerabilityOverview {
  severity: SeverityCounts;
  byOs: TopItem[];
}
