/* eslint-disable camelcase */
import { CheckResult } from '../../../../overview/sca/utils/constants';
import {
  amazonWebServices,
  docker,
  github,
  googleCloud,
  microsoftGraphAPI,
  office365,
} from '../../../../../utils/applications';
import { AGG, SCA_RESULT_BUCKET, TOP_N } from './constants';
import {
  COMPLIANCE_FRAMEWORK_FIELDS,
  EVENT_DOC_ID_FIELD,
  FIM_FILE_MTIME_FIELD,
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

/**
 * Distinct controls implicated per framework: one cardinality agg per framework
 * field. The number that differentiates the chips, since finding counts tie.
 */
export function buildComplianceControlsAgg() {
  return Object.entries(COMPLIANCE_FRAMEWORK_FIELDS).reduce(
    (aggs, [frameworkId, field]) => {
      aggs[`${AGG.complianceControlsPrefix}${frameworkId}`] = {
        cardinality: { field },
      };
      return aggs;
    },
    {} as Record<string, unknown>,
  );
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

/**
 * Top 5 most recently modified files, ordered by each path's latest
 * `file.mtime`. Ranking by `doc_count` instead would only say how many agents
 * monitor the path (the state index holds one document per agent and path).
 */
export function buildFIMTopFilesAgg(size = TOP_N) {
  return {
    [AGG.fimTopFiles]: {
      terms: {
        field: FIM_FILE_PATH_FIELD,
        size,
        order: { [AGG.fimLastModified]: 'desc' },
      },
      aggs: {
        [AGG.fimLastModified]: { max: { field: FIM_FILE_MTIME_FIELD } },
      },
    },
  };
}

/** Top 5 vulnerable package names. */
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

/**
 * The integration each Cloud Security card counts, keyed by the app id it links
 * to. Values match what the module's own data source filters on
 * (`data-source/pattern/events/*`), so card and dashboard count the same docs.
 */
const CLOUD_MODULE_INTEGRATION: Record<string, string> = {
  [docker.id]: 'docker',
  // AWS spans several sub-integrations (aws-cloudtrail, aws-guardduty, ...).
  [amazonWebServices.id]: 'aws*',
  [googleCloud.id]: 'gcp',
  [github.id]: 'github',
  [office365.id]: 'o365',
  // Microsoft Graph API reads the same Azure integration as the Azure module.
  [microsoftGraphAPI.id]: 'azure',
};

/** A wildcard value needs a `wildcard` query; an exact one a `match_phrase`. */
const integrationFilter = (value: string) =>
  value.includes('*')
    ? { wildcard: { [INTEGRATION_NAME_FIELD]: value } }
    : { match_phrase: { [INTEGRATION_NAME_FIELD]: value } };

export function buildCloudSecurityByModuleAgg() {
  return {
    [AGG.cloudSecurityByModule]: {
      filters: {
        filters: Object.fromEntries(
          Object.entries(CLOUD_MODULE_INTEGRATION).map(([appId, value]) => [
            appId,
            integrationFilter(value),
          ]),
        ),
      },
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
 * Threat-type composition, riding the feed-by-type search above: what kind of
 * threats the catalog covers, where feed-by-type says in what technical form.
 */
export function buildThreatIntelByThreatTypeAgg(size = TOP_N) {
  return buildTopTermsAgg(
    AGG.threatTypes,
    THREAT_INTEL_THREAT_TYPE_FIELD,
    size,
  );
}
