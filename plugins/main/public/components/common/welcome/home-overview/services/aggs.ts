/* eslint-disable camelcase */
import { SeverityBand } from './types';
import { CheckResult } from '../../../../overview/sca/utils/constants';

/**
 * OpenSearch aggregation builders for the OVERVIEW, Endpoint Security and
 * Threat Hunting sections. These are pure — no data-source coupling — so
 * they can be unit-tested and reused across the batched findings search and
 * the per-index-group searches.
 */

export const SEVERITY_BANDS: SeverityBand[] = [
  'critical',
  'high',
  'medium',
  'low',
];

/** Field holding the Finding Severity band string on the findings index. */
export const FINDING_SEVERITY_FIELD = 'wazuh.rule.level';
export const MITRE_TACTIC_NAME_FIELD = 'wazuh.rule.mitre.tactic.name';
export const MITRE_TECHNIQUE_ID_FIELD = 'wazuh.rule.mitre.technique.id';
export const MITRE_TECHNIQUE_NAME_FIELD = 'wazuh.rule.mitre.technique.name';
export const RULE_TITLE_FIELD = 'wazuh.rule.title';
export const HOST_OS_NAME_FIELD = 'host.os.name';
export const PROCESS_NAME_FIELD = 'process.name';
export const SCA_CHECK_RESULT_FIELD = 'check.result';
export const SCA_POLICY_NAME_FIELD = 'policy.name';
export const FIM_PLATFORM_FIELD = 'wazuh.agent.host.os.platform';
export const VULNERABILITY_SEVERITY_FIELD = 'vulnerability.severity';
export const VULNERABILITY_OS_NAME_FIELD = 'host.os.name';
/** The CVE identifier field — distinct from the vulnerabilities index's doc
 * count, since one CVE can match many findings/assets. */
export const VULNERABILITY_CVE_ID_FIELD = 'vulnerability.id';
/** A single event can carry more than one threat-enrichment match, so the
 * Malware Detection module counts distinct events via this field rather
 * than the raw doc count (confirmed against that module's own dashboard
 * panels, which all use `cardinality(event.doc_id)`). */
export const EVENT_DOC_ID_FIELD = 'event.doc_id';

/** `vulnerability.severity` values are capitalized, unlike the lowercase
 * finding-severity bands, so they get their own filters agg. */
const VULNERABILITY_SEVERITY_VALUES: Record<SeverityBand, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

/**
 * Single `filters` aggregation with one named bucket per severity band, so all
 * four counts come back in one findings search (rather than one query per band).
 */
export function buildSeverityFiltersAgg() {
  const filters: Record<string, unknown> = {};
  for (const band of SEVERITY_BANDS) {
    filters[band] = { match_phrase: { [FINDING_SEVERITY_FIELD]: band } };
  }
  return { severity: { filters: { filters } } };
}

/** Vulnerability Severity tiles: one `filters` aggregation, one search. */
export function buildVulnerabilitySeverityFiltersAgg() {
  const filters: Record<string, unknown> = {};
  for (const band of SEVERITY_BANDS) {
    filters[band] = {
      match_phrase: {
        [VULNERABILITY_SEVERITY_FIELD]: VULNERABILITY_SEVERITY_VALUES[band],
      },
    };
  }
  return { vulnerability_severity: { filters: { filters } } };
}

export function buildTopTermsAgg(name: string, field: string, size = 5) {
  return { [name]: { terms: { field, size } } };
}

/** The OVERVIEW findings batch: severity bands + top MITRE tactics, plus
 * Threat Hunting's total findings + top rules + techniques observed/top-5 —
 * all carried by the one findings search that fires on mount. */
export function buildFindingsOverviewAggs(
  topTacticsSize = 5,
  topRulesSize = 5,
  topTechniquesSize = 5,
) {
  return {
    ...buildSeverityFiltersAgg(),
    ...buildTopTermsAgg('tactics', MITRE_TACTIC_NAME_FIELD, topTacticsSize),
    ...buildTopTermsAgg('top_rules', RULE_TITLE_FIELD, topRulesSize),
    techniques_count: { cardinality: { field: MITRE_TECHNIQUE_ID_FIELD } },
    ...buildTopTermsAgg(
      'top_techniques',
      MITRE_TECHNIQUE_NAME_FIELD,
      topTechniquesSize,
    ),
  };
}

/** Configuration Assessment tiles: Passed / Failed / N-A counts, one search. */
export function buildSCATilesAgg() {
  return {
    sca_result: {
      filters: {
        filters: {
          passed: {
            match_phrase: { [SCA_CHECK_RESULT_FIELD]: CheckResult.Passed },
          },
          failed: {
            match_phrase: { [SCA_CHECK_RESULT_FIELD]: CheckResult.Failed },
          },
          not_applicable: {
            match_phrase: {
              [SCA_CHECK_RESULT_FIELD]: CheckResult.NotApplicable,
            },
          },
        },
      },
    },
  };
}

/** Top benchmarks by checks: policy terms, each with a nested Passed/Failed
 * breakdown so the score can be derived per benchmark. */
export function buildSCATopBenchmarksAgg(size = 5) {
  return {
    sca_benchmarks: {
      terms: { field: SCA_POLICY_NAME_FIELD, size },
      aggs: {
        result: { terms: { field: SCA_CHECK_RESULT_FIELD, size: 3 } },
      },
    },
  };
}

export function buildFIMTopPlatformsAgg(size = 5) {
  return buildTopTermsAgg('fim_platforms', FIM_PLATFORM_FIELD, size);
}

export function buildVulnerabilityTopOsAgg(size = 5) {
  return buildTopTermsAgg('vulnerabilities_by_os', VULNERABILITY_OS_NAME_FIELD, size);
}

/** CVEs matched: distinct-CVE count, not the total (match-document) count. */
export function buildCvesMatchedAgg() {
  return {
    cves_matched: { cardinality: { field: VULNERABILITY_CVE_ID_FIELD } },
  };
}

/** IOC Match hero: distinct events with a threat-enrichment match, matching
 * the Malware Detection module's own dashboard metric shape (not a raw doc
 * count — one event can carry more than one enrichment match). */
export function buildIocMatchesAgg() {
  return {
    ioc_matches: { cardinality: { field: EVENT_DOC_ID_FIELD } },
  };
}

/** IOC indicator type, e.g. "domain" / "ip" / "hash" — confirmed against
 * the Malware Detection module's own "Enrichment types" panel, which
 * aggregates this same field on the same findings index (not the separate
 * Security Analytics IOC catalog). */
export const IOC_INDICATOR_TYPE_FIELD = 'wazuh.threat.enrichments.indicator.type';

/** IOC feed by type (top `size`): distinct-event count per indicator type,
 * carried on the same findings search as the IOC Match hero — one search,
 * no extra request. */
export function buildIocFeedByTypeAgg(size = 5) {
  return {
    ioc_feed_by_type: {
      terms: {
        field: IOC_INDICATOR_TYPE_FIELD,
        size,
        order: { distinct_events: 'desc' },
      },
      aggs: {
        distinct_events: { cardinality: { field: EVENT_DOC_ID_FIELD } },
      },
    },
  };
}
