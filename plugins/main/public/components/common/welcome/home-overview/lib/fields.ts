import { SeverityBand } from '../interfaces/types';

/** Field-name constants shared by the query builders, mappers and navigation. */

export const SEVERITY_BANDS: SeverityBand[] = [
  'critical',
  'high',
  'medium',
  'low',
];

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
/** CVE identifier field; distinct from doc count since one CVE can match many findings/assets. */
export const VULNERABILITY_CVE_ID_FIELD = 'vulnerability.id';
/**
 * One event can carry more than one threat-enrichment match, so Malware
 * Detection counts distinct events via this field rather than raw doc count
 */
export const EVENT_DOC_ID_FIELD = 'event.doc_id';

/**
 * IOC indicator type (domain/ip/hash) — the field the Malware Detection
 * dashboard aggregates, not the separate Security Analytics IOC catalog.
 */
export const IOC_INDICATOR_TYPE_FIELD = 'wazuh.threat.enrichments.indicator.type';

/**
 * Presence marks a finding carrying a threat-intel enrichment (IOC) match:
 * the Malware Detection subset of the findings index.
 */
export const THREAT_ENRICHMENTS_FIELD = 'wazuh.threat.enrichments';

/**
 * vulnerability.severity values are capitalized, unlike the lowercase
 * finding-severity bands, so they get their own filters agg.
 */
export const VULNERABILITY_SEVERITY_VALUES: Record<SeverityBand, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};
