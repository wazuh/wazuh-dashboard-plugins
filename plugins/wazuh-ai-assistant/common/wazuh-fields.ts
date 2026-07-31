/**
 * Single source of truth for the `wazuh.*` field vocabulary.
 *
 * `agent.*` is NOT a flat `agent.` -> `wazuh.agent.` prefix: `agent.os.name` and `agent.ip`
 * live at `wazuh.agent.host.os.name` and `wazuh.agent.host.ip` instead. These irregulars are
 * explicit table entries below, checked before any prefix assumption.
 *
 * Catalog tools keep field names as plain string literals in their ES DSL bodies rather than
 * importing `WAZUH_FIELD` (so queries stay grep-able); `field-policy-coverage.test.ts` enforces
 * the vocabulary via a CI source-scan instead.
 */

/** Valid Wazuh 5.0 field paths, consumed by the flat allowlist/enumeration surfaces (guardrails.ts,
 * privacy.ts, catalog/common.ts, digest.ts). Population is decoder-dependent — a field being
 * listed here means it belongs to the current schema, not that every decoder writes to it. */
export const WAZUH_FIELD = Object.freeze({
  RULE_LEVEL: 'wazuh.rule.level',
  RULE_ID: 'wazuh.rule.id',
  RULE_TITLE: 'wazuh.rule.title',
  RULE_TAGS: 'wazuh.rule.tags',
  RULE_CATEGORY: 'wazuh.rule.category',
  RULE_MITRE_TECHNIQUE_ID: 'wazuh.rule.mitre.technique.id',
  RULE_MITRE_TECHNIQUE_NAME: 'wazuh.rule.mitre.technique.name',
  RULE_MITRE_TACTIC: 'wazuh.rule.mitre.tactic',
  RULE_MITRE_TACTIC_NAME: 'wazuh.rule.mitre.tactic.name',
  RULE_COMPLIANCE_CMMC: 'wazuh.rule.compliance.cmmc',
  RULE_COMPLIANCE_FEDRAMP: 'wazuh.rule.compliance.fedramp',
  RULE_COMPLIANCE_GDPR: 'wazuh.rule.compliance.gdpr',
  RULE_COMPLIANCE_HIPAA: 'wazuh.rule.compliance.hipaa',
  RULE_COMPLIANCE_ISO_27001: 'wazuh.rule.compliance.iso_27001',
  RULE_COMPLIANCE_NIS2: 'wazuh.rule.compliance.nis2',
  RULE_COMPLIANCE_NIST_800_171: 'wazuh.rule.compliance.nist_800_171',
  RULE_COMPLIANCE_NIST_800_53: 'wazuh.rule.compliance.nist_800_53',
  RULE_COMPLIANCE_PCI_DSS: 'wazuh.rule.compliance.pci_dss',
  RULE_COMPLIANCE_TSC: 'wazuh.rule.compliance.tsc',
  INTEGRATION_NAME: 'wazuh.integration.name',
  INTEGRATION_CATEGORY: 'wazuh.integration.category',
  INTEGRATION_DECODERS: 'wazuh.integration.decoders',
  INTEGRATION_RULES: 'wazuh.integration.rules',
  AGENT_ID: 'wazuh.agent.id',
  AGENT_NAME: 'wazuh.agent.name',
  AGENT_OS_NAME: 'wazuh.agent.host.os.name',
  AGENT_IP: 'wazuh.agent.host.ip',
} as const);

export type WazuhFieldKey = keyof typeof WAZUH_FIELD;
export type WazuhFieldValue = (typeof WAZUH_FIELD)[WazuhFieldKey];

/** One entry per supported compliance framework, in a fixed menu order (also the `framework`
 * param's enum order on the wire for get_compliance_alerts/get_compliance_summary). */
export const COMPLIANCE_FRAMEWORKS = [
  'cmmc',
  'fedramp',
  'gdpr',
  'hipaa',
  'iso_27001',
  'nis2',
  'nist_800_171',
  'nist_800_53',
  'pci_dss',
  'tsc',
] as const;

export type ComplianceFramework = (typeof COMPLIANCE_FRAMEWORKS)[number];

/** Maps a `framework` enum value to its `wazuh.rule.compliance.<framework>` field path. */
export const COMPLIANCE_FRAMEWORK_FIELDS: Record<ComplianceFramework, string> =
  Object.freeze({
    cmmc: WAZUH_FIELD.RULE_COMPLIANCE_CMMC,
    fedramp: WAZUH_FIELD.RULE_COMPLIANCE_FEDRAMP,
    gdpr: WAZUH_FIELD.RULE_COMPLIANCE_GDPR,
    hipaa: WAZUH_FIELD.RULE_COMPLIANCE_HIPAA,
    iso_27001: WAZUH_FIELD.RULE_COMPLIANCE_ISO_27001,
    nis2: WAZUH_FIELD.RULE_COMPLIANCE_NIS2,
    nist_800_171: WAZUH_FIELD.RULE_COMPLIANCE_NIST_800_171,
    nist_800_53: WAZUH_FIELD.RULE_COMPLIANCE_NIST_800_53,
    pci_dss: WAZUH_FIELD.RULE_COMPLIANCE_PCI_DSS,
    tsc: WAZUH_FIELD.RULE_COMPLIANCE_TSC,
  });

export const SEVERITY_LEVELS = [
  'informational',
  'low',
  'medium',
  'high',
  'critical',
] as const;

export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];
