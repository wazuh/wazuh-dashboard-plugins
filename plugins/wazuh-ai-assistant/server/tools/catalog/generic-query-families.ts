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
 * SCOPE AMENDMENT (explain-wave phase 6). This file's original note said it deliberately does NOT
 * also feed `get-field-values.ts`'s `FIELD_LOCATIONS`, on the grounds that "which index carries
 * this field" is a different contract from "which families may be named". That separation held for
 * the ORIGINAL three families, and it still holds for them -- but it is exactly what let the
 * `wazuh-states-*` surfaces fail in both places at once (eval run 20260825-211841: an index the
 * enum could not name, whose fields could not be discovered either). The state families therefore
 * now come from ONE shared row set, `../state-families.ts`, which feeds this enum, that map, and
 * `guardrails.ts`'s aggregation allowlist together; see that file's doc comment for why splitting
 * the three lists is what made the gap invisible. Everything else here is unchanged.
 */

import { STATE_FAMILIES, stateFamilyLabel } from '../state-families';

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
    // EXPLAIN-WAVE PHASE 5: the LABEL (not the `pattern`) now names the registry half of FIM
    // explicitly. The invariant above is about the enum VALUE -- that is the wire contract, and it
    // is untouched. This string only ever reaches the model as parameter-description prose, and the
    // bare word "FIM" was reliably read as "the files surface get_fim_files already owns": on eval
    // run 20260825-193632 the model declined two registry questions outright rather than aim this
    // pattern at `wazuh-states-fim-registry-*`, which it has covered since this pattern shipped.
    // The system prompt now carries the full routing rule; this makes the tool's own schema agree
    // with it instead of quietly implying the narrower reading.
    //
    // EXPLAIN-WAVE PHASE 6: the value still ships (wire contract; a caller that has always sent it
    // keeps working), but the label now says what it COSTS. This wildcard fans out over all
    // eighteen state indices at once, and the returned sample is dominated by whichever family has
    // the most documents -- which is why eleven inventory questions on eval run 20260825-211841
    // came back "the fields I asked for were empty" against a corpus that holds them. The
    // per-family patterns below are the answer to that, so this entry's job is now to send the
    // model there.
    label:
      'ALL current-state data at once: vulnerabilities, FIM (both file state and Windows registry ' +
      'keys/values), SCA, inventory. Use a specific wazuh-states-... pattern below whenever you ' +
      'know which surface you need -- this wildcard searches all eighteen state indices together ' +
      'and its sample will be dominated by the largest family, not by the one you asked about; ' +
      'that is the usual reason a correct filter here comes back with the requested fields empty',
  },
];

/**
 * EXPLAIN-WAVE PHASE 6 (eval run 20260825-211841, RESULTS.md "Root cause A"): one enum entry per
 * physical `wazuh-states-*` index, derived from `../state-families.ts` so the enum, the
 * field-discovery route (`get-field-values.ts`'s `FIELD_LOCATIONS`) and the aggregation allowlist
 * (`guardrails.ts`) can never again list a different set of state surfaces from each other.
 *
 * Every pattern is accepted by `checkIndexAllowlist` today with no guardrail change: the existing
 * `INDEX_ALLOWLIST_RE` alternative `^wazuh-(...|states|...)[A-Za-z0-9._*-]*$` already covers every
 * `wazuh-states-`-prefixed name. That is precisely the failure mode this module's header warns
 * about, in its second form -- these indices were ALLOWLISTED all along and simply not
 * ENUMERABLE, so the model could not name one. This module's own test asserts the acceptance
 * rather than trusting the reading.
 */
const STATE_INDEX_FAMILIES: GenericQueryFamily[] = STATE_FAMILIES.map(
  family => ({
    pattern: family.pattern,
    label: stateFamilyLabel(family),
  }),
);

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
 * (original three first, so their long-standing behavior/precedence is unaffected; the per-index
 * state families immediately after the `wazuh-states-*` wildcard they refine, so the model reads
 * the umbrella and its alternatives together). */
export const GENERIC_QUERY_FAMILIES: GenericQueryFamily[] = [
  ...ORIGINAL_FAMILIES,
  ...STATE_INDEX_FAMILIES,
  ...A1A_FAMILIES,
];

export const GENERIC_QUERY_INDEX_PATTERNS: string[] =
  GENERIC_QUERY_FAMILIES.map(family => family.pattern);
