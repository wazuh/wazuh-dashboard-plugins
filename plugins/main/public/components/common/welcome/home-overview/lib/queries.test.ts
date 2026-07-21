/* eslint-disable camelcase */
import {
  buildSeverityFiltersAgg,
  buildTopTermsAgg,
  buildFindingsOverviewAggs,
  buildVulnerabilitySeverityFiltersAgg,
  buildSCATilesAgg,
  buildSCATopBenchmarksAgg,
  buildFIMTopPlatformsAgg,
  buildVulnerabilityTopOsAgg,
  buildCvesMatchedAgg,
  buildIocMatchesAgg,
  buildMalwareFilterAgg,
  buildThreatIntelFeedByTypeAgg,
} from './queries';
import {
  FINDING_SEVERITY_BANDS,
  VULNERABILITY_SEVERITY_BANDS,
  FINDING_SEVERITY_FIELD,
  MITRE_TACTIC_NAME_FIELD,
  MITRE_TECHNIQUE_ID_FIELD,
  MITRE_TECHNIQUE_NAME_FIELD,
  RULE_TITLE_FIELD,
  VULNERABILITY_SEVERITY_FIELD,
  SCA_CHECK_RESULT_FIELD,
  SCA_POLICY_NAME_FIELD,
  FIM_PLATFORM_FIELD,
  VULNERABILITY_OS_NAME_FIELD,
  VULNERABILITY_CVE_ID_FIELD,
  EVENT_DOC_ID_FIELD,
  THREAT_ENRICHMENTS_FIELD,
  THREAT_INTEL_TYPE_FIELD,
} from './fields';

describe('query builders', () => {
  it('builds one filters-agg bucket per finding severity band', () => {
    const agg = buildSeverityFiltersAgg();
    const filters = agg.severity.filters.filters;
    expect(Object.keys(filters).sort()).toEqual(
      [...FINDING_SEVERITY_BANDS].sort(),
    );
    expect(filters.critical).toEqual({
      match_phrase: { [FINDING_SEVERITY_FIELD]: 'critical' },
    });
    expect(filters.informational).toEqual({
      match_phrase: { [FINDING_SEVERITY_FIELD]: 'informational' },
    });
  });

  it('builds a terms agg with the given name, field and size', () => {
    expect(buildTopTermsAgg('top_os', 'host.os.name', 5)).toEqual({
      top_os: { terms: { field: 'host.os.name', size: 5 } },
    });
  });

  it('batches severity + top tactics + threat hunting aggs into one findings agg object', () => {
    const aggs = buildFindingsOverviewAggs(7, 5, 5);
    expect(aggs.severity).toBeDefined();
    expect(aggs.tactics).toEqual({
      terms: { field: MITRE_TACTIC_NAME_FIELD, size: 7 },
    });
    expect(aggs.top_rules).toEqual({
      terms: { field: RULE_TITLE_FIELD, size: 5 },
    });
    expect(aggs.techniques_count).toEqual({
      cardinality: { field: MITRE_TECHNIQUE_ID_FIELD },
    });
    expect(aggs.top_techniques).toEqual({
      terms: { field: MITRE_TECHNIQUE_NAME_FIELD, size: 5 },
    });
  });

  it('builds one filters-agg bucket per capitalized vulnerability severity value', () => {
    const agg = buildVulnerabilitySeverityFiltersAgg();
    const filters = agg.vulnerability_severity.filters.filters;
    expect(Object.keys(filters).sort()).toEqual(
      [...VULNERABILITY_SEVERITY_BANDS].sort(),
    );
    expect(filters.critical).toEqual({
      match_phrase: { [VULNERABILITY_SEVERITY_FIELD]: 'Critical' },
    });
    expect(filters.low).toEqual({
      match_phrase: { [VULNERABILITY_SEVERITY_FIELD]: 'Low' },
    });
  });

  it('builds the SCA tiles filters agg with Passed/Failed/Not applicable buckets', () => {
    const agg = buildSCATilesAgg();
    expect(Object.keys(agg.sca_result.filters.filters).sort()).toEqual([
      'failed',
      'not_applicable',
      'passed',
    ]);
    expect(agg.sca_result.filters.filters.passed).toEqual({
      match_phrase: { [SCA_CHECK_RESULT_FIELD]: 'Passed' },
    });
  });

  it('builds the SCA top-benchmarks agg with a nested check-result breakdown', () => {
    const agg = buildSCATopBenchmarksAgg(5);
    expect(agg.sca_benchmarks.terms).toEqual({
      field: SCA_POLICY_NAME_FIELD,
      size: 5,
    });
    expect(agg.sca_benchmarks.aggs.result.terms.field).toBe(
      SCA_CHECK_RESULT_FIELD,
    );
  });

  it('builds the FIM top-platforms agg', () => {
    expect(buildFIMTopPlatformsAgg(5)).toEqual({
      fim_platforms: { terms: { field: FIM_PLATFORM_FIELD, size: 5 } },
    });
  });

  it('builds the vulnerabilities-by-OS agg', () => {
    expect(buildVulnerabilityTopOsAgg(5)).toEqual({
      vulnerabilities_by_os: {
        terms: { field: VULNERABILITY_OS_NAME_FIELD, size: 5 },
      },
    });
  });

  it('builds the CVEs-matched agg as a cardinality, not a doc count', () => {
    expect(buildCvesMatchedAgg()).toEqual({
      cves_matched: { cardinality: { field: VULNERABILITY_CVE_ID_FIELD } },
    });
  });

  it('builds the IOC Match agg as a cardinality over distinct events', () => {
    expect(buildIocMatchesAgg()).toEqual({
      ioc_matches: { cardinality: { field: EVENT_DOC_ID_FIELD } },
    });
  });

  it('builds the IOC-feed-by-type agg as a terms agg on the enrichments catalog type', () => {
    expect(buildThreatIntelFeedByTypeAgg(5)).toEqual({
      ioc_feed_by_type: { terms: { field: THREAT_INTEL_TYPE_FIELD, size: 5 } },
    });
  });

  it('builds the malware filter agg on the threat-enrichment subset, nesting only the IOC-match hero', () => {
    const agg = buildMalwareFilterAgg();
    expect(agg.malware.filter).toEqual({
      exists: { field: THREAT_ENRICHMENTS_FIELD },
    });
    expect(agg.malware.aggs.ioc_matches).toEqual({
      cardinality: { field: EVENT_DOC_ID_FIELD },
    });
    // Feed-by-type is no longer part of the findings search.
    expect(agg.malware.aggs.ioc_feed_by_type).toBeUndefined();
  });
});
