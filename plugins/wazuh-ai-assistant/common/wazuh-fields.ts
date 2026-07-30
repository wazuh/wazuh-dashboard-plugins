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

export const SEVERITY_LEVELS = [
  'informational',
  'low',
  'medium',
  'high',
  'critical',
] as const;

export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];
