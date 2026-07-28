/**
 * Single source of truth for the `wazuh.*` field vocabulary (issue #8802).
 *
 * Wazuh 5.0's Indexer templates rename the 4.x/ECS-generic `rule.*` and `agent.*` field
 * families under the `wazuh.*` namespace. Two populations exist:
 *
 * - `WAZUH_FIELD`: live, populated 5.0 paths — consumed by enumerable/flat policy surfaces
 *   (guardrails.ts's `AGG_FIELD_ALLOWLIST`, privacy.ts's `FIELD_POLICY_DEFAULTS`,
 *   catalog/common.ts's shared column sets, digest.ts's default columns). Individual catalog
 *   tools' ES DSL bodies deliberately keep field-name STRING LITERALS instead of importing these
 *   constants (ADR-1): that keeps the query bodies grep-able and reviewable, and the invariant is
 *   enforced instead by a CI source-scan (see `field-policy-coverage.test.ts`) rather than by
 *   indirection.
 * - `RETIRED_FIELD_MAP`: the old->new (or old->null, "no 5.0 equivalent") mapping table. This
 *   plugin ships new in 5.0 with no prior installations, so there is nothing to migrate — the map
 *   exists solely as the enumeration source for the CI source-scan guard below
 *   (`field-policy-coverage.test.ts`'s `findRetiredFieldLiteralOccurrences`), which fails the build
 *   if a retired bare literal ever resurfaces in catalog/digest/guardrails source.
 *
 * `rule.*` -> `wazuh.rule.*` is a perfect 1:1 mirror in the 5.0 known-fields templates (27
 * leaves each side) — a pure prefix rename. `agent.*` is NOT: 5.0's bare `agent.*` is a 7-leaf
 * ECS stub (id/name/groups/type/version/ephemeral_id/build.original) while `wazuh.agent.*` is a
 * 60+ leaf tree including the whole `wazuh.agent.host.*` subtree. `agent.os.name` and `agent.ip`
 * do NOT follow the `agent.` -> `wazuh.agent.` prefix rule — their real 5.0 homes are
 * `wazuh.agent.host.os.name` and `wazuh.agent.host.ip`. A naive prefix rewrite would produce two
 * fields that do not exist, silently reintroducing the exact bug this change fixes — so these are
 * explicit table entries, checked BEFORE any prefix fallback, never derived from a regex.
 */

/** Live, populated Wazuh 5.0 field paths. Frozen named-constant record consumed by the flat
 * allowlist/enumeration surfaces (see module doc comment for the ADR-1 scope boundary — NOT used
 * as indirection inside individual catalog tools' ES DSL bodies). */
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
  // Irregulars: NOT a straight `agent.` -> `wazuh.agent.` prefix — see module doc comment.
  AGENT_OS_NAME: 'wazuh.agent.host.os.name',
  AGENT_IP: 'wazuh.agent.host.ip',
} as const);

export type WazuhFieldKey = keyof typeof WAZUH_FIELD;
export type WazuhFieldValue = (typeof WAZUH_FIELD)[WazuhFieldKey];

/**
 * Old (retired) bare field path -> new `wazuh.*` equivalent, or `null` when the old path has NO
 * 5.0 equivalent at all (confirmed zero matches across every 5.0 known-fields template). Consumed
 * only by the CI source-scan guard (`field-policy-coverage.test.ts`), which enumerates these keys
 * to make sure none of them survives as a literal in catalog/digest/guardrails source.
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
    // Irregulars — do NOT follow the `agent.` -> `wazuh.agent.` prefix rule.
    'agent.os.name': WAZUH_FIELD.AGENT_OS_NAME,
    'agent.ip': WAZUH_FIELD.AGENT_IP,
    // Retired outright: zero matches in any 5.0 known-fields template (no 5.0 equivalent).
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

/** Canonical 5-value severity vocabulary. `informational` is its OWN distinct visual bucket —
 * never folded into `low` (correction locked in after spec/design were written; see
 * sdd/update-index-references/tasks). */
export const SEVERITY_LEVELS = [
  'informational',
  'low',
  'medium',
  'high',
  'critical',
] as const;

export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];
