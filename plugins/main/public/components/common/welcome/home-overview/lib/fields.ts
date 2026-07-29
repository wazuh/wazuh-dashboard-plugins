import { SeverityBand } from '../interfaces/types';
import { WAZUH_MODULES_ID } from '../../../../../../common/constants';

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
  'pending',
];

export const FINDING_SEVERITY_FIELD = 'wazuh.rule.level';
export const MITRE_TACTIC_NAME_FIELD = 'wazuh.rule.mitre.tactic.name';
export const MITRE_TACTIC_ID_FIELD = 'wazuh.rule.mitre.tactic.id';
export const MITRE_TECHNIQUE_ID_FIELD = 'wazuh.rule.mitre.technique.id';
export const MITRE_TECHNIQUE_NAME_FIELD = 'wazuh.rule.mitre.technique.name';
export const RULE_TITLE_FIELD = 'wazuh.rule.title';
export const INTEGRATION_NAME_FIELD = 'wazuh.integration.name';
export const HOST_OS_NAME_FIELD = 'host.os.name';
export const PROCESS_NAME_FIELD = 'process.name';
export const SCA_CHECK_RESULT_FIELD = 'check.result';
export const SCA_POLICY_NAME_FIELD = 'policy.name';
/** Modified-file path on a FIM state document, for the "Top 5 modified files" bars. */
export const FIM_FILE_PATH_FIELD = 'file.path';
export const VULNERABILITY_SEVERITY_FIELD = 'vulnerability.severity';
/** Package name on a vulnerability state document, for "Top 5 package name". */
export const VULNERABILITY_PACKAGE_NAME_FIELD = 'package.name';
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
 * IOC type (domain/url/ip/hash) on the threat-intel enrichments
 * catalog index (`wazuh-threatintel-enrichments*`). Drives the "IOC feed by
 * type" breakdown — the composition of the feed itself, not what matched.
 */
export const THREAT_INTEL_TYPE_FIELD = 'document.type';
export const THREAT_INTEL_THREAT_TYPE_FIELD = 'document.software.type';

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

/**
 * Compliance field per regulatory framework (`wazuh.rule.compliance.<key>`).
 * Every framework reports the same total findings count (one finding can
 * implicate several frameworks at once), so the Regulatory Compliance chips
 * instead rank by *distinct controls implicated* — a cardinality agg on this
 * field, one per framework.
 */
export const COMPLIANCE_FRAMEWORK_FIELDS: Record<string, string> = {
  [WAZUH_MODULES_ID.PCI_DSS]: 'wazuh.rule.compliance.pci_dss',
  [WAZUH_MODULES_ID.GDPR]: 'wazuh.rule.compliance.gdpr',
  [WAZUH_MODULES_ID.HIPAA]: 'wazuh.rule.compliance.hipaa',
  [WAZUH_MODULES_ID.NIST_800_53]: 'wazuh.rule.compliance.nist_800_53',
  [WAZUH_MODULES_ID.NIST_800_171]: 'wazuh.rule.compliance.nist_800_171',
  [WAZUH_MODULES_ID.TSC]: 'wazuh.rule.compliance.tsc',
  [WAZUH_MODULES_ID.CMMC]: 'wazuh.rule.compliance.cmmc',
  [WAZUH_MODULES_ID.FEDRAMP]: 'wazuh.rule.compliance.fedramp',
  [WAZUH_MODULES_ID.ISO_27001]: 'wazuh.rule.compliance.iso_27001',
  [WAZUH_MODULES_ID.NIS2]: 'wazuh.rule.compliance.nis2',
};
