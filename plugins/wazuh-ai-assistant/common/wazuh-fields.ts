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

/** Live, populated Wazuh 5.0 field paths, consumed by the flat allowlist/enumeration surfaces
 * (guardrails.ts, privacy.ts, catalog/common.ts, digest.ts). */
export const WAZUH_FIELD = Object.freeze({
  RULE_LEVEL: 'wazuh.rule.level',
  RULE_ID: 'wazuh.rule.id',
  RULE_DESCRIPTION: 'wazuh.rule.description',
  RULE_TAGS: 'wazuh.rule.tags',
  RULE_CATEGORY: 'wazuh.rule.category',
  RULE_MITRE_TECHNIQUE_ID: 'wazuh.rule.mitre.technique.id',
  RULE_MITRE_TECHNIQUE_NAME: 'wazuh.rule.mitre.technique.name',
  RULE_MITRE_TACTIC: 'wazuh.rule.mitre.tactic',
  RULE_MITRE_TACTIC_NAME: 'wazuh.rule.mitre.tactic.name',
  RULE_COMPLIANCE_PCI_DSS: 'wazuh.rule.compliance.pci_dss',
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

/**
 * Retired bare field path -> its `wazuh.*` equivalent, or `null` when there is no 5.0
 * equivalent at all. Enumeration source for the CI source-scan guard
 * (`field-policy-coverage.test.ts`).
 */
export const RETIRED_FIELD_MAP: Readonly<Record<string, string | null>> =
  Object.freeze({
    'rule.level': WAZUH_FIELD.RULE_LEVEL,
    'rule.id': WAZUH_FIELD.RULE_ID,
    'rule.description': WAZUH_FIELD.RULE_DESCRIPTION,
    'rule.tags': WAZUH_FIELD.RULE_TAGS,
    'rule.category': WAZUH_FIELD.RULE_CATEGORY,
    'rule.mitre.technique.id': WAZUH_FIELD.RULE_MITRE_TECHNIQUE_ID,
    'rule.mitre.technique.name': WAZUH_FIELD.RULE_MITRE_TECHNIQUE_NAME,
    'rule.mitre.tactic': WAZUH_FIELD.RULE_MITRE_TACTIC,
    'rule.mitre.tactic.name': WAZUH_FIELD.RULE_MITRE_TACTIC_NAME,
    'rule.compliance.pci_dss': WAZUH_FIELD.RULE_COMPLIANCE_PCI_DSS,
    'agent.id': WAZUH_FIELD.AGENT_ID,
    'agent.name': WAZUH_FIELD.AGENT_NAME,
    'agent.os.name': WAZUH_FIELD.AGENT_OS_NAME,
    'agent.ip': WAZUH_FIELD.AGENT_IP,
    'rule.groups': null,
    'rule.mitre.id': null,
    'data.srcip': null,
    'data.dstip': null,
    'data.srcuser': null,
    'data.dstuser': null,
    'data.username': null,
    'data.url': null,
    'data.command': null,
    full_log: null,
    'predecoder.hostname': null,
    'predecoder.program_name': null,
    'GeoLocation.*': null,
    'syscheck.path': null,
    'syscheck.event': null,
  });

/** Canonical 5-value severity vocabulary. `informational` is its own distinct bucket, never
 * folded into `low`. */
export const SEVERITY_LEVELS = [
  'informational',
  'low',
  'medium',
  'high',
  'critical',
] as const;

export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];
