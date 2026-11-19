/* eslint-disable camelcase */
import {
  buildSeverityFiltersAgg,
  buildTopTermsAgg,
  buildFindingsOverviewAggs,
  buildVulnerabilitySeverityFiltersAgg,
  buildSCATilesAgg,
  buildSCATopBenchmarksAgg,
  buildFIMTopFilesAgg,
  buildVulnerabilityTopPackagesAgg,
  buildIocMatchesAgg,
  buildMalwareFilterAgg,
  buildThreatIntelByThreatTypeAgg,
  buildThreatIntelFeedByTypeAgg,
  buildCloudSecurityByModuleAgg,
  buildPlatformsCountAgg,
  buildIncidentResponseAggs,
  buildCaseManagementAggs,
  buildSeriousFindingsAgg,
  ATTENTION_CASES_QUERY,
} from './queries';
import {
  FINDING_SEVERITY_BANDS,
  VULNERABILITY_SEVERITY_BANDS,
  FINDING_SEVERITY_FIELD,
  HOST_OS_PLATFORM_FIELD,
  INTEGRATION_NAME_FIELD,
  MITRE_TACTIC_NAME_FIELD,
  MITRE_TACTIC_ID_FIELD,
  MITRE_TECHNIQUE_ID_FIELD,
  MITRE_TECHNIQUE_NAME_FIELD,
  RULE_TITLE_FIELD,
  VULNERABILITY_SEVERITY_FIELD,
  SCA_CHECK_RESULT_FIELD,
  SCA_POLICY_NAME_FIELD,
  FIM_FILE_MTIME_FIELD,
  FIM_FILE_PATH_FIELD,
  VULNERABILITY_PACKAGE_NAME_FIELD,
  EVENT_DOC_ID_FIELD,
  THREAT_ENRICHMENTS_FIELD,
  THREAT_INTEL_THREAT_TYPE_FIELD,
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

  it('counts distinct platforms with a cardinality agg', () => {
    expect(buildPlatformsCountAgg()).toEqual({
      platforms_count: { cardinality: { field: HOST_OS_PLATFORM_FIELD } },
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
      aggs: {
        external_id: { terms: { field: MITRE_TACTIC_ID_FIELD, size: 1 } },
      },
    });
    expect(aggs.top_rules).toEqual({
      terms: { field: RULE_TITLE_FIELD, size: 5 },
    });
    expect(aggs.techniques_count).toEqual({
      cardinality: { field: MITRE_TECHNIQUE_ID_FIELD },
    });
    expect(aggs.top_techniques).toEqual({
      terms: { field: MITRE_TECHNIQUE_NAME_FIELD, size: 5 },
      aggs: {
        external_id: { terms: { field: MITRE_TECHNIQUE_ID_FIELD, size: 1 } },
      },
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

  it('builds the FIM top-modified-files agg ordered by the latest modification time', () => {
    expect(buildFIMTopFilesAgg(5)).toEqual({
      fim_top_files: {
        terms: {
          field: FIM_FILE_PATH_FIELD,
          size: 5,
          order: { last_modified: 'desc' },
        },
        aggs: { last_modified: { max: { field: FIM_FILE_MTIME_FIELD } } },
      },
    });
  });

  it('builds the vulnerabilities-by-package agg', () => {
    expect(buildVulnerabilityTopPackagesAgg(5)).toEqual({
      vulnerabilities_by_package: {
        terms: { field: VULNERABILITY_PACKAGE_NAME_FIELD, size: 5 },
      },
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

  it('builds the threat-types agg as a terms agg on the enrichments threat type', () => {
    expect(buildThreatIntelByThreatTypeAgg(5)).toEqual({
      threat_types: {
        terms: { field: THREAT_INTEL_THREAT_TYPE_FIELD, size: 5 },
      },
    });
  });

  it('builds one filters-agg bucket per Cloud Security module, keyed by app id', () => {
    const agg = buildCloudSecurityByModuleAgg();
    const filters = agg.cloud_security_by_module.filters.filters;
    expect(Object.keys(filters).sort()).toEqual(
      [
        'amazon-web-services',
        'docker',
        'github',
        'google-cloud',
        'microsoft-graph-api',
        'office365',
      ].sort(),
    );
    expect(filters.docker).toEqual({
      match_phrase: { [INTEGRATION_NAME_FIELD]: 'docker' },
    });
    // AWS spans several sub-integrations (aws-cloudtrail, aws-guardduty, ...).
    expect(filters['amazon-web-services']).toEqual({
      wildcard: { [INTEGRATION_NAME_FIELD]: 'aws*' },
    });
    expect(filters['google-cloud']).toEqual({
      match_phrase: { [INTEGRATION_NAME_FIELD]: 'gcp' },
    });
    expect(filters.office365).toEqual({
      match_phrase: { [INTEGRATION_NAME_FIELD]: 'o365' },
    });
    // Microsoft Graph API reuses the Azure dashboard/data source.
    expect(filters['microsoft-graph-api']).toEqual({
      match_phrase: { [INTEGRATION_NAME_FIELD]: 'azure' },
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

  it('counts the distinct critical/high findings answered, per level and per rule', () => {
    const answeredDocs = {
      answered_docs: { cardinality: { field: 'event.doc_id' } },
    };
    expect(buildIncidentResponseAggs()).toEqual({
      answered_findings: {
        filter: { terms: { 'wazuh.rule.level': ['critical', 'high'] } },
        aggs: {
          by_level: {
            terms: { field: 'wazuh.rule.level', size: 2 },
            aggs: answeredDocs,
          },
          by_rule: {
            terms: { field: 'wazuh.rule.id', size: 500 },
            aggs: answeredDocs,
          },
        },
      },
    });
  });

  it('adds the critical/high findings and their top rules per level to the findings search', () => {
    expect(buildFindingsOverviewAggs().serious_findings).toEqual(
      buildSeriousFindingsAgg().serious_findings,
    );
    expect(buildSeriousFindingsAgg(10)).toEqual({
      serious_findings: {
        filter: { terms: { 'wazuh.rule.level': ['critical', 'high'] } },
        aggs: {
          by_level: {
            terms: { field: 'wazuh.rule.level', size: 2 },
            aggs: {
              by_rule: {
                terms: { field: 'wazuh.rule.id', size: 10 },
                aggs: {
                  rule_title: { terms: { field: 'wazuh.rule.title', size: 1 } },
                },
              },
            },
          },
        },
      },
    });
  });

  it('builds the case counts per status and the severity of the open ones', () => {
    const agg = buildCaseManagementAggs();
    expect(agg.case_status.filters.filters).toEqual({
      active: { term: { 'wazuh.case.status': 'active' } },
      acknowledged: { term: { 'wazuh.case.status': 'acknowledged' } },
      completed: { term: { 'wazuh.case.status': 'completed' } },
    });
    expect(agg.open_cases.filter).toEqual({
      terms: { 'wazuh.case.status': ['active', 'acknowledged'] },
    });
    expect(
      Object.keys(agg.open_cases.aggs.case_severity.filters.filters),
    ).toEqual(FINDING_SEVERITY_BANDS);
  });

  it('builds the open urgent or critical cases, most urgent first', () => {
    const { attention_cases: attention } = buildCaseManagementAggs();
    expect(attention.filter).toEqual({
      bool: {
        filter: [
          { terms: { 'wazuh.case.status': ['active', 'acknowledged'] } },
        ],
        should: [
          { term: { 'wazuh.case.priority': 'urgent' } },
          { term: { 'wazuh.case.severity': 'critical' } },
        ],
        minimum_should_match: 1,
      },
    });
    const top = attention.aggs.attention_top.top_hits;
    expect(top.size).toBe(3);
    expect(top._source).toEqual(['wazuh.case.*', 'wazuh.agent.name']);
    const [byUrgency, byUpdate] = top.sort as unknown as [
      { _script: { order: string; script: { source: string } } },
      unknown,
    ];
    expect(byUrgency._script.order).toBe('desc');
    expect(byUrgency._script.script.source).toContain(
      "'urgent': 4, 'high': 3, 'medium': 2, 'low': 1",
    );
    expect(byUrgency._script.script.source).toContain(
      "'critical': 5, 'high': 4, 'medium': 3, 'low': 2, 'informational': 1",
    );
    expect(byUpdate).toEqual({
      'wazuh.case.updated_at': { order: 'desc', unmapped_type: 'date' },
    });
  });

  it('mirrors the urgent-or-critical condition as KQL for the "View all" link', () => {
    expect(ATTENTION_CASES_QUERY).toBe(
      'wazuh.case.priority:urgent or wazuh.case.severity:critical',
    );
  });
});
