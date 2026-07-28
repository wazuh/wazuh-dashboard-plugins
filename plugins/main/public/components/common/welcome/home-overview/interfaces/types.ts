export type SeverityBand =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'informational'
  | 'pending';

export type SeverityCounts = Partial<Record<SeverityBand, number>>;

export interface TopItem {
  key: string;
  count: number;
  /**
   * Stable identifier for the bucket when one exists (e.g. a MITRE external id
   * `TA0001`/`T1078`), used for navigation. Absent for plain term lists.
   */
  id?: string;
}

export interface AgentStatus {
  active?: number;
  disconnected?: number;
  pending?: number;
  neverConnected?: number;
  total?: number;
}

export interface FindingsOverview {
  severity: SeverityCounts;
  topTactics: TopItem[];
  totalFindings?: number;
  topRules: TopItem[];
  techniquesCount?: number;
  topTechniques: TopItem[];
  /** IOC matches (last 24h detection metric), from the same findings search. */
  iocMatches?: number;
  /** Findings count per Cloud Security module (app id), last 24h. */
  cloudSecurityByModule: Record<string, number | undefined>;
}

export interface ScaTilesData {
  passed?: number;
  failed?: number;
  notApplicable?: number;
  score?: number;
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
  total?: number;
  /** Top 5 most recently modified files (`file.path`). */
  files: TopItem[];
}

/** The single most-recent indicator in the threat-intel enrichments catalog. */
export interface NewestIndicator {
  /** Source feed name (`document.feed.name`, e.g. `threat-fox`), if set. */
  feedName?: string;
  /** ISO timestamp (`document.last_seen`) of the newest indicator. */
  lastSeen: string;
}

/**
 * Threat-intel enrichments catalog (`wazuh-threatintel-enrichments*`): the feed
 * of IOCs the platform detects with. Current-state, not time-bounded.
 */
export interface ThreatIntelEnrichments {
  /** Total IOCs in the feed catalog (the "IOCs" tile). */
  total?: number;
  /** Feed composition by indicator type (the Malware "IOC feed by type" table). */
  feedByType: TopItem[];
  /** Freshness readout on the Threat catalog card; absent if the catalog is empty. */
  newestIndicator?: NewestIndicator;
}

export interface VulnerabilityOverview {
  severity: SeverityCounts;
  /** Top 5 vulnerable package names (`package.name`). */
  byPackage: TopItem[];
  /** Distinct CVE count (cardinality). */
  cvesMatched?: number;
}
