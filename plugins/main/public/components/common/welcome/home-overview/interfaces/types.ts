export type SeverityBand =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'informational';

export type SeverityCounts = Partial<Record<SeverityBand, number>>;

/**
 * A count per named thing (module app id, compliance framework id, ...).
 * `undefined` where the search reported no bucket, shown as a placeholder.
 */
export type CountsByKey = Record<string, number | undefined>;

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
  /** Critical/high findings and their top rules, for the Incident Response coverage. */
  seriousFindings: SeriousFindings;
}

export type SeriousLevel = 'critical' | 'high';

/** A rule behind critical/high findings, with its finding count. */
export interface SeriousRule {
  id: string;
  title: string;
  level: SeriousLevel;
  count: number;
}

export interface SeriousFindings {
  byLevel: Partial<Record<SeriousLevel, number>>;
  /** Top rules per level by finding count. */
  rules: SeriousRule[];
  /** More rules exist past the top ones. */
  partial: boolean;
}

/** Findings counts the two bottom sections need, from one lazy search. */
export interface FindingsBreakdowns {
  /** Findings per Cloud Security module, keyed by app id. */
  cloudSecurityByModule: CountsByKey;
  /** Distinct controls implicated per framework, keyed by framework id. */
  complianceControlsByFramework: CountsByKey;
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

/**
 * Threat-intel enrichments catalog (`wazuh-threatintel-enrichments*`): the feed
 * of IOCs the platform detects with. Current-state, not time-bounded.
 */
export interface ThreatIntelEnrichments {
  /** Total IOCs in the feed catalog (the "IOCs" tile). */
  total?: number;
  /** Feed composition by indicator type (the Malware "IOC feed by type" table). */
  feedByType: TopItem[];
  /** Catalog composition by threat type (`document.software.type`). */
  byThreatType: TopItem[];
}

export interface VulnerabilityOverview {
  severity: SeverityCounts;
  /** Top 5 vulnerable package names (`package.name`). */
  byPackage: TopItem[];
}

/** Active responses of the last 24 hours. */
export interface IncidentResponseOverview {
  total?: number;
  /** `_id` of the critical/high findings the responses answered (`event.doc_id`). */
  answeredIds: string[];
  /** More answered findings exist than `answeredIds` holds. */
  answeredIdsPartial: boolean;
}

/** Critical/high findings of the last 24 hours that got a response, per level and per rule id. */
export interface AnsweredFindings {
  byLevel: Partial<Record<SeriousLevel, number>>;
  byRule: Record<string, number>;
}

export type CaseStatusCounts = Partial<
  Record<'active' | 'acknowledged' | 'completed', number>
>;

/** Current state of the cases, not time-bounded. */
export interface CaseManagementOverview {
  /** Cases of any status. */
  total?: number;
  byStatus: CaseStatusCounts;
  /** Open cases per severity. */
  openBySeverity: SeverityCounts;
  /** Open cases that are urgent or critical: their count and the most urgent ones. */
  attention: { total?: number; cases: CaseSummary[] };
}

export interface CaseSummary {
  /** `_id` of the finding holding the case. */
  id: string;
  title?: string;
  severity?: string;
  priority?: string;
  updatedAt?: string;
  agentName?: string;
}
