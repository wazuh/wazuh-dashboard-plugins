/* eslint-disable camelcase */
import { CheckResult } from '../../../../overview/sca/utils/constants';
import { AGG, SCA_RESULT_BUCKET, TOP_N } from './agg-names';
import {
  EVENT_DOC_ID_FIELD,
  FIM_PLATFORM_FIELD,
  FINDING_SEVERITY_FIELD,
  IOC_INDICATOR_TYPE_FIELD,
  MITRE_TACTIC_NAME_FIELD,
  MITRE_TECHNIQUE_ID_FIELD,
  MITRE_TECHNIQUE_NAME_FIELD,
  RULE_TITLE_FIELD,
  SCA_CHECK_RESULT_FIELD,
  SCA_POLICY_NAME_FIELD,
  SEVERITY_BANDS,
  THREAT_ENRICHMENTS_FIELD,
  VULNERABILITY_CVE_ID_FIELD,
  VULNERABILITY_OS_NAME_FIELD,
  VULNERABILITY_SEVERITY_FIELD,
  VULNERABILITY_SEVERITY_VALUES,
} from './fields';

/**
 * OpenSearch aggregation builders for Overview, Endpoint Security and Threat
 * Hunting. Pure (no data-source coupling), reused across the batched
 * findings search and the per-index-group searches.
 */

/** One filters agg, one bucket per severity band: all four counts in a single search. */
export function buildSeverityFiltersAgg() {
  const filters: Record<string, unknown> = {};
  for (const band of SEVERITY_BANDS) {
    filters[band] = { match_phrase: { [FINDING_SEVERITY_FIELD]: band } };
  }
  return { [AGG.severity]: { filters: { filters } } };
}

/** Vulnerability Severity tiles: one filters aggregation, one search. */
export function buildVulnerabilitySeverityFiltersAgg() {
  const filters: Record<string, unknown> = {};
  for (const band of SEVERITY_BANDS) {
    filters[band] = {
      match_phrase: {
        [VULNERABILITY_SEVERITY_FIELD]: VULNERABILITY_SEVERITY_VALUES[band],
      },
    };
  }
  return { [AGG.vulnerabilitySeverity]: { filters: { filters } } };
}

export function buildTopTermsAgg(name: string, field: string, size = TOP_N) {
  return { [name]: { terms: { field, size } } };
}

/**
 * Overview findings batch: severity bands + top MITRE tactics, plus Threat
 * Hunting's total findings + top rules + techniques, all in the one
 * findings search fired on mount.
 */
export function buildFindingsOverviewAggs(
  topTacticsSize = TOP_N,
  topRulesSize = TOP_N,
  topTechniquesSize = TOP_N,
) {
  return {
    ...buildSeverityFiltersAgg(),
    ...buildTopTermsAgg(AGG.tactics, MITRE_TACTIC_NAME_FIELD, topTacticsSize),
    ...buildTopTermsAgg(AGG.topRules, RULE_TITLE_FIELD, topRulesSize),
    [AGG.techniquesCount]: { cardinality: { field: MITRE_TECHNIQUE_ID_FIELD } },
    ...buildTopTermsAgg(
      AGG.topTechniques,
      MITRE_TECHNIQUE_NAME_FIELD,
      topTechniquesSize,
    ),
  };
}

/** Configuration Assessment tiles: Passed/Failed/N-A counts, one search. */
export function buildSCATilesAgg() {
  return {
    [AGG.scaResult]: {
      filters: {
        filters: {
          [SCA_RESULT_BUCKET.passed]: {
            match_phrase: { [SCA_CHECK_RESULT_FIELD]: CheckResult.Passed },
          },
          [SCA_RESULT_BUCKET.failed]: {
            match_phrase: { [SCA_CHECK_RESULT_FIELD]: CheckResult.Failed },
          },
          [SCA_RESULT_BUCKET.notApplicable]: {
            match_phrase: {
              [SCA_CHECK_RESULT_FIELD]: CheckResult.NotApplicable,
            },
          },
        },
      },
    },
  };
}

/**
 * Top benchmarks by checks: policy terms, each with a nested Passed/Failed
 * breakdown to derive a score per benchmark.
 */
export function buildSCATopBenchmarksAgg(size = TOP_N) {
  return {
    [AGG.scaBenchmarks]: {
      terms: { field: SCA_POLICY_NAME_FIELD, size },
      aggs: {
        [AGG.scaBenchmarkResult]: {
          terms: { field: SCA_CHECK_RESULT_FIELD, size: 3 },
        },
      },
    },
  };
}

export function buildFIMTopPlatformsAgg(size = TOP_N) {
  return buildTopTermsAgg(AGG.fimPlatforms, FIM_PLATFORM_FIELD, size);
}

export function buildVulnerabilityTopOsAgg(size = TOP_N) {
  return buildTopTermsAgg(
    AGG.vulnerabilitiesByOs,
    VULNERABILITY_OS_NAME_FIELD,
    size,
  );
}

/** CVEs matched: distinct-CVE count, not the total match-document count. */
export function buildCvesMatchedAgg() {
  return {
    [AGG.cvesMatched]: { cardinality: { field: VULNERABILITY_CVE_ID_FIELD } },
  };
}

/**
 * IOC Match hero: distinct events with a threat-enrichment match, matching
 * Malware Detection's own metric shape (not a raw doc count, since one
 * event can carry more than one enrichment match).
 */
export function buildIocMatchesAgg() {
  return {
    [AGG.iocMatches]: { cardinality: { field: EVENT_DOC_ID_FIELD } },
  };
}

/**
 * IOC feed by type (top size): distinct-event count per indicator type, on
 * the same findings search as the IOC Match hero, no extra request.
 */
export function buildIocFeedByTypeAgg(size = TOP_N) {
  return {
    [AGG.iocFeedByType]: {
      terms: {
        field: IOC_INDICATOR_TYPE_FIELD,
        size,
        order: { [AGG.distinctEvents]: 'desc' },
      },
      aggs: {
        [AGG.distinctEvents]: { cardinality: { field: EVENT_DOC_ID_FIELD } },
      },
    },
  };
}

/**
 * Malware/IOC metrics on the threat-enrichment subset, as a filter sub-agg
 * so they ride the shared findings search instead of a separate query.
 */
export function buildMalwareFilterAgg(size = TOP_N) {
  return {
    [AGG.malware]: {
      filter: { exists: { field: THREAT_ENRICHMENTS_FIELD } },
      aggs: { ...buildIocMatchesAgg(), ...buildIocFeedByTypeAgg(size) },
    },
  };
}
