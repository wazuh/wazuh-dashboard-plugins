/**
 * Aggregation and bucket keys shared between the query builders (queries.ts)
 * and the mappers/hooks that read the responses back. Naming each key once here
 * keeps the producer and consumer from drifting — a mismatch would otherwise
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
  fimPlatforms: 'fim_platforms',
  vulnerabilitiesByOs: 'vulnerabilities_by_os',
  cvesMatched: 'cves_matched',
  iocMatches: 'ioc_matches',
  iocFeedByType: 'ioc_feed_by_type',
  malware: 'malware',
  /** Per-bucket distinct-event metric inside `ioc_feed_by_type`. */
  distinctEvents: 'distinct_events',
} as const;

/** Named buckets in the SCA `sca_result` filters agg. */
export const SCA_RESULT_BUCKET = {
  passed: 'passed',
  failed: 'failed',
  notApplicable: 'not_applicable',
} as const;

/** Default "top N" size for the ranked (terms) aggregations. */
export const TOP_N = 5;
