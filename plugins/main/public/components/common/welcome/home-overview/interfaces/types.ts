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
  totalFindings: number;
  topRules: TopItem[];
  techniquesCount: number;
  topTechniques: TopItem[];
  /** IOC matches (last 24h detection metric), from the same findings search. */
  iocMatches: number;
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

/**
 * Threat-intel enrichments catalog (`wazuh-threatintel-enrichments*`): the feed
 * of IOC indicators the platform detects with. Current-state, not time-bounded.
 */
export interface ThreatIntelEnrichments {
  /** Total IOC indicators in the feed catalog (the "IOCs" tile). */
  total: number;
  /** Feed composition by indicator type (the Malware "IOC feed by type" table). */
  feedByType: TopItem[];
}

export interface VulnerabilityOverview {
  severity: SeverityCounts;
  byOs: TopItem[];
  /** Distinct CVE count (cardinality). */
  cvesMatched: number;
}
