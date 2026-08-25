/**
 * Single source of truth for `search_wazuh_data`'s `index_pattern` enum (workstream A1a,
 * AI/plan/coverage-validation-design.md). Before this file, the escape hatch's three original
 * enum values were a literal array inline in `search-wazuh-data.ts`; every new family this
 * workstream opens in `guardrails.ts`'s `INDEX_ALLOWLIST_RE` needs a matching enum entry there too
 * (an allowlisted-but-not-enumerable index is unreachable — the tool's JSON-schema `enum` is what
 * actually lets the model name it), so the two lists are collected here once instead of drifting
 * out of sync the way `guardrails.ts`'s own module-header bound-disclosure audit warns against for
 * every other multiply-referenced bound in this plugin.
 *
 * Deliberately does NOT also become `get-field-values.ts`'s `FIELD_LOCATIONS` source: that map is
 * field-name -> {family, index} for a small vetted low-cardinality aggregation allowlist, a
 * different shape and a different (pre-existing, out of this workstream's scope) contract with its
 * own tests. This file only ever feeds the escape hatch's own enum/description.
 */

export interface GenericQueryFamily {
  /** The exact index pattern/name sent as `search_wazuh_data`'s `index_pattern` parameter — must
   * also be accepted by `guardrails.ts`'s `checkIndexAllowlist` (asserted by this module's own
   * test) or the enum would offer an option the tool can never actually execute. */
  pattern: string;
  /** Short, user-vocabulary description of what this surface holds — feeds the tool
   * parameter's `description` string, one clause per family. */
  label: string;
}

/**
 * The three families workstream B/earlier phases already opened. Left exactly as they were
 * (including the "v5-*" vs "v5*" spelling `get-field-values.ts` uses for the same indices under a
 * different literal) — changing an already-shipped enum value is a wire-contract change with no
 * benefit here, so this workstream only ever ADDS new entries below, never edits these three.
 */
const ORIGINAL_FAMILIES: GenericQueryFamily[] = [
  {
    pattern: 'wazuh-findings-v5-*',
    label:
      'rule-match findings — the security detections, with wazuh.rule.level/wazuh.rule.mitre/severity',
  },
  {
    pattern: 'wazuh-events-v5-*',
    label: 'all normalized events, matched or not',
  },
  {
    pattern: 'wazuh-states-*',
    label: 'current-state data: vulnerabilities, FIM, SCA, inventory',
  },
];

/**
 * Workstream A1a additions (AI/plan/coverage-validation-design.md — TC-8, G1, MS-6/MS-7, G2, G3,
 * MS-12): every family below has real, live-verified data on `wazuh-aio-5` and no owning typed
 * tool. Each pattern is mirrored 1:1 in `guardrails.ts`'s `INDEX_ALLOWLIST_RE` — see that file's
 * own comment for the live-evidence citation per entry; not repeated here to avoid the two
 * comments drifting out of sync with each other instead of just staying in one place.
 */
const A1A_FAMILIES: GenericQueryFamily[] = [
  {
    pattern: 'wazuh-metrics-*',
    label:
      'plugin/manager operational metrics (communications throughput, agent registration/' +
      'connection counters, log-normalization counters) — NOT security data, use only for ' +
      'fleet-health/comms questions',
  },
  {
    pattern: '.wazuh-cti-consumers',
    label:
      'CTI feed sync status (ruleset/vulnerabilities/iocs feeds: status, local vs. remote offset ' +
      '— "is my threat intel up to date")',
  },
  {
    pattern: '.wazuh-content-manager-jobs',
    label:
      "the CTI content-manager's own sync schedule (catalog sync / telemetry ping jobs)",
  },
  {
    pattern: '.opensearch-sap-*-findings',
    label:
      'Security Analytics detector findings, one index per log type (e.g. wazuh-generic, ' +
      'suricata, apache-http) — distinct from wazuh-findings-v5-*',
  },
  {
    pattern: '.opensearch-sap-pre-packaged-rules-config',
    label:
      'the pre-packaged Sigma detection-rule catalog Security Analytics ships with — fields are ' +
      'nested under rule.* (rule.metadata.title/author, rule.category, rule.level, rule.status, ' +
      'rule.queries.value), NOT document.*',
  },
  {
    pattern: '.opensearch-sap-correlation-metadata',
    label:
      'Security Analytics correlation-engine bookkeeping (root/counter/score state)',
  },
  {
    pattern: '.wazuh-threatintel-vulnerabilities-a',
    label:
      'the raw CTI CVE-record feed (public NVD-derived vulnerability records, not agent state)',
  },
  {
    pattern: 'wazuh-threatintel-enrichments-a',
    label:
      'the IOC enrichment feed (known-malicious domain/hash/IP indicators from third-party threat ' +
      "intel — NOT the customer's own observed network data); the indicator VALUE is " +
      'document.name and its kind is document.type (e.g. hash_sha256, url_domain, connection) — ' +
      "root hash.sha256 is the RECORD'S OWN content hash, not the indicator",
  },
];

/** All families the escape hatch can target, in the fixed order they're presented to the model
 * (original three first, so their long-standing behavior/precedence is unaffected). */
export const GENERIC_QUERY_FAMILIES: GenericQueryFamily[] = [
  ...ORIGINAL_FAMILIES,
  ...A1A_FAMILIES,
];

export const GENERIC_QUERY_INDEX_PATTERNS: string[] =
  GENERIC_QUERY_FAMILIES.map(family => family.pattern);
