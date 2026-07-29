/* eslint-disable camelcase */
import { CheckResult } from '../../../../overview/sca/utils/constants';
import { AGG, SCA_RESULT_BUCKET, TOP_N } from './constants';
import {
  EVENT_DOC_ID_FIELD,
  FIM_FILE_PATH_FIELD,
  FINDING_SEVERITY_FIELD,
  INTEGRATION_NAME_FIELD,
  MITRE_TACTIC_NAME_FIELD,
  MITRE_TACTIC_ID_FIELD,
  MITRE_TECHNIQUE_ID_FIELD,
  MITRE_TECHNIQUE_NAME_FIELD,
  RULE_TITLE_FIELD,
  SCA_CHECK_RESULT_FIELD,
  SCA_POLICY_NAME_FIELD,
  FINDING_SEVERITY_BANDS,
  VULNERABILITY_SEVERITY_BANDS,
  THREAT_ENRICHMENTS_FIELD,
  THREAT_INTEL_THREAT_TYPE_FIELD,
  THREAT_INTEL_TYPE_FIELD,
  VULNERABILITY_CVE_ID_FIELD,
  VULNERABILITY_PACKAGE_NAME_FIELD,
  VULNERABILITY_SEVERITY_FIELD,
  VULNERABILITY_SEVERITY_VALUES,
} from './fields';

/**
 * Aggregation builders for Overview, Endpoint Security and Threat
 * Hunting. Pure (no data-source coupling), reused across the batched
 * findings search and the per-index-group searches.
 */

/** One filters agg, one bucket per finding severity band, all counts in a single search. */
export function buildSeverityFiltersAgg() {
  const filters: Record<string, unknown> = {};
  for (const band of FINDING_SEVERITY_BANDS) {
    filters[band] = { match_phrase: { [FINDING_SEVERITY_FIELD]: band } };
  }
  return { [AGG.severity]: { filters: { filters } } };
}

/** Vulnerability Severity tiles: one filters aggregation, one search. */
export function buildVulnerabilitySeverityFiltersAgg() {
  const filters: Record<string, unknown> = {};
  for (const band of VULNERABILITY_SEVERITY_BANDS) {
    filters[band] = {
      match_phrase: {
        [VULNERABILITY_SEVERITY_FIELD]: VULNERABILITY_SEVERITY_VALUES[band],
      },
    };
  }
  filters['pending'] = {
    match_phrase: {
      'vulnerability.under_evaluation': true,
    },
  };
  return { [AGG.vulnerabilitySeverity]: { filters: { filters } } };
}

export function buildTopTermsAgg(name: string, field: string, size = TOP_N) {
  return { [name]: { terms: { field, size } } };
}

/**
 * Top terms by `field`, each bucket carrying its `idField` value (e.g. the MITRE
 * external id) via a size-1 sub-agg, so the widget can display the name but link
 * by id. Names map 1:1 to ids, so one bucket is enough. Used for the Overview
 * top-tactics list, whose labels deep-link into the MITRE Intelligence tab.
 */
export function buildTopTermsWithExternalIdAgg(
  name: string,
  field: string,
  idField: string,
  size = TOP_N,
) {
  return {
    [name]: {
      terms: { field, size },
      aggs: { [AGG.externalId]: { terms: { field: idField, size: 1 } } },
    },
  };
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
    ...buildTopTermsWithExternalIdAgg(
      AGG.tactics,
      MITRE_TACTIC_NAME_FIELD,
      MITRE_TACTIC_ID_FIELD,
      topTacticsSize,
    ),
    ...buildTopTermsAgg(AGG.topRules, RULE_TITLE_FIELD, topRulesSize),
    [AGG.techniquesCount]: { cardinality: { field: MITRE_TECHNIQUE_ID_FIELD } },
    ...buildTopTermsWithExternalIdAgg(
      AGG.topTechniques,
      MITRE_TECHNIQUE_NAME_FIELD,
      MITRE_TECHNIQUE_ID_FIELD,
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

/** Top 5 modified files (`file.path`) for the FIM ranked-bar list. */
export function buildFIMTopFilesAgg(size = TOP_N) {
  return buildTopTermsAgg(AGG.fimTopFiles, FIM_FILE_PATH_FIELD, size);
}

/** Top 5 vulnerable package names for the Vulnerability Detection ranked-bar list. */
export function buildVulnerabilityTopPackagesAgg(size = TOP_N) {
  return buildTopTermsAgg(
    AGG.vulnerabilitiesByPackage,
    VULNERABILITY_PACKAGE_NAME_FIELD,
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

const CLOUD_SECURITY_MODULE_FILTERS: Record<string, unknown> = {
  docker: { match_phrase: { [INTEGRATION_NAME_FIELD]: 'docker' } },
  'amazon-web-services': { wildcard: { [INTEGRATION_NAME_FIELD]: 'aws*' } },
  'google-cloud': { match_phrase: { [INTEGRATION_NAME_FIELD]: 'gcp' } },
  github: { match_phrase: { [INTEGRATION_NAME_FIELD]: 'github' } },
  office365: { match_phrase: { [INTEGRATION_NAME_FIELD]: 'o365' } },
  'microsoft-graph-api': {
    match_phrase: { [INTEGRATION_NAME_FIELD]: 'azure' },
  },
};

export function buildCloudSecurityByModuleAgg() {
  return {
    [AGG.cloudSecurityByModule]: {
      filters: { filters: CLOUD_SECURITY_MODULE_FILTERS },
    },
  };
}

/**
 * Malware IOC-match hero on the threat-enrichment subset, as a filter sub-agg
 * so it rides the shared findings search instead of a separate query. The IOC
 * feed-by-type composition is a distinct concept sourced from the threat-intel
 * catalog (see `buildThreatIntelFeedByTypeAgg`), not this findings search.
 */
export function buildMalwareFilterAgg() {
  return {
    [AGG.malware]: {
      filter: { exists: { field: THREAT_ENRICHMENTS_FIELD } },
      aggs: { ...buildIocMatchesAgg() },
    },
  };
}

/**
 * IOC feed composition by type (top size): a terms agg on the threat-intel
 * enrichments catalog (`wazuh-threatintel-enrichments*`), counting the feed's
 * own indicators by `document.type` — what the feed contains, not what matched.
 */
export function buildThreatIntelFeedByTypeAgg(size = TOP_N) {
  return buildTopTermsAgg(AGG.iocFeedByType, THREAT_INTEL_TYPE_FIELD, size);
}

/**
 * Threat-type composition (top size): a terms agg on `document.software.type`
 * alongside the feed-by-type terms agg above, so the Threat catalog's
 * composition bar rides the same single search — no new round trip. Answers
 * "what kind of threats is this catalog weighted toward", where feed-by-type
 * answers "in what technical form".
 */
export function buildThreatIntelByThreatTypeAgg(size = TOP_N) {
  return buildTopTermsAgg(
    AGG.threatTypes,
    THREAT_INTEL_THREAT_TYPE_FIELD,
    size,
  );
}
