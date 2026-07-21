import { SeverityBand } from '../interfaces/types';

/** Field-name constants shared by the query builders, mappers and navigation. */

export const FINDING_SEVERITY_BANDS: SeverityBand[] = [
  'critical',
  'high',
  'medium',
  'low',
  'informational',
];

export const VULNERABILITY_SEVERITY_BANDS: SeverityBand[] = [
  'critical',
  'high',
  'medium',
  'low',
];

export const FINDING_SEVERITY_FIELD = 'wazuh.rule.level';
export const MITRE_TACTIC_NAME_FIELD = 'wazuh.rule.mitre.tactic.name';
export const MITRE_TACTIC_ID_FIELD = 'wazuh.rule.mitre.tactic.id';
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
 * Presence marks a finding carrying a threat-intel enrichment (IOC) match:
 * the Malware Detection subset of the findings index. Drives the "IOC matches,
 * last 24h" hero (a detection metric — distinct from the feed catalog below).
 */
export const THREAT_ENRICHMENTS_FIELD = 'wazuh.threat.enrichments';

/**
 * IOC indicator type (domain/url/ip/hash) on the threat-intel enrichments
 * catalog index (`wazuh-threatintel-enrichments*`). Drives the "IOC feed by
 * type" breakdown — the composition of the feed itself, not what matched.
 */
export const THREAT_INTEL_TYPE_FIELD = 'document.type';

/**
 * vulnerability.severity values are capitalized, unlike the lowercase
 * finding-severity bands, so they get their own filters agg.
 */
export const VULNERABILITY_SEVERITY_VALUES: Partial<
  Record<SeverityBand, string>
> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};
