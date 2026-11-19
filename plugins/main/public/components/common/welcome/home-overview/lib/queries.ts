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
import { ACTION_LIST_ROWS, AGG, SCA_RESULT_BUCKET, TOP_N } from './constants';
import {
  CASE_PRIORITIES,
  CASE_PRIORITY_FIELD,
  CASE_SEVERITY_FIELD,
  CASE_STATUS_FIELD,
  CASE_STATUSES,
  CASE_UPDATED_AT_FIELD,
  COMPLIANCE_FRAMEWORK_FIELDS,
  EVENT_DOC_ID_FIELD,
  FIM_FILE_MTIME_FIELD,
  FIM_FILE_PATH_FIELD,
  FINDING_SEVERITY_FIELD,
  HOST_OS_PLATFORM_FIELD,
  INTEGRATION_NAME_FIELD,
  MITRE_TACTIC_NAME_FIELD,
  MITRE_TACTIC_ID_FIELD,
  MITRE_TECHNIQUE_ID_FIELD,
  MITRE_TECHNIQUE_NAME_FIELD,
  OPEN_CASE_STATUSES,
  RULE_ID_FIELD,
  RULE_TITLE_FIELD,
  SERIOUS_FINDING_LEVELS,
  SCA_CHECK_RESULT_FIELD,
  SCA_POLICY_NAME_FIELD,
  FINDING_SEVERITY_BANDS,
  VULNERABILITY_SEVERITY_BANDS,
  THREAT_ENRICHMENTS_FIELD,
  THREAT_INTEL_THREAT_TYPE_FIELD,
  THREAT_INTEL_TYPE_FIELD,
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

/** Rules per level the coverage looks at; past them the rules list says "N+ more". */
export const SERIOUS_RULES_PER_LEVEL = 25;

const seriousLevelsFilter = {
  terms: { [FINDING_SEVERITY_FIELD]: [...SERIOUS_FINDING_LEVELS] },
};

/** Critical/high findings per level, and per level the top rules by finding count. */
export function buildSeriousFindingsAgg(
  rulesPerLevel = SERIOUS_RULES_PER_LEVEL,
) {
  return {
    [AGG.seriousFindings]: {
      filter: seriousLevelsFilter,
      aggs: {
        [AGG.byLevel]: {
          terms: {
            field: FINDING_SEVERITY_FIELD,
            size: SERIOUS_FINDING_LEVELS.length,
          },
          aggs: {
            [AGG.byRule]: {
              terms: { field: RULE_ID_FIELD, size: rulesPerLevel },
              aggs: {
                [AGG.ruleTitle]: {
                  terms: { field: RULE_TITLE_FIELD, size: 1 },
                },
              },
            },
          },
        },
      },
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
    ...buildSeriousFindingsAgg(),
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

/** IT Hygiene Platforms tile: distinct OS platforms across the system inventory. */
export function buildPlatformsCountAgg() {
  return {
    [AGG.platformsCount]: { cardinality: { field: HOST_OS_PLATFORM_FIELD } },
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

/**
 * Distinct critical/high findings an active response answered: a response copies the finding's
 * `wazuh` fields and stores its `_id` in `event.doc_id`. Per level and per rule id.
 */
export function buildIncidentResponseAggs(maxRules = 500) {
  const answeredDocs = {
    [AGG.answeredDocs]: { cardinality: { field: EVENT_DOC_ID_FIELD } },
  };
  return {
    [AGG.answeredFindings]: {
      filter: seriousLevelsFilter,
      aggs: {
        [AGG.byLevel]: {
          terms: {
            field: FINDING_SEVERITY_FIELD,
            size: SERIOUS_FINDING_LEVELS.length,
          },
          aggs: answeredDocs,
        },
        [AGG.byRule]: {
          terms: { field: RULE_ID_FIELD, size: maxRules },
          aggs: answeredDocs,
        },
      },
    },
  };
}

/** KQL twin of the urgent-or-critical part of `ATTENTION_CASES_FILTER`, for its "View all" link. */
export const ATTENTION_CASES_QUERY = `${CASE_PRIORITY_FIELD}:urgent or ${CASE_SEVERITY_FIELD}:critical`;

/** Open cases that are urgent or critical. */
const ATTENTION_CASES_FILTER = {
  bool: {
    filter: [{ terms: { [CASE_STATUS_FIELD]: OPEN_CASE_STATUSES } }],
    should: [
      { term: { [CASE_PRIORITY_FIELD]: 'urgent' } },
      { term: { [CASE_SEVERITY_FIELD]: 'critical' } },
    ],
    minimum_should_match: 1,
  },
};

/** Ranks of a keyword list, highest first, as a painless map literal. */
const painlessRanks = (values: readonly string[]) =>
  `[${values
    .map((value, index) => `'${value}': ${values.length - index}`)
    .join(', ')}]`;

/**
 * Priority, then severity, highest first. Keyword sorting is alphabetical, so the rank comes
 * from a script; it only runs on the few open urgent or critical cases.
 */
const BY_URGENCY = {
  _script: {
    type: 'number',
    order: 'desc',
    script: {
      lang: 'painless',
      source: [
        'def rank(def d, String f, Map m) { return d[f].size() == 0 ? 0 : m.getOrDefault(d[f].value, 0); }',
        `return rank(doc, '${CASE_PRIORITY_FIELD}', ${painlessRanks(
          CASE_PRIORITIES,
        )}) * 10 + rank(doc, '${CASE_SEVERITY_FIELD}', ${painlessRanks(
          FINDING_SEVERITY_BANDS,
        )});`,
      ].join(' '),
    },
  },
};

/**
 * Case management card in one search: cases per status, open cases per severity, and the open
 * urgent or critical cases.
 */
export function buildCaseManagementAggs() {
  const severityFilters: Record<string, unknown> = {};
  for (const band of FINDING_SEVERITY_BANDS) {
    severityFilters[band] = { term: { [CASE_SEVERITY_FIELD]: band } };
  }
  return {
    [AGG.caseStatus]: {
      filters: {
        filters: Object.fromEntries(
          CASE_STATUSES.map(status => [
            status,
            { term: { [CASE_STATUS_FIELD]: status } },
          ]),
        ),
      },
    },
    [AGG.openCases]: {
      filter: { terms: { [CASE_STATUS_FIELD]: OPEN_CASE_STATUSES } },
      aggs: {
        [AGG.caseSeverity]: { filters: { filters: severityFilters } },
      },
    },
    [AGG.attentionCases]: {
      filter: ATTENTION_CASES_FILTER,
      aggs: {
        [AGG.attentionTop]: {
          top_hits: {
            size: ACTION_LIST_ROWS,
            sort: [
              BY_URGENCY,
              {
                [CASE_UPDATED_AT_FIELD]: {
                  order: 'desc',
                  unmapped_type: 'date',
                },
              },
            ],
            _source: ['wazuh.case.*', 'wazuh.agent.name'],
          },
        },
      },
    },
  };
}
