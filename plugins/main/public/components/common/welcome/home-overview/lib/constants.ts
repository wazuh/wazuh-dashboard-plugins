/**
 * Aggregation and bucket keys shared between the query builders (queries.ts)
 * and the mappers/hooks that read the responses back. Naming each key once here
 * keeps the producer and consumer from drifting, a mismatch would otherwise
 * fail silently (the read just returns nothing).
 */
export const AGG = {
  severity: 'severity',
  vulnerabilitySeverity: 'vulnerability_severity',
  tactics: 'tactics',
  topRules: 'top_rules',
  techniquesCount: 'techniques_count',
  topTechniques: 'top_techniques',
  topOs: 'top_os',
  topServices: 'top_services',
  scaResult: 'sca_result',
  scaBenchmarks: 'sca_benchmarks',
  /** Nested check-result breakdown inside each `sca_benchmarks` bucket. */
  scaBenchmarkResult: 'result',
  cloudSecurityByModule: 'cloud_security_by_module',
  fimTopFiles: 'fim_top_files',
  /** Latest `file.mtime` per `fim_top_files` bucket; the terms agg orders by it. */
  fimLastModified: 'last_modified',
  vulnerabilitiesByPackage: 'vulnerabilities_by_package',
  cvesMatched: 'cves_matched',
  /** Distinct-event IOC match count (hero), inside the findings `malware` filter. */
  iocMatches: 'ioc_matches',
  malware: 'malware',
  /** Terms on `document.type` over the threat-intel enrichments catalog. */
  iocFeedByType: 'ioc_feed_by_type',
  /** Terms on `document.software.type` over the threat-intel enrichments catalog. */
  threatTypes: 'threat_types',
  /**
   * Sub-agg capturing the MITRE external id (e.g. `TA0001`, `T1078`) for each
   * top tactic/technique bucket, so links can open the Intelligence resource.
   */
  externalId: 'external_id',
  /** Prefix of the per-framework controls cardinality aggs, one per framework. */
  complianceControlsPrefix: 'compliance_controls_',
} as const;

/** Named buckets in the SCA `sca_result` filters agg. */
export const SCA_RESULT_BUCKET = {
  passed: 'passed',
  failed: 'failed',
  notApplicable: 'not_applicable',
} as const;

/** Default "top N" size for the ranked (terms) aggregations. */
export const TOP_N = 5;

export const VALUE_PLACEHOLDER = '-';
