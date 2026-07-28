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
 * - `RETIRED_FIELD_MAP`/`mapRetiredField`: the old->new (or old->null, "no 5.0 equivalent")
 *   mapping table, used by the CI guard and by the (Slice D) saved-object migration/normalizer.
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
  RULE_MITRE_ID: 'wazuh.rule.mitre.id',
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
 * 5.0 equivalent at all (confirmed zero matches across every 5.0 known-fields template — see
 * `LEGACY_4X_FIELDS` below). Explicit table, not a regex: the `agent.os.name`/`agent.ip`
 * irregulars must be looked up here BEFORE any prefix fallback in `mapRetiredField`.
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

/** Confirmed-dead 4.x `wazuh-alerts-*` vocabulary with ZERO matches across every 5.0 known-fields
 * template. Used by the CI source-scan guard to distinguish an intentionally fenced LEGACY_4X_*
 * policy entry (harmless no-op, kept for fail-safe anonymization reasons) from a genuine
 * regression (a live query-building/guardrail reference to a retired path). */
export const LEGACY_4X_FIELDS: ReadonlySet<string> = new Set([
  'data.srcip',
  'data.dstip',
  'data.srcuser',
  'data.dstuser',
  'data.username',
  'data.url',
  'data.command',
  'full_log',
  'predecoder.hostname',
  'predecoder.program_name',
  'GeoLocation.*',
  'syscheck.path',
  'syscheck.event',
  'rule.groups',
  'agent.os.name',
  'rule.mitre.id',
  'rule.mitre.technique',
]);

export type MapRetiredFieldStatus = 'unchanged' | 'renamed' | 'retired';

export interface MapRetiredFieldResult {
  status: MapRetiredFieldStatus;
  /** The resolved field path: the input unchanged for 'unchanged'/'retired' (retired has no
   * replacement), or the renamed target for 'renamed'. */
  field: string;
}

const RULE_PREFIX_RE = /^rule\./;
const AGENT_PREFIX_RE = /^agent\./;

/** Maps one retired-vocabulary bare field path to its `wazuh.*` equivalent.
 *
 * Resolution order:
 * 1. Hard idempotency guard — any path already starting with `wazuh.` is returned `unchanged`
 *    immediately, before any other rule runs. This is what makes running the mapping twice (e.g.
 *    the saved-object migration normalizer) a no-op / fixed point.
 * 2. Trailing `.*` prefix-match form (`GeoLocation.*`): strip the suffix, map the base, re-append.
 * 3. Tool-scoped `tool/field` form (`get_active_agents/name`): map only the segment after `/`.
 * 4. Exact-match lookup against `RETIRED_FIELD_MAP` (covers the `agent.os.name`/`agent.ip`
 *    irregulars, which must never fall through to the prefix rule below).
 * 5. Prefix fallback: any other `rule.`/`agent.`-prefixed path not explicitly listed is treated as
 *    following the regular (mirrored) prefix rule and renamed to `wazuh.<field>`.
 * 6. Anything else is `unchanged`.
 */
export function mapRetiredField(field: string): MapRetiredFieldResult {
  if (field.startsWith('wazuh.')) {
    return { status: 'unchanged', field };
  }

  if (field.includes('/')) {
    const slashIndex = field.indexOf('/');
    const toolPrefix = field.slice(0, slashIndex + 1);
    const inner = field.slice(slashIndex + 1);
    const mapped = mapRetiredField(inner);
    if (mapped.status === 'unchanged') {
      return { status: 'unchanged', field };
    }
    return { status: mapped.status, field: `${toolPrefix}${mapped.field}` };
  }

  if (Object.prototype.hasOwnProperty.call(RETIRED_FIELD_MAP, field)) {
    const target = RETIRED_FIELD_MAP[field];
    if (target === null) {
      return { status: 'retired', field };
    }
    return { status: 'renamed', field: target };
  }

  if (field.endsWith('.*')) {
    const base = field.slice(0, -2);
    const mapped = mapRetiredField(base);
    if (mapped.status === 'unchanged') {
      return { status: 'unchanged', field };
    }
    if (mapped.status === 'retired') {
      return { status: 'retired', field };
    }
    return { status: 'renamed', field: `${mapped.field}.*` };
  }

  if (RULE_PREFIX_RE.test(field) || AGENT_PREFIX_RE.test(field)) {
    return { status: 'renamed', field: `wazuh.${field}` };
  }

  return { status: 'unchanged', field };
}

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
