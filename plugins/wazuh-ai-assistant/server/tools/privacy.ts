import { Digest } from './digest';
import { WAZUH_FIELD } from '../../common/wazuh-fields';

/**
 * Privacy mode: reversible pseudonymization at
 * the digest boundary. Everything in this module is pure/stateless-per-instance — no module-level
 * caches — so it is safe to construct fresh per HTTP request (see server/routes/chat.ts).
 *
 * WHAT THE FIELD POLICY DOES AND DOES NOT DO (issue #8821 was filed because this was not written
 * down anywhere, and the behavior reads like a bug until it is):
 *
 * The policy has exactly ONE boundary — what the AI provider receives — and the four actions differ
 * only in how much of a field's value get there:
 *
 * - `allow`: the provider receives the real value, completely unscanned. Also the default for a
 *   field with no entry on a typed catalog tool (the search_wazuh_data escape hatch flips that
 *   default to `anonymize` — see `applyFieldPolicy`'s `isEscapeHatch`). Reserved for CURATED
 *   vocabulary (MITRE technique names, compliance ids, `check.id`, rule tags/category/title) whose
 *   values are not analyst/attacker/third-party-supplied free text — see `scrubKnownEntities`'s doc
 *   comment for why a field carrying free text should be `allow-scan` instead. One documented
 *   exception since issue #8974: the handful of `allow` fields that carry human-authored PROSE
 *   (rule/Sigma titles, rule documentation, custom rule/decoder names) are listed in
 *   `IDENTIFIER_BEARING_FREE_TEXT_FIELDS` and additionally pass the identifier-only known-entity
 *   dictionary scan — their real value still reaches the provider, but a username/hostname the
 *   conversation already pseudonymized is not quoted verbatim inside it.
 * - `allow-scan` (issue #8912): the provider receives the real value, but ONLY after it passes
 *   through both of allow-by-omission's existing scans: the value-shape scan (`prescanAndMint`,
 *   IPs/FQDNs) and the new known-entity dictionary scan (`scrubKnownEntities`, bare identifiers the
 *   pseudonymizer already minted a pseudonym for elsewhere this conversation). For fields whose
 *   value is free text that a third party (not Wazuh's own curated ruleset) controls — e.g. a
 *   package name string reported by the OS — but which the analyst still needs to read in full.
 * - `anonymize`: the provider receives a reversible pseudonym (`HOST_1`, `IP_2`) instead.
 * - `never`: the provider receives NOTHING for that field. `applyFieldPolicy` drops it from the
 *   digest's `samples`, drops its aggregation buckets from `breakdown`, and drops its name from the
 *   `columns` schema hint — so neither the value, nor a pseudonym of it, nor even the fact that the
 *   field exists is sent.
 *
 * What the policy deliberately does NOT touch:
 *
 * - The EXECUTED QUERY. No action rewrites `_source`, the Manager API's `select`, or rejects an
 *   aggregation. The field is always retrieved — it has to be, because the analyst is meant to see it.
 * - Anything LOCAL. The results table (`buildTableSpec`, streamed straight to the browser), the
 *   answer text (server/routes/chat.ts runs every provider delta back through
 *   `StreamDepseudonymizer`, so `HOST_1` becomes the real hostname again before it leaves the server)
 *   and the tool-call panel (emitted with real arguments) all show the analyst their OWN data, in
 *   full, for every action including `never`.
 *
 * So "I set wazuh.agent.name to Never send and the results table still shows it" is the intended
 * behavior, not a leak: that table never left the cluster. The check that matters is what the
 * provider request body carries.
 */

export type FieldPolicyAction = 'allow' | 'allow-scan' | 'anonymize' | 'never';

export interface FieldPolicyEntry {
  /** Either a plain digest field path ("wazuh.agent.name") or a tool-scoped form
   * ("get_agents/name") for Manager-API tools whose digest fields are bare, generic names
   * ("name" means an agent hostname in get_agents but a package name in
   * get_agent_packages — only tool scoping can distinguish them). Scoped entries win over plain
   * ones for their tool. */
  field: string;
  action: FieldPolicyAction;
  /** Optional explicit pseudonym kind, for fields whose name alone can't be classified (a bare
   * "name" infers VAL; a scoped agent-tool entry declares HOST). */
  kind?: PseudonymKind;
}

/** Curated defaults. Every entry targets a valid `wazuh.*`/ECS/WCS field — population is
 * decoder-dependent, so an entry may currently be inert (no matching data) without being wrong. */
export const FIELD_POLICY_DEFAULTS: FieldPolicyEntry[] = [
  { field: WAZUH_FIELD.AGENT_NAME, action: 'anonymize', kind: 'HOST' },
  { field: WAZUH_FIELD.AGENT_IP, action: 'anonymize', kind: 'IP' },
  { field: WAZUH_FIELD.AGENT_ID, action: 'allow' },
  // Manager-API tools carry bare, generic digest field names ("name", "ip") that must be scoped
  // per tool: "name" is an agent hostname here but a package name in get_agent_packages (which
  // must stay readable for the model to be useful).
  { field: 'get_agents/name', action: 'anonymize', kind: 'HOST' },
  { field: 'get_agents/ip', action: 'anonymize', kind: 'IP' },
  // The syscollector/SCA tools use ECS Indexer paths rather than bare tool-scoped names, so the
  // BARE entries below apply — the ECS paths are unambiguous across tools (host.hostname is
  // always a hostname, source.ip always an IP), so tool scoping is not needed. There is no owner
  // field in the process inventory (see get-agent-processes.ts).
  { field: 'host.hostname', action: 'anonymize', kind: 'HOST' },
  { field: 'source.ip', action: 'anonymize', kind: 'IP' },
  { field: 'destination.ip', action: 'anonymize', kind: 'IP' },
  { field: 'source.user.name', action: 'anonymize', kind: 'USER' },
  { field: 'destination.user.name', action: 'anonymize', kind: 'USER' },
  { field: 'process.command_line', action: 'anonymize', kind: 'VAL' },
  { field: 'file.owner', action: 'anonymize', kind: 'USER' },
  // Curated rule taxonomy / MITRE catalog / compliance requirements on findings-v5: not
  // analyst/attacker-supplied — reviewed 'allow'.
  { field: WAZUH_FIELD.RULE_TAGS, action: 'allow' },
  { field: WAZUH_FIELD.RULE_CATEGORY, action: 'allow' },
  // Explicit entry added for #8889: wazuh.rule.title is in every finding-hits tool's sample
  // columns (catalog/common.ts's STANDARD_FINDING_SAMPLE_COLUMNS) but previously had no policy
  // entry at all, so it reached the provider through allow-by-omission rather than an intentional
  // decision. Reviewed 'allow', not 'anonymize': the overwhelming majority of titles are fixed
  // strings from Wazuh's own curated ruleset — the model needs the real text to name/describe a
  // finding, and anonymizing this high-cardinality field would replace nearly every distinct
  // finding's label with its own opaque VAL_n, gutting the assistant's usefulness (the same
  // tradeoff already made for rule.category/rule.tags above). The residual risk is real, not
  // hypothetical, though: a LOCAL/custom rule's <description> can interpolate a decoder capture
  // group (e.g. "Failed login from $(srcip)"), so a title CAN echo attacker-influenced log
  // content, unlike the closed-vocabulary rule.category/rule.tags. That is not left unaddressed —
  // it is covered at a different layer: chat.ts's scrubMessagesForProvider runs
  // prescanAndMintToolContent over every tool-result string value (this one included) before it
  // reaches the provider, so an embedded IP/FQDN in a custom title is still pseudonymized there.
  //
  // Issue #8974 UPDATE — the dotless part of that residual is no longer accepted. A title carrying
  // a bare USERNAME ("Successful user authentication - vagrant") was verified on the wire reaching
  // the provider verbatim, precisely because a dotless identifier has no shape for the scan above to
  // match. This field is now a member of `IDENTIFIER_BEARING_FREE_TEXT_FIELDS`: the action stays
  // 'allow' (the value is still sent readable — the tradeoff above is unchanged), but the value now
  // also passes the identifier-only known-entity dictionary scan, so an identifier this conversation
  // already minted a pseudonym for is replaced instead of quoted. What REMAINS a residual: an
  // identifier that is both dotless AND never seen in any pseudonymized field anywhere in the
  // conversation — there is no pseudonym to reuse and this file never mints from a prose field. See
  // `IDENTIFIER_BEARING_FREE_TEXT_FIELDS` and `premintProseScanIdentifiers`.
  { field: WAZUH_FIELD.RULE_TITLE, action: 'allow' },
  // Wildcard covers every compliance framework (pci_dss, hipaa, gdpr, iso_27001, nis2,
  // nist_800_171, nist_800_53, fedramp, cmmc, tsc, ...), not just the one this plugin has a
  // dedicated tool for — all are curated requirement-tag lists, equally not
  // analyst/attacker-supplied.
  { field: 'wazuh.rule.compliance.*', action: 'allow' },
  { field: WAZUH_FIELD.RULE_MITRE_TECHNIQUE_ID, action: 'allow' },
  { field: WAZUH_FIELD.RULE_MITRE_TECHNIQUE_NAME, action: 'allow' },
  { field: WAZUH_FIELD.RULE_MITRE_TACTIC, action: 'allow' },
  { field: WAZUH_FIELD.RULE_MITRE_TACTIC_NAME, action: 'allow' },
  // Hotfix A0 (AI/plan/qa-rules-decoders-rootcause.md, defect #4): get_rules/
  // get_threat_intel_components newly surface document.metadata.description (mapped `text`,
  // populated on every rule/decoder/integration/policy/kvdb doc) so "what does rule/decoder X
  // detect" is answerable at all -- previously the field was omitted from both tools' `_source`
  // entirely, so the model had no way to answer that question from the ruleset. Reviewed 'allow',
  // same reasoning and same residual-risk mitigation as WAZUH_FIELD.RULE_TITLE above: this is
  // Wazuh's own curated Sigma/pipeline documentation text, not analyst/attacker-supplied data, and
  // anonymizing it would replace every rule/decoder's actual explanation with an opaque VAL_n,
  // gutting the one thing this fix exists to enable. The residual risk (a LOCAL/custom rule's
  // description CAN in principle embed a decoder capture group or free text) is the same shape as
  // rule.title's, and is covered the same way: chat.ts's scrubMessagesForProvider runs
  // prescanAndMintToolContent over every tool-result string value before it reaches the provider --
  // plus, since issue #8974, the identifier-only dictionary scan every member of
  // `IDENTIFIER_BEARING_FREE_TEXT_FIELDS` now gets (this field is one; see rule.title's note above
  // for exactly which part of the residual that closes and which part stays).
  { field: 'document.metadata.description', action: 'allow' },
  // Curated benchmark/policy content (CIS etc.), not analyst/attacker-supplied — reviewed 'allow'.
  { field: 'check.id', action: 'allow' },
  { field: 'check.name', action: 'allow' },
  { field: 'check.result', action: 'allow' },
  // Workstream D (coverage doc CV-054): get_sca_checks now also samples check.rationale/
  // check.remediation into the digest (previously row-expander-only, see get-sca-checks.ts) --
  // same curated-benchmark/policy-content class as check.id/name/result above (CIS/benchmark
  // authored text describing WHY a check exists and WHAT to do about a failure), not
  // analyst/attacker-supplied. Reviewed 'allow' for the identical reason.
  //
  // Issue #8974 CORRECTION to the "not analyst-supplied" claim on these four (`check.name`,
  // `check.rationale`, `check.remediation`, `policy.name`): it holds for every SHIPPED policy, which
  // is vendor benchmark content, but Wazuh supports CUSTOM SCA POLICIES -- and a custom check's
  // name/rationale/remediation is free text an administrator writes, so it CAN quote a real path,
  // hostname or account ("verify /home/jsmith is 0700", "ask dbprod07's owner"). These four are
  // deliberately still NOT members of `IDENTIFIER_BEARING_FREE_TEXT_FIELDS`, and that is a bounded
  // TRADE-OFF, not a safety claim: they are the longest, most sentence-like values any tool returns
  // and reading them verbatim is the entire point of get_sca_checks, so adding the dictionary scan
  // here buys a narrow custom-policy case at the cost of a much wider prose-corruption surface. The
  // residual is documented in issue #8974's closing notes rather than silently dropped. Revisit if
  // custom SCA policies become common in the field.
  { field: 'check.rationale', action: 'allow' },
  { field: 'check.remediation', action: 'allow' },
  { field: 'policy.name', action: 'allow' },
  // get_sca_results/name is deliberately NOT anonymized: a policy name is what the analyst asked
  // about, and known mapped identifiers embedded in free text (e.g. a hostname inside a cmd path)
  // are still caught by the outbound applyToText scrub in chat.ts.
  { field: 'vulnerability.score.base', action: 'allow' },
  { field: 'package.architecture', action: 'allow' },
  // get_agent_inventory (issue: "Consolidate agent inventory into one tool") reads
  // wazuh-states-inventory-* and sets `failClosedFieldPolicy: true` (issue #8917 -- see
  // `ToolDefinition.failClosedFieldPolicy`'s doc comment, types.ts), which flips applyFieldPolicy's
  // unlisted-field default from allow-by-omission to fail-closed anonymize (the same "any finding
  // field" protection search_wazuh_data's escape hatch needed -- see this file's header doc
  // comment on `isEscapeHatch`). The four deleted single-purpose tools it replaced never needed
  // explicit entries for these because they had no such flag, so allow-by-omission
  // covered them silently; folding them into this tool means every field that should
  // stay readable now needs its own explicit 'allow' entry below, or it silently starts arriving
  // at the provider as a VAL_n pseudonym -- making "what packages are installed on X" answer in
  // meaningless pseudonyms under privacy mode. Each entry below is software/config IDENTITY, not a
  // personal or infrastructure identifier -- the contrast with the fields that correctly stay
  // anonymized (host.hostname, process.command_line, source.ip/destination.ip,
  // source.user.name/destination.user.name -- all already listed above) is deliberate and must not
  // be widened without the same scrutiny.
  // #8912: a package name is free text SUPPLIED BY THE THIRD-PARTY VENDOR/PACKAGE MAINTAINER (not
  // Wazuh's own curated ruleset, unlike rule.category/rule.tags/rule.title above), so it can
  // legitimately (if rarely) embed an identifier — e.g. a vendor build that stamps a customer's own
  // hostname into a bundled package's display name. 'allow-scan' keeps the value readable (still
  // needed verbatim for "what packages are installed" to be useful) while running it through the
  // same shape scan allow-by-omission fields get PLUS a dictionary lookup against every real
  // identifier this conversation's pseudonymizer has already minted (see `scrubKnownEntities`) —
  // catching a bare, dotless identifier the shape scan alone cannot.
  { field: 'package.name', action: 'allow-scan' },
  { field: 'package.version', action: 'allow' },
  { field: 'package.type', action: 'allow' },
  // The vulnerability scanner's own fix-bound sentence ("Package less than 5.21.4") -- written by
  // Wazuh's scanner from CTI data, never analyst/attacker-supplied. Surfaced (2026-08-14) so the
  // model can state the fixed version instead of offering an update check no tool can perform.
  { field: 'vulnerability.scanner.condition', action: 'allow' },
  // NOT 'allow', unlike package.name/architecture/type/version above: a vendor/distributor string
  // ("Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>", "Debian Sysadmin Team
  // <debian-admin@lists.debian.org>") routinely embeds a maintainer/team EMAIL ADDRESS -- personal
  // contact information, not software identity, and the one field in this deriveColumns group that
  // actually needs review rather than a rubber-stamp 'allow'. This repo has no `allow-scan` action
  // yet (issue #8912, branch fix/8912-privacy-allow-scan(-v2), not merged as of this fix) that
  // could keep the distributor NAME readable while still catching the embedded address the way
  // package.name does there for a bundled hostname -- with only allow/anonymize/never available
  // today, 'anonymize' is the only choice that does not ship a real email address to the provider.
  // This ALSO makes explicit (rather than accidental) the protection get_agent_inventory's
  // deriveColumns fail-closed default already applied here silently: before this entry existed,
  // field-policy-coverage.test.ts treated `package.vendor` as "covered" purely because it sat in
  // that test's KNOWN_SAFE_STRUCTURAL_FIELDS allowlist (a structural-shape guess, never a reviewed
  // privacy decision) -- which said nothing about what the runtime actually does with an unlisted
  // field on a deriveColumns tool, and would have silently stopped protecting this field the
  // moment it was ever read by a non-deriveColumns tool (allow-by-omission there means real value,
  // untouched). See field-policy-coverage.test.ts's `requireExplicitEntry` for the coverage-test
  // fix that closed that gap. #8912 landed (merged as #8933), so this is now the 'allow-scan'
  // that comment promised: the distributor name ("Ubuntu Developers") stays readable while the
  // embedded address/FQDN (the <...@lists.ubuntu.com> part) is caught by the value-shape scan.
  { field: 'package.vendor', action: 'allow-scan' },
  // A hotfix/KB identifier (e.g. "KB5034441"), not a person or a network address.
  { field: 'package.hotfix.name', action: 'allow' },
  // OS identity -- NOT host.hostname (above), which is the agent's network identity and stays
  // anonymized.
  { field: 'host.os.name', action: 'allow' },
  { field: 'host.os.version', action: 'allow' },
  { field: 'host.os.platform', action: 'allow' },
  // A running program's name -- NOT process.command_line (above), which can carry user-supplied
  // paths/arguments (a username in a home directory path, a secret passed as a CLI flag) and must
  // keep being anonymized.
  { field: 'process.name', action: 'allow' },
  // Kernel process-state code (a closed enum, not an identifier) -- added for issue #8920 item
  // 1's get_agent_inventory "processes" SYNTHETIC breakdown (digest.breakdownDimensions, which
  // groups returned rows and so needs no aggregation-mapping evidence -- see
  // get-agent-inventory.ts's InventoryKindConfig doc comment). Without this entry,
  // deriveColumns:true's fail-closed default (see this file's header doc comment on
  // `isEscapeHatch`) would pseudonymize the breakdown's bucket keys into meaningless VAL_n,
  // making "how many processes are running vs zombie" unanswerable under privacy mode.
  // interface.state/network.transport/check.result (the fields newly added to guardrails.ts's
  // AGG_FIELD_ALLOWLIST for the same issue) already have 'allow' entries in this list.
  { field: 'process.state', action: 'allow' },
  // Open-port inventory mechanics (protocol, listen state, the two bare port numbers) -- NOT
  // source.ip/destination.ip (above), which correctly stay anonymized: a port number alone
  // identifies nothing without the IP it's paired with.
  { field: 'network.transport', action: 'allow' },
  { field: 'interface.state', action: 'allow' },
  { field: 'source.port', action: 'allow' },
  { field: 'destination.port', action: 'allow' },
  // get_events_by_agent reads the same wazuh.agent.* fields as the findings tools above (already
  // covered by WAZUH_FIELD.AGENT_NAME/AGENT_ID), plus its own ECS event taxonomy fields.
  { field: 'event.category', action: 'allow' },
  { field: 'event.action', action: 'allow' },
  { field: 'event.outcome', action: 'allow' },

  // --- Workstream A1a (AI/plan/coverage-validation-design.md) -------------------------------
  // Every family below is newly reachable through `search_wazuh_data` (guardrails.ts's
  // `INDEX_ALLOWLIST_RE`, widened by this workstream) and that tool sets `deriveColumns: true` +
  // `failClosedFieldPolicy: true` -- an unlisted field there is FAIL-CLOSED anonymized (the
  // opposite default from a typed tool's allow-by-omission), so every field an analyst should
  // actually be able to read needs a REAL entry here, not just a "looks harmless" structural
  // guess. See `field-policy-coverage.test.ts`'s `requireExplicitEntry` for why the test enforces
  // exactly this distinction.
  //
  // A GENUINE MECHANISM LIMIT, surfaced rather than worked around: `FieldPolicyEntry.field` is
  // either a bare digest path or a `tool/field` SCOPED path -- there is no INDEX/FAMILY scope.
  // `search_wazuh_data` is the one tool that queries every family below (and every
  // pre-existing one), so a bare entry here is NOT scoped to "this field on this family" the way
  // a typed tool's own fixed `_source` list is -- it is scoped to "this exact field NAME, on
  // whatever family the model happened to query this turn". Every entry below was checked against
  // this constraint before being added: the field NAME itself is either (a) a `wazuh.*`-namespaced
  // dotted path unique to the family it was verified on (no other reachable family uses the same
  // literal), or (b) a bare, undotted top-level key.
  //
  // P-1 (AI/plan/a1a-review.md): the (b) bare-name entries below were originally justified with the
  // claim "no existing WCS schema ever exposes a personal-shaped field bare at a document's root" --
  // that claim is FALSE as stated (live-verified: `.ds-wazuh-events-v5-security-000001`'s root leaves
  // include `message` (the raw log line), `related` (ECS `related.ip`/`related.user`), and `url` (an
  // observed URL) -- all bare, all customer data). The narrower claim that actually holds, and the
  // one this file's safety depends on, is the COLLISION claim: none of the 19 bare names below is
  // itself the SAME literal as a bare root leaf of any customer-data family (`wazuh-states-*`,
  // `wazuh-events-v5-*`, `wazuh-findings-v5-*`) -- live-verified for every one of them against
  // `wazuh-states-inventory-users` (whose personal field is `user.name`, never a bare `name`) and
  // every other reachable customer-data index. `field-policy-no-bare-collision.test.ts` pins this as
  // a regression: it asserts no bare (dotless) `FIELD_POLICY_DEFAULTS` entry appears in a hardcoded
  // list of real customer-family root leaves, so the next bare entry added here re-derives a claim
  // that is actually checked, not one that merely reads true. The CTI/content-manager/Security-
  // Analytics documents classified below are the ONLY reachable surfaces that use bare root-level
  // keys at all today, which is exactly why a bare entry for them cannot silently widen to cover a
  // WCS personal field of the same bare name -- no such WCS field exists among the ones checked.
  // Fields that could NOT be cleared this way (ambiguous, or a value shape the reviewer could not
  // confidently call safe) are left OFF this list on purpose -- fail-closed anonymize is the correct
  // outcome for those, not an oversight; see the two "DELIBERATELY NOT LISTED" notes below.

  // wazuh-metrics-agents (live-verified mapping, `wazuh-aio-5`): agent registration/connection
  // telemetry. `wazuh.agent.id`/`.name`/`.host.ip` already have entries above (same literals,
  // same field on this family too). The rest below are NEW literals only this family carries.
  { field: 'wazuh.agent.register.ip', action: 'anonymize', kind: 'IP' },
  // OS identity (name/platform/full/version, one wildcard) -- same class and same 'allow'
  // decision as the pre-existing bare `host.os.name`/`.platform` entries above, just on the
  // POPULATED `wazuh.agent.host.os.*` path this family (and findings/events, per guardrails.ts's
  // AGG_FIELD_ALLOWLIST comment) actually carries.
  { field: 'wazuh.agent.host.os.*', action: 'allow' },
  { field: 'wazuh.agent.host.architecture', action: 'allow' },
  // Admin-defined agent-group tag list -- same class as `policy.name`/`check.name` above
  // (admin/vendor taxonomy, not analyst/attacker-supplied).
  { field: 'wazuh.agent.groups', action: 'allow' },
  // Closed enum (active/disconnected/pending/never_connected) + its paired numeric code, not an
  // identifier.
  { field: 'wazuh.agent.status', action: 'allow' },
  { field: 'wazuh.agent.status_code', action: 'allow' },
  { field: 'wazuh.agent.version', action: 'allow' },
  // Timestamps -- same class as the already-'allow' bare `timestamp`/`@timestamp`.
  { field: 'wazuh.agent.last_seen', action: 'allow' },
  { field: 'wazuh.agent.registered_at', action: 'allow' },
  { field: 'wazuh.agent.disconnected_at', action: 'allow' },
  // Config-sync checksums/flags -- an MD5 of the agent's own config payload, not an identifier of
  // a person or network address.
  { field: 'wazuh.agent.config.hash.md5', action: 'allow' },
  { field: 'wazuh.agent.config.group.hash.md5', action: 'allow' },
  { field: 'wazuh.agent.config.group.synced', action: 'allow' },

  // wazuh-metrics-comms / wazuh-metrics-agents / wazuh-metrics-normalization (shared fields):
  // manager cluster identity -- admin-configured infra naming (e.g. "wazuh"), not a person or a
  // network address; same class as `policy.name`/`document.name` above, not `host.hostname`.
  { field: 'wazuh.cluster.*', action: 'allow' },
  { field: 'wazuh.schema.version', action: 'allow' },
  // wazuh-metrics-normalization: tenant/space label (admin-configured), and the ECS event/metric
  // taxonomy fields describing WHICH counter a document is, not any analyst/attacker data.
  { field: 'wazuh.space.name', action: 'allow' },
  { field: 'event.module', action: 'allow' },
  { field: 'event.kind', action: 'allow' },
  { field: 'metric.name', action: 'allow' },
  { field: 'metric.type', action: 'allow' },

  // .wazuh-cti-consumers / .wazuh-content-manager-jobs (CTI freshness status, coverage doc
  // MS-6/MS-7): every field is written by the content-manager service itself describing ITS OWN
  // sync state/schedule -- never analyst- or attacker-supplied, and (per the mechanism-limit note
  // above) these bare root-level keys cannot collide with any WCS-schema field of the same name.
  // P-6 (AI/plan/a1a-review.md): `resource` is a full vendor API URL and `context` a tenant/
  // context id -- vendor-side today (the SaaS CTI backend), but at a customer running a PRIVATE
  // CTI mirror `resource` would carry an INTERNAL hostname, and this is 'allow' (unscanned at the
  // digest boundary; the outbound shape scan in chat.ts still applies to it, same residual as
  // every other 'allow' entry above). Accepted as low-risk today because no such deployment mode
  // exists yet -- revisit if/when a private-mirror CTI backend ships.
  //
  // Issue #8974 UPDATE: `resource`/`context` are now members of
  // `IDENTIFIER_BEARING_FREE_TEXT_FIELDS`, so the private-mirror case above no longer rests on "that
  // deployment mode does not exist yet". Both stay 'allow' and fully readable, but an internal
  // hostname inside `resource` that this conversation already pseudonymized is replaced instead of
  // sent bare -- which is exactly the leak the private-mirror concession anticipated. `name` is left
  // OUT: on these two CTI families it is a consumer/job identifier written by the content-manager
  // service, and the bare literal `name` is deliberately kept as narrow as possible (see the
  // bare-name collision note above).
  { field: 'name', action: 'allow' },
  { field: 'context', action: 'allow' },
  { field: 'resource', action: 'allow' },
  { field: 'status', action: 'allow' },
  { field: 'is_public', action: 'allow' },
  { field: 'local_offset', action: 'allow' },
  { field: 'remote_offset', action: 'allow' },
  { field: 'job_type', action: 'allow' },
  { field: 'enabled', action: 'allow' },
  // `type` is DELIBERATELY NOT LISTED here even though it appears on both CTI documents (a
  // consumer-type enum) and would otherwise pass the same "bare root key, WCS never uses it bare"
  // reasoning: `.opensearch-sap-correlation-metadata`'s own `type` usage was not verified in this
  // pass (its one sampled live doc did not populate it), and a later family reachable through this
  // same escape hatch could plausibly use a bare `type` for something less clearly safe. Left
  // fail-closed (anonymized) rather than guessed -- the CTI-specific need ("what type of consumer
  // is this") is already answerable from `name`/`context` above without it.

  // .opensearch-sap-*-findings (per-log-type Security Analytics findings, coverage doc G2):
  // detector/finding bookkeeping -- monitor identity and cross-references to the underlying
  // event/finding docs.
  //
  // Issue #8974 correction: the original comment here claimed this family is "never analyst/attacker
  // free text". That is WRONG for `monitor_name` -- a detector's monitor name is typed by whoever
  // CREATED the detector, so a customer-created detector routinely carries an operator-chosen name
  // ("dbprod07 brute force", "jsmith audit"). The id/cross-reference fields around it (`monitor_id`,
  // `execution_id`, `related_doc_ids`, `correlated_doc_ids`) genuinely are machine-generated and the
  // original claim holds for them. `monitor_name` is therefore a member of
  // `IDENTIFIER_BEARING_FREE_TEXT_FIELDS`: still 'allow' and readable (an analyst must be able to
  // name the detector that fired), but scanned against the identifiers this conversation has already
  // pseudonymized.
  { field: 'monitor_id', action: 'allow' },
  { field: 'monitor_name', action: 'allow' },
  { field: 'execution_id', action: 'allow' },
  { field: 'related_doc_ids', action: 'allow' },
  { field: 'correlated_doc_ids', action: 'allow' },
  // The finding's own compiled Sigma-derived query template/tags -- vendor-curated pipeline
  // content, same class and same 'allow' decision as `document.metadata.description` above (a
  // LOCAL rule's title/description can echo attacker-influenced content in principle, and the
  // same outbound `scrubMessagesForProvider` scan documented on that entry covers this one too).
  //
  // Issue #8974: `queries.name` and `queries.query` are members of
  // `IDENTIFIER_BEARING_FREE_TEXT_FIELDS` -- this entry's own comment already puts them in the same
  // class as `document.metadata.description`, and a stored query BODY additionally embeds literal
  // field values its author pasted in ("source.user.name: jsmith"), which is the most direct way a
  // customer identifier can appear here. `queries.id`/`queries.tags`/`queries.query_field_names`
  // stay out: an id is machine-generated, and tags/field-name lists are closed vocabularies (a
  // field NAME, never a field value).
  //
  // ACCEPTED RESIDUAL on the query BODY specifically: the dictionary scan's boundary rule treats a
  // hyphen as a token boundary and matches case-insensitively (both deliberate -- see
  // `scrubKnownEntities`), so a hyphen-glued VENDOR literal inside a query can be rewritten when an
  // account happens to share one of its segments: with a real account named `sysmon`,
  // `"Microsoft-Windows-Sysmon/Operational"` becomes `"Microsoft-Windows-USER_n/Operational"`. The
  // query stays syntactically valid (a pseudonym is a plain token), and in a live session the model
  // never sees a broken channel name in its own answer because the inbound reversal restores it --
  // but the model reasons over the masked form for that turn, and a PERSISTED digest keeps the masked
  // form. Judged clearly preferable to shipping a real account name: the loss is one vendor channel
  // literal reading oddly, not a wrong answer about the customer's data.
  { field: 'queries.id', action: 'allow' },
  { field: 'queries.name', action: 'allow' },
  { field: 'queries.query', action: 'allow' },
  { field: 'queries.tags', action: 'allow' },
  { field: 'queries.query_field_names', action: 'allow' },

  // .opensearch-sap-pre-packaged-rules-config (coverage doc G3): P-4 (AI/plan/a1a-review.md) --
  // this index does NOT share `document.metadata.*` at all. Live mapping root is a single object,
  // `rule`: real paths are `rule.metadata.title/author/date/modified/references`, `rule.category`,
  // `rule.level`, `rule.status`, `rule.queries[].value`, `rule.document.id`, `rule.space`. The
  // original `document.metadata.*`/`document.id`/`document.space` entries below matched nothing on
  // this family, so every string in the Sigma catalog arrived as an opaque `VAL_n` under privacy
  // mode -- G3 was NOT actually closed for that mode despite the family being enum/allowlist
  // reachable. `.opensearch-sap-detectors-config` DOES share the `document.metadata.*` shape
  // `document.metadata.description` above already covers (verified separately), so that family is
  // unaffected by this correction.
  // `rule.metadata.title` is a Sigma rule's own authored title -- same human-authored-prose class as
  // `wazuh.rule.title`/`document.metadata.description` above, so it is a member of
  // `IDENTIFIER_BEARING_FREE_TEXT_FIELDS` too (issue #8974): still 'allow' and still readable, but
  // scanned against the identifiers this conversation already pseudonymized.
  { field: 'rule.metadata.title', action: 'allow' },
  { field: 'rule.metadata.author', action: 'allow' },
  { field: 'rule.metadata.date', action: 'allow' },
  { field: 'rule.metadata.modified', action: 'allow' },
  { field: 'rule.metadata.references', action: 'allow' },
  { field: 'rule.category', action: 'allow' },
  { field: 'rule.level', action: 'allow' },
  { field: 'rule.status', action: 'allow' },
  // A Sigma rule's compiled query value -- same reasoning as `queries.query` above and a member of
  // `IDENTIFIER_BEARING_FREE_TEXT_FIELDS` for the same reason (issue #8974): the query body carries
  // literal field VALUES, so a custom rule's query can quote a real account or hostname.
  { field: 'rule.queries.value', action: 'allow' },
  { field: 'rule.document.id', action: 'allow' },
  { field: 'rule.space', action: 'allow' },

  // .opensearch-sap-correlation-metadata (coverage doc MS-12): internal correlation-engine
  // bookkeeping (a running score counter and cross-references to the two findings being
  // correlated) -- `finding1`/`finding2` hold finding/document IDs, same class as
  // `related_doc_ids` above, not free text.
  { field: 'root', action: 'allow' },
  { field: 'counter', action: 'allow' },
  { field: 'finding1', action: 'allow' },
  { field: 'finding2', action: 'allow' },
  { field: 'logType', action: 'allow' },

  // .wazuh-threatintel-vulnerabilities-a (raw CTI CVE feed) / wazuh-threatintel-enrichments-a (IOC
  // enrichment feed) -- coverage doc TC-8. Both are THIRD-PARTY THREAT-INTEL CATALOG DATA: public
  // CVE records and known-malicious-indicator records. The privacy boundary this whole file exists
  // to enforce protects the CUSTOMER's own observed data (their hosts/users/IPs) from reaching the
  // provider un-pseudonymized -- these two families are the mirror image, vendor/community
  // threat-intel content ABOUT the outside world, not about the customer's environment, so a
  // domain/hash/IP value here identifies KNOWN-MALICIOUS PUBLIC INFRASTRUCTURE, never the
  // customer's own network (contrast with `source.ip`/`destination.ip` above, which DO need
  // anonymizing because those values come from the customer's own traffic).
  { field: 'document.cveMetadata.cveId', action: 'allow' },
  { field: 'document.cveMetadata.assignerShortName', action: 'allow' },
  { field: 'document.cveMetadata.state', action: 'allow' },
  { field: 'document.dataType', action: 'allow' },
  { field: 'document.dataVersion', action: 'allow' },
  // Indicator identity/metadata: a domain, hash, or IP string, but of a THIRD-PARTY indicator, not
  // the customer's own address space -- see the family-level reasoning above.
  //
  // P-3 (AI/plan/a1a-review.md): this literal is NOT unique to the two threat-intel families named
  // above -- `get_threat_intel_components.ts` reads the exact same `document.name` on
  // `wazuh-threatintel-{rules,decoders,kvdbs,filters,integrations}-a`, which are the indices a
  // CUSTOMER'S OWN custom rules/decoders/KVDBs land in (before this branch that field was
  // fail-closed-anonymized there, on the escape hatch). Deliberately kept 'allow' rather than
  // downgraded to 'allow-scan': the enrichments/vulnerabilities family above NEEDS the raw
  // domain/hash/IP indicator value verbatim (the whole point of that tool), and 'allow-scan' would
  // pseudonymize exactly that value whenever it happens to be FQDN/IP-shaped -- which a real
  // indicator name usually is. The accepted residual for the rules/decoders/kvdbs family: on this
  // VM `document.name` is unpopulated on `rules-a` (`space.name: "standard"`, all vendor content
  // today), and even a populated custom name containing an FQDN/IP is still caught by the outbound
  // `scrubMessagesForProvider`/`prescanAndMintToolContent` shape scan in chat.ts -- the same
  // dotless-identifier residual class already accepted for `wazuh.rule.title` and
  // `document.metadata.description` above, not a new gap this branch introduces.
  //
  // Issue #8974 UPDATE: that dotless class is now narrowed here too. This field joins
  // `IDENTIFIER_BEARING_FREE_TEXT_FIELDS`, which adds ONLY the identifier-only dictionary scan and
  // deliberately NOT the shape scan -- so the "keep a third-party FQDN/IP-shaped indicator verbatim"
  // decision argued above is preserved exactly, while a custom rule/decoder/KVDB name that quotes an
  // identifier this conversation already pseudonymized no longer reaches the provider bare.
  { field: 'document.name', action: 'allow' },
  { field: 'document.provider', action: 'allow' },
  { field: 'document.type', action: 'allow' },
  { field: 'document.tags', action: 'allow' },
  { field: 'document.feed.name', action: 'allow' },
  // P-4 (AI/plan/a1a-review.md): the branch's original entries were the bare `software.name`/
  // `.type`/`.alias`, which match nothing on a real enrichment document -- the field is nested
  // under `document.software.*` (verified in a sampled live doc), not a top-level `software`
  // object. Corrected to the real paths so these three actually resolve instead of silently never
  // firing (the bare, unmatched entries were previously harmless-but-dead weight in this list).
  { field: 'document.software.name', action: 'allow' },
  { field: 'document.software.type', action: 'allow' },
  { field: 'document.software.alias', action: 'allow' },
  { field: 'hash.sha256', action: 'allow' },
  // `document.reference`/rejection-reason free text is DELIBERATELY NOT LISTED: a CVE record's
  // `containers.cna.rejectedReasons[].value` is analyst-authored free text from the CVE assigning
  // body, not a closed vocabulary -- left fail-closed (anonymized) rather than assumed safe, same
  // "too risky to classify confidently" call as `type` above.
  //
  // Workstream A1b (get-cve-intel.ts) deliberately adds NO entries here for
  // `document.containers.cna.descriptions/metrics/affected`: those paths never reach
  // `applyFieldPolicy` at all -- `get-cve-intel.ts`'s `resolveParams` reads them directly via the
  // opensearch client (bypassing the typed-tool digest/table path entirely, since `document` is
  // mapped `enabled: false` on this index and is therefore never in any tool's declared
  // `_source`/`sampleColumns`) and folds a plain-language SUMMARY into `Digest.assumptionNote`, a
  // freeform string, not a field-keyed digest row. That string still passes through chat.ts's
  // generic `prescanAndMintToolContent` JSON-value scan (the same residual-risk mitigation every
  // 'allow' entry above relies on) -- an entry in THIS list would be inert documentation-debt,
  // since `applyFieldPolicy`'s per-field lookup is never consulted for it.
];

export type PseudonymKind = 'HOST' | 'IP' | 'USER' | 'URL' | 'VAL';

const PSEUDONYM_KINDS: PseudonymKind[] = ['HOST', 'IP', 'USER', 'URL', 'VAL'];

/** One client-held (or server-minted) pseudonym mapping entry; the wire shape of `privacy.map`
 * on the chat request body and of the `privacy_map` SSE event's `entries` (see common/types.ts). */
export interface PseudonymEntry {
  value: string;
  pseudonym: string;
}

/** Splits a field name into lowercase word tokens on '.', '_', '-', and camelCase boundaries —
 * e.g. "data.srcuser" -> ["data","srcuser"] (no internal boundary inside "srcuser"), "GeoLocation"
 * -> ["geo","location"], "country_name" -> ["country","name"]. Used by `inferPseudonymKind` so a
 * keyword match is checked against a whole TOKEN (or a token's own prefix/suffix), never against
 * an arbitrary substring floating in the middle of an unrelated word. */
function fieldNameTokens(field: string): string[] {
  return field
    .split(/[.\-_]+/)
    .flatMap(segment => segment.split(/(?<=[a-z0-9])(?=[A-Z])/))
    .map(token => token.toLowerCase())
    .filter(token => token.length > 0);
}

/** True when `keyword` occupies the WHOLE of `token`, or is glued to it as a prefix/suffix with no
 * delimiter in between (e.g. "srcip"/"dstip" end with "ip", "clientuser" ends with "user") — but
 * NOT when it merely appears somewhere in the middle, which is what let 'wazuh.rule.description'
 * misclassify as an IP field before this fix (`'description'.includes('ip')` is true — "descr-IP-
 * tion" — because raw substring search has no concept of a word boundary). */
function tokenMatchesKeyword(token: string, keyword: string): boolean {
  return (
    token === keyword || token.startsWith(keyword) || token.endsWith(keyword)
  );
}

/** Infers which pseudonym kind a field name should mint, from the field name alone ("kind
 * inferred from field name"). Checked in this order so a field matching more than one heuristic
 * (there are none in FIELD_POLICY_DEFAULTS today) resolves predictably; falls back to the generic
 * `VAL` kind for a field that is none of host/ip/user/url.
 *
 * Matches on whole tokens (see `fieldNameTokens`/`tokenMatchesKeyword`), not a raw substring of
 * the entire field string — the previous `lower.includes('ip')` style check flagged any field
 * whose name merely *contained* "ip" as a substring, e.g. 'wazuh.rule.description' ("descr-IP-
 * tion") or 'recipient', misclassifying them as IP fields and making the model narrate their
 * (actually opaque, unrelated-kind) pseudonym tokens as literal IP addresses. Compound field names
 * with no delimiter (e.g. legacy Wazuh alert fields like "data.srcip"/"data.srcuser") still match,
 * because the keyword only needs to be a prefix/suffix of a token, not the whole token. */
export function inferPseudonymKind(field: string): PseudonymKind {
  const tokens = fieldNameTokens(field);
  const hasKeyword = (keyword: string) =>
    tokens.some(token => tokenMatchesKeyword(token, keyword));
  if (hasKeyword('url')) {
    return 'URL';
  }
  if (hasKeyword('ip')) {
    return 'IP';
  }
  if (hasKeyword('user')) {
    return 'USER';
  }
  if (hasKeyword('hostname')) {
    return 'HOST';
  }
  // A field path's LAST '.'-delimited segment being the bare word "name" is this repo's
  // hostname-alias convention (e.g. "wazuh.agent.name") — deliberately an exact match on the
  // final PATH segment (split only on '.', unlike the token check above) so a within-segment
  // compound like "country_name" (a place name, not a host) is not swept in; only a path
  // structurally ending in ".name" is.
  const pathSegments = field.split('.');
  if (pathSegments[pathSegments.length - 1].toLowerCase() === 'name') {
    return 'HOST';
  }
  return 'VAL';
}

/** Matches a complete minted pseudonym token, e.g. "HOST_3". Word-boundary anchored so a real
 * value that merely contains "HOST_3" as a substring of a longer token is not falsely reversed. */
const PSEUDONYM_TOKEN_RE = /^(HOST|IP|USER|URL|VAL)_(\d+)$/;

/** Every prefix of every kind keyword (e.g. "H", "HO", "HOS", "HOST" for HOST), used by
 * StreamDepseudonymizer below to recognize a pseudonym token that may still be arriving split
 * across two provider deltas. */
const KIND_PREFIXES: string[] = PSEUDONYM_KINDS.flatMap(kind =>
  Array.from({ length: kind.length }, (_, i) => kind.slice(0, i + 1)),
);

/** F4: sets `obj[key] = value` as an own DATA property via `Object.defineProperty`, rather than a
 * plain bracket assignment. `JSON.parse` can hand back `"__proto__"` as a perfectly ordinary own
 * key of a parsed object (a tool result, a user-controlled JSON blob) — a plain `obj[key] = value`
 * for that one key does not create a property at all: it runs `Object.prototype`'s `__proto__`
 * setter instead, silently dropping `value` AND rewriting `obj`'s prototype out from under every
 * caller that later reads it. `Object.defineProperty` always defines an own property directly,
 * bypassing any inherited accessor, so a `"__proto__"` key behaves exactly like any other string
 * key here. Shared by every place in this file that rebuilds an object key-by-key from
 * caller/attacker-controlled JSON: `deepMapStrings`, `prescanAndMintToolContent`'s `scanValues`,
 * and `deepScrubContainer`. */
function setOwnProperty(
  obj: Record<string, unknown>,
  key: string,
  value: unknown,
): void {
  Object.defineProperty(obj, key, {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  });
}

/** Deep-maps every string leaf of a JSON-like value through `mapFn`; objects/arrays are rebuilt,
 * everything else (number/boolean/null/undefined) passes through unchanged. Shared by
 * `Pseudonymizer.applyToObject` (real -> pseudonym, for outbound tool-call argument scrubbing) and
 * `.reverseObject` (pseudonym -> real, for inbound tool-call argument reversal).
 *
 * Exported (replay-leak fix) so `chat.ts`'s `scrubMessagesForProvider` can run the SAME shape-scan
 * function (`prescanAndMint`) over every string leaf of a tool call's `arguments` that the `user`/
 * `tool`/`assistant` content branches already run over their own content, rather than relying
 * solely on `Pseudonymizer.applyToObject`'s map-substitution (a no-op against an empty/stale map —
 * see that call site's doc comment for the full scenario this closes). */
export function deepMapStrings(
  value: unknown,
  mapFn: (text: string) => string,
): unknown {
  if (typeof value === 'string') {
    return mapFn(value);
  }
  if (Array.isArray(value)) {
    return value.map(item => deepMapStrings(item, mapFn));
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(
      value as Record<string, unknown>,
    )) {
      setOwnProperty(out, key, deepMapStrings(nested, mapFn));
    }
    return out;
  }
  return value;
}

/** Escapes every regex metacharacter in `value` so it can be embedded literally inside a
 * dynamically-built `RegExp`, because a raw attacker/data-controlled value cannot be interpolated
 * into a regex source without first escaping it. Two callers below need it: `Pseudonymizer
 * .applyToText`, which (unlike a plain `split`/`join`) must express a word-boundary condition, and
 * `scrubKnownEntities`, which needs actual regex features (case insensitivity, `\b`-style boundary
 * lookarounds) that only a real `RegExp` gives it. */
function escapeRegExpLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Per-request pseudonymizer (a stateless, conversation-scoped map): the map itself is
 * client-held across turns (the chat request body's `privacy.map`, common/types.ts's
 * `ChatRequest['privacy']`) and this class is only ever constructed fresh per HTTP request in
 * server/routes/chat.ts's `orchestrate` — never cached at module scope, per the
 * "no module-level conversation caches" constraint.
 */
export class Pseudonymizer {
  private readonly valueToPseudonym = new Map<string, string>();
  private readonly pseudonymToValue = new Map<string, string>();
  private readonly counters: Record<PseudonymKind, number> = {
    HOST: 0,
    IP: 0,
    USER: 0,
    URL: 0,
    VAL: 0,
  };
  /** Entries minted THIS request only (not the seeded ones) — see `newEntries()`. */
  private readonly minted: PseudonymEntry[] = [];

  constructor(seed: PseudonymEntry[] = []) {
    for (const entry of seed) {
      if (
        !entry ||
        typeof entry.value !== 'string' ||
        typeof entry.pseudonym !== 'string'
      ) {
        continue;
      }
      if (this.valueToPseudonym.has(entry.value)) {
        continue;
      }
      this.valueToPseudonym.set(entry.value, entry.pseudonym);
      this.pseudonymToValue.set(entry.pseudonym, entry.value);
      const match = PSEUDONYM_TOKEN_RE.exec(entry.pseudonym);
      if (match) {
        const kind = match[1] as PseudonymKind;
        const counter = Number(match[2]);
        if (counter > this.counters[kind]) {
          this.counters[kind] = counter;
        }
      }
    }
  }

  /** Returns the existing pseudonym for `value` if one was already seeded/minted, else mints a
   * new `KIND_n` one (n = the running count of that kind + 1) and records it in `newEntries()`. */
  pseudonymize(value: string, kind: PseudonymKind = 'VAL'): string {
    if (!value) {
      return value;
    }
    const existing = this.valueToPseudonym.get(value);
    if (existing) {
      return existing;
    }
    this.counters[kind] += 1;
    const pseudonym = `${kind}_${this.counters[kind]}`;
    this.valueToPseudonym.set(value, pseudonym);
    this.pseudonymToValue.set(pseudonym, value);
    this.minted.push({ value, pseudonym });
    return pseudonym;
  }

  /** Entries minted during this request (i.e. NOT present in the seed map passed to the
   * constructor) — streamed to the client once per turn via the `privacy_map` SSE event so its
   * client-held map stays in sync for the next turn. */
  newEntries(): PseudonymEntry[] {
    return this.minted.slice();
  }

  /**
   * Replaces every known REAL value with its pseudonym, longest-value-first so a shorter value
   * that happens to be a substring of a longer one (e.g. "10.0.0.1" inside "10.0.0.10") is never
   * substituted first and left corrupting the longer value.
   *
   * #8916: a value is only ever replaced as a WHOLE token, never as a substring embedded inside a
   * larger alphanumeric run — observed live: the word "ubuntu" (pseudonymized to "VAL_2" from an
   * earlier `host.os.platform` value) turned the unrelated package version "7.81.0-1ubuntu1.14"
   * into "7.81.0-1VAL_21.14". A "boundary" here is any NON-ALPHANUMERIC character (or start/end of
   * string) — deliberately NOT the conventional regex `\b` (which treats "_" as a word character):
   * real identifiers routinely embed "-"/"_" as separators (e.g. "mysql-server-DBPRIMARY03"), and
   * requiring only an actual alphanumeric neighbor to disqualify a match means a "-"/"_"-glued
   * compound identifier still matches as a whole token, exactly like a space- or
   * punctuation-delimited one. Embedded IP/FQDN values minted by `prescanAndMint`'s shape scan are
   * unaffected by this tightening: they were already matched (and therefore already delimited) as
   * whole tokens by their own `\b`-anchored regexes before ever reaching this map, so they still
   * satisfy this boundary check here — this only ever REJECTS matches the previous plain
   * `split`/`join` wrongly accepted, never one it correctly accepted.
   *
   * This now needs a real `RegExp` (to express the boundary condition) instead of the previous
   * plain `split`/`join` — every value is escaped first via `escapeRegExpLiteral` since values
   * here are attacker/data-controlled text, never safe to interpolate into a regex source
   * unescaped. An empty value is skipped outright: an empty pattern's zero-width match would
   * otherwise insert a pseudonym at every non-alphanumeric-adjacent position in the text.
   */
  applyToText(text: string): string {
    if (!text || this.valueToPseudonym.size === 0) {
      return text;
    }
    const values = [...this.valueToPseudonym.keys()].sort(
      (a, b) => b.length - a.length,
    );
    let out = text;
    for (const value of values) {
      if (!value || !out.includes(value)) {
        continue;
      }
      const pattern = new RegExp(
        `(?<![A-Za-z0-9])${escapeRegExpLiteral(value)}(?![A-Za-z0-9])`,
        'g',
      );
      out = out.replace(pattern, this.valueToPseudonym.get(value) as string);
    }
    return out;
  }

  /** Deep-maps every string value of a JSON-like structure (e.g. a tool call's `arguments`)
   * through `applyToText`. */
  applyToObject<T>(value: T): T {
    return deepMapStrings(value, text => this.applyToText(text)) as T;
  }

  /** Read-only snapshot of every REAL value this pseudonymizer currently holds a mapping for
   * (seeded + minted so far this request) — the "known-entity dictionary" `scrubKnownEntities`
   * scans against. Deliberately returns a fresh array (not a live view) so a caller can't mutate
   * the pseudonymizer's internal maps through it. */
  knownEntities(): PseudonymEntry[] {
    return [...this.valueToPseudonym.entries()].map(([value, pseudonym]) => ({
      value,
      pseudonym,
    }));
  }

  /** Replaces every complete `KIND_n` pseudonym token with its real value. Word-boundary anchored
   * (`\b...\b`) since pseudonyms are synthetic ASCII tokens with no special regex characters —
   * unlike `applyToText`, a real regex is safe and appropriate here. Unknown/stale tokens (no
   * matching real value — should not happen for a self-consistent map) pass through unchanged. */
  reverseText(text: string): string {
    if (!text || this.pseudonymToValue.size === 0) {
      return text;
    }
    return text.replace(
      /\b(?:HOST|IP|USER|URL|VAL)_\d+\b/g,
      match => this.pseudonymToValue.get(match) ?? match,
    );
  }

  /** Deep-maps every string value of a JSON-like structure through `reverseText` (e.g. a model-
   * emitted tool call's `arguments`, which may echo a pseudonym like "HOST_1" as a parameter). */
  reverseObject<T>(value: T): T {
    return deepMapStrings(value, text => this.reverseText(text)) as T;
  }
}

/** Generous upper bound on any minted pseudonym token's rendered length ("HOST_9999" is 9 chars)
 * — the streaming holdback margin below. Deliberately loose rather than tied to a real cardinality
 * limit: the cost of a few extra held-back characters is nil, and a token split across two SSE
 * frames would otherwise reach the browser unreversed. */
const HOLDBACK_CHARS = 16;

/** Matches an in-progress pseudonym token at the very end of a string: any prefix of a kind
 * keyword ("H", "HO", ... "HOST"), optionally followed by "_" and any digits so far. Used to pull
 * the flush cut point back before such a tail so a token split across two provider deltas is never
 * partially flushed. Deliberately loose (a real word ending in, say, "...val" also matches) — a
 * false positive only delays flushing by a few characters until more text disambiguates it; it can
 * never cause a token to be split. */
const PARTIAL_PSEUDONYM_TAIL_RE = new RegExp(
  `(?:${KIND_PREFIXES.slice()
    .sort((a, b) => b.length - a.length)
    .join('|')})(?:_\\d*)?$`,
);

/**
 * Streaming-safe de-pseudonymizer for one adapter delta stream ("de-pseudonymize delta
 * streams before yielding"). A pseudonym token can arrive split across two `delta` events (e.g.
 * "...HOS" then "T_1 is up"), so raw per-chunk `reverseText` would corrupt it. This buffers a
 * trailing margin of text and only reverses+emits the portion that is definitely not the start of
 * a still-forming token; `flush()` must be called once the underlying stream ends (before
 * 'done'/'error'/'tool_call' — see server/routes/chat.ts's orchestrate loop) to emit the remainder.
 *
 * Scoped to ONE adapter.chatStream call (i.e. recreated every orchestration round): the pseudonym
 * MAP itself (the `Pseudonymizer` passed in) lives for the whole turn, but each round's delta
 * stream is a fresh sequence that must be fully flushed before the round ends.
 */
export class StreamDepseudonymizer {
  private buffer = '';

  constructor(private readonly pseudonymizer: Pseudonymizer) {}

  /** Feeds one delta chunk; returns the portion now safe to emit (already de-pseudonymized), or
   * '' if nothing can be safely released yet. */
  push(chunk: string): string {
    this.buffer += chunk;
    if (this.buffer.length <= HOLDBACK_CHARS) {
      return '';
    }
    let cut = this.buffer.length - HOLDBACK_CHARS;
    const candidate = this.buffer.slice(0, cut);
    const tailMatch = PARTIAL_PSEUDONYM_TAIL_RE.exec(candidate);
    if (tailMatch) {
      cut = tailMatch.index;
    }
    if (cut <= 0) {
      return '';
    }
    const toFlush = this.buffer.slice(0, cut);
    this.buffer = this.buffer.slice(cut);
    return this.pseudonymizer.reverseText(toFlush);
  }

  /** Flushes and de-pseudonymizes whatever remains buffered. Idempotent-safe to call once more
   * after the stream has already ended (returns ''). */
  flush(): string {
    if (!this.buffer) {
      return '';
    }
    const rest = this.pseudonymizer.reverseText(this.buffer);
    this.buffer = '';
    return rest;
  }
}

/** Matches one dotted-quad IPv4 address (each octet 0-255). `\b`-anchored so this only ever
 * captures the WHOLE token — it can't start/end mid-digit-run of a longer number. */
const IPV4_TOKEN_RE =
  /\b(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}\b/g;

/** Matches one IPv6 address in any of its standard textual forms (full 8-group, `::`-compressed at
 * any position, or a lone `::`). Every alternative requires at least two colons, so it can never
 * match a single `key:value`-shaped token. Known limitation (kept simple/conservative, same spirit
 * as the FQDN note below): an IPv4-mapped IPv6 literal (`::ffff:192.168.1.1`) is not matched as one
 * token — its embedded IPv4 suffix is still caught by `IPV4_TOKEN_RE` above, just not the `::ffff:`
 * prefix around it. */
const IPV6_TOKEN_RE = new RegExp(
  '\\b(?:' +
    '(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}|' +
    '(?:[A-Fa-f0-9]{1,4}:){1,7}:|' +
    '(?:[A-Fa-f0-9]{1,4}:){1,6}:[A-Fa-f0-9]{1,4}|' +
    '(?:[A-Fa-f0-9]{1,4}:){1,5}(?::[A-Fa-f0-9]{1,4}){1,2}|' +
    '(?:[A-Fa-f0-9]{1,4}:){1,4}(?::[A-Fa-f0-9]{1,4}){1,3}|' +
    '(?:[A-Fa-f0-9]{1,4}:){1,3}(?::[A-Fa-f0-9]{1,4}){1,4}|' +
    '(?:[A-Fa-f0-9]{1,4}:){1,2}(?::[A-Fa-f0-9]{1,4}){1,5}|' +
    '[A-Fa-f0-9]{1,4}:(?:(?::[A-Fa-f0-9]{1,4}){1,6})|' +
    ':(?:(?::[A-Fa-f0-9]{1,4}){1,7}|:)' +
    ')\\b',
  'g',
);

/** One hostname label (RFC 1123-ish: alnum, may contain internal hyphens, 1-63 chars). Shared by
 * `FQDN_TOKEN_RE` below. */
const HOSTNAME_LABEL_SRC = '[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?';

/** Matches `label.label[.label]+` — i.e. requires AT LEAST ONE dot, so a bare single-word hostname
 * ("webserver") is deliberately never matched here (documented limitation: see
 * `prescanAndMint`'s doc comment — the digest-boundary field policy still catches those once they
 * appear in a tool result field like `wazuh.agent.name`). `\b`-anchored on both ends so a trailing
 * sentence period is never swept into the match. */
const FQDN_TOKEN_RE = new RegExp(
  `\\b${HOSTNAME_LABEL_SRC}(?:\\.${HOSTNAME_LABEL_SRC})+\\b`,
  'g',
);

/** A dotted token that is clearly not a hostname: all-numeric (a version string "1.2.3", a plain
 * decimal "3.14", or a malformed/out-of-range numeric run that slipped past the stricter
 * `IPV4_TOKEN_RE`), optionally with a trailing "Z" — the `seconds.millisZ` fragment of an
 * ISO-8601 timestamp ("...T21:59:29.000Z"), whose `29.000Z` tail is otherwise a valid
 * two-label FQDN shape. `prescanAndMint` leaves these untouched. */
const ALL_NUMERIC_DOTTED_RE = /^[0-9.]+Z?$/;

/**
 * A dotted token shaped like a package/software version string, covering the FULL Debian/RPM
 * version grammar rather than the narrower "digit-only labels" shape: an optional leading "v"
 * (semver-style, "v1.2.3"), an all-digit FIRST label, then one-or-more subsequent dot-labels each
 * STARTING with a digit but allowed to carry letters after it (so "118ubuntu5", "1ubuntu2",
 * "1k", "9p1" all count as one label each), and an optional final "-revision" suffix that may
 * itself carry dots and MORE hyphens ("-213.224", and the kernel family's "-91-generic"/
 * "-150-lowlatency" — a second hyphen is the single most common version shape in Wazuh Linux
 * inventory, via agent.os.kernel/linux-image packages). `prescanAndMint` leaves these untouched —
 * minting a HOST_n for a version string undermines a `package.version:{allow}`-style query the
 * user is asking about. Tokens containing "+"/"~" never reach this regex at all (the tokenizer
 * splits at them) — see `FULL_COMPOUND_VERSION_RE` below for how those are handled.
 *
 * (#8920 item 8): the previous digits-only-label shape rejected "3.118ubuntu5" and
 * "3.20191218.1ubuntu2.3" — real `dpkg -l` versions with letters fused directly into a dot-label,
 * no leading "-" — so they fell through to `FQDN_TOKEN_RE` and were minted as HOST_n. Rather than
 * add those two shapes as special cases, the discriminator is rewritten as the STRUCTURAL property
 * above, which covers the grammar by construction instead of by enumeration.
 *
 * Hostname-safety proof (why loosening this can only ever REDUCE minting, never open a leak): this
 * regex is only ever consulted, inside `prescanAndMint`'s FQDN pass, for a token that already
 * matched `FQDN_TOKEN_RE` — i.e. something already shaped like `label.label[.label]+`. A token is
 * excluded from minting here ONLY when its first label is all-digit AND every subsequent label
 * begins with a digit. Any genuine FQDN fails that test: a public hostname's last label is an
 * alphabetic TLD ("...corp", "...com", "...local"), and an internal hostname's leading label is
 * essentially always letter-initial ("web1.corp", "backup-vault.internal.corp") or, in the rarer
 * case where it isn't ("01server.corp.local", "3com.example.com"), still carries a letter WITHIN
 * that same first label — which fails "first label all-digit" outright, since this is a per-label
 * structural check, not a "starts with a digit" check. The residue that IS excluded (first label
 * pure digits, every later label digit-initial) is a shape no real deployment uses as a hostname;
 * a token of that shape is indistinguishable from a version string by any test that only looks
 * at the token itself. The accepted tradeoff for that pathological residue is fidelity, not
 * privacy: worst case a version-shaped string is (correctly) never minted, never that a real
 * hostname is missed.
 *
 * KNOWN, DELIBERATE RESIDUE (recorded so it is not mistaken for an oversight): a version label
 * that starts with a LETTER after a dot — RPM dist tags fused into the version ("4.6.3.el7"),
 * pre-release labels ("2.0.rc1", "4.0.dev0", "1.0.beta3") — is still minted, because loosening
 * "every later label digit-initial" to accept letter-initial labels would stop minting real
 * FQDNs whose first label is all-numeric: "0.pool.ntp.org", "1.gravatar.com",
 * "2.bp.blogspot.com", "10.corp.local" are common, real hostnames of exactly that shape. That
 * direction is a privacy regression, so this residue is NOT closable at the token level; the
 * hostname corpus in privacy.test.ts pins those FQDNs as always-minting to keep it that way.
 * (Debian policy only constrains the FIRST character of an upstream version, so those residual
 * shapes are legal versions — the coverage here is structural-but-not-total, by choice.) */
const VERSION_LIKE_TOKEN_RE =
  /^v?\d+(?:\.\d[0-9A-Za-z]*)+(?:-[0-9A-Za-z.-]+)?$/i;

/** Characters a whole (whitespace/quote-delimited) package-version token may carry — used by
 * `expandToFullToken` to grow an FQDN sub-match back to the full token the tokenizer split.
 * Includes "+"/"~" (Debian revision separators, at which FQDN_TOKEN_RE splits) and ":" (epoch,
 * "1:2.4.41-4+deb11u1"). */
const VERSION_TOKEN_CHAR_RE = /[0-9A-Za-z.+~:-]/;

/**
 * The WHOLE-token version test for compound Debian/RPM versions that FQDN_TOKEN_RE splits at
 * "+"/"~": "2.4.37-43.module+el8.5.0+1022+b541f3b1" yields the FQDN-shaped sub-token "el8.5.0",
 * "1.0+git20200101.abc1234-1" yields "git20200101.abc1234-1", "0.9.8+really0.9.7-1" yields
 * "really0.9.7-1" — every one previously minted as HOST_n, corrupting the very version value a
 * `package.version:{allow}` query is about. The rule: when the FULL surrounding token (a) is
 * strictly larger than the FQDN match, (b) contains a "+" or "~" (the separators that caused the
 * split — this is the load-bearing restriction), and (c) starts like a version (`v?` + digit)
 * and stays within the version charset, the sub-token is part of a version string, not a
 * hostname. Requiring (b) is what keeps "1.gravatar.com"/"0.pool.ntp.org" minting: they contain
 * no "+"/"~", so they never take this path — only a hostname GLUED to a version by a "+"/"~"
 * (no real naming scheme does this) could ever be skipped, and that direction is fidelity, not
 * privacy. */
const FULL_COMPOUND_VERSION_RE = /^v?\d[0-9A-Za-z.+~:-]*$/i;

/** Grows the FQDN match at `offset` (length `length`) in `text` to the full surrounding token of
 * version-charset characters — see `FULL_COMPOUND_VERSION_RE`. */
function expandToFullToken(
  text: string,
  offset: number,
  length: number,
): string {
  let start = offset;
  while (start > 0 && VERSION_TOKEN_CHAR_RE.test(text[start - 1])) {
    start -= 1;
  }
  let end = offset + length;
  while (end < text.length && VERSION_TOKEN_CHAR_RE.test(text[end])) {
    end += 1;
  }
  return text.slice(start, end);
}

/** A dotted token shaped like a MITRE ATT&CK technique id with sub-technique notation
 * ("T1059.001", "T1548.002.001" would also match) — `prescanAndMint` leaves these untouched.
 * Without this exclusion the FQDN pass mints them as HOST_n ("T1059" and "001" are both legal
 * hostname labels), which destroys exactly the exact-vs-sub-technique breakdown issue #8920
 * item 2's rollup disclosure depends on: the model would receive breakdown keys like
 * {key: "T1059", ...}, {key: "HOST_1", ...} and could no longer report the split. Safety
 * argument for the narrowing: the shape requires an initial label of "T" + digits ONLY and
 * every subsequent label all-digits — a real FQDN needs an alphabetic TLD, so the only hostname
 * this could ever skip is an internal name like "T123.456" (all-numeric final label), which is
 * exotic enough to accept in exchange for not corrupting every sub-technique id the digest
 * carries. The field-policy side already classifies the field itself as 'allow'
 * (WAZUH_FIELD.RULE_MITRE_TECHNIQUE_ID above); this closes the OUTBOUND free-text/JSON scan
 * that runs after it. */
const TECHNIQUE_ID_TOKEN_RE = /^T\d+(?:\.\d+)+$/;

/** Every dot-path SEGMENT word appearing in a curated Wazuh/ECS field name — drawn from
 * `WAZUH_FIELD`'s values and every plain field in `FIELD_POLICY_DEFAULTS` (a tool-scope
 * "toolName/" prefix and the trailing ".*" wildcard are stripped first, since those aren't part of
 * the path itself), all lowercased. Self-updating: a field added to either source is automatically
 * recognized here — no separate list to hand-maintain. Used by `isFieldPathToken` below. */
const FIELD_PATH_WORDS: ReadonlySet<string> = new Set(
  [
    ...Object.values(WAZUH_FIELD),
    ...FIELD_POLICY_DEFAULTS.map(entry => entry.field),
  ]
    .map(field => field.split('/').pop() as string) // drop a "toolName/" scoping prefix, if any
    .flatMap(field => field.replace(/\.\*$/, '').split('.'))
    .map(segment => segment.toLowerCase())
    .filter(segment => segment.length > 0),
);

/** True when every '.'-separated segment of `token` is a known field-path word (see
 * `FIELD_PATH_WORDS`) — i.e. `token` reads as the user NAMING A FIELD (e.g. typing
 * "wazuh.agent.name" or "wazuh.rule.id" into their own question), not an actual hostname.
 * Deliberately requires ALL segments to match, not just one: a real hostname composed entirely of
 * words that also happen to be field-path vocabulary is exotic enough to accept the (favorable)
 * tradeoff of never mangling a user's own field-path mention into a broken HOST_n token. */
function isFieldPathToken(token: string): boolean {
  return token
    .split('.')
    .every(segment => FIELD_PATH_WORDS.has(segment.toLowerCase()));
}

/**
 * First-mention pre-scan: mints a pseudonym for every IPv4/IPv6 address
 * and dotted-hostname (FQDN) token found in `text`, using the SAME `pseudonymizer` instance the
 * rest of the request uses — so these newly-minted entries are indistinguishable, from
 * `newEntries()`/`privacy_map` SSE emission's point of view, from ones seeded by the client or
 * minted by `applyFieldPolicy` on a digest. This exists because `applyToText`/`applyFieldPolicy`
 * can only replace a value they already have a MAPPING for; an IP or hostname typed by the analyst
 * in their own words (or echoed back verbatim inside a tool-error string) has no such mapping on
 * its first appearance and would otherwise reach the provider real-valued on that first send.
 *
 * Scan order matters and is fixed: IPv4, then IPv6, then FQDN — an IPv4 octet run must be minted
 * (and thus removed from the text) before the FQDN pass runs, or a bare IP could otherwise be
 * mis-read as a dotted hostname and minted with the wrong `kind`.
 *
 * The FQDN pass additionally excludes (in order checked): an all-numeric dotted run or ISO
 * timestamp fragment (`ALL_NUMERIC_DOTTED_RE`, pre-existing), a version/package-revision string
 * (`VERSION_LIKE_TOKEN_RE` — e.g. "5.2.5-2ubuntu1" would otherwise undermine a
 * `package.version:{allow}` query), a MITRE sub-technique id (`TECHNIQUE_ID_TOKEN_RE` — e.g.
 * "T1059.001", whose minting would corrupt the technique breakdown the rollup disclosure
 * depends on), and a field-path-shaped token (`isFieldPathToken` — e.g. the
 * user typing "wazuh.agent.name"/"wazuh.rule.id" would otherwise get that mention replaced with a
 * HOST_n, breaking their own query and making the model claim the field doesn't exist).
 *
 * Deliberately conservative (documented limitation): a bare
 * single-word hostname ("webserver", no dot) is NEVER matched — only `label.label[...]` forms are,
 * to avoid pseudonymizing ordinary prose words. A bare-word hostname is still caught later, once it
 * appears in a typed digest field, by the existing field-policy scrub in `applyFieldPolicy` (e.g.
 * `wazuh.agent.name`) — this pre-scan only closes the gap for the analyst's own
 * free-text wording and for hostnames/IPs surfacing in untyped free text (e.g. a tool's `message`).
 */
export function prescanAndMint(
  text: string,
  pseudonymizer: Pseudonymizer,
): string {
  if (!text) {
    return text;
  }
  let out = text.replace(IPV4_TOKEN_RE, token =>
    pseudonymizer.pseudonymize(token, 'IP'),
  );
  out = out.replace(IPV6_TOKEN_RE, token =>
    pseudonymizer.pseudonymize(token, 'IP'),
  );
  out = out.replace(FQDN_TOKEN_RE, (token, offset: number, subject: string) => {
    if (
      ALL_NUMERIC_DOTTED_RE.test(token) ||
      VERSION_LIKE_TOKEN_RE.test(token) ||
      TECHNIQUE_ID_TOKEN_RE.test(token) ||
      isFieldPathToken(token)
    ) {
      return token;
    }
    // Compound-version residue: the tokenizer splits at "+"/"~", so a Debian/RPM compound
    // version yields FQDN-shaped fragments ("el8.5.0", "git20200101.abc1234-1") the per-token
    // regex above can never see whole. Test the FULL surrounding token instead — see
    // FULL_COMPOUND_VERSION_RE's doc comment for the rule and its hostname-safety argument.
    const fullToken = expandToFullToken(subject, offset, token.length);
    if (
      fullToken !== token &&
      /[+~]/.test(fullToken) &&
      FULL_COMPOUND_VERSION_RE.test(fullToken)
    ) {
      return token;
    }
    return pseudonymizer.pseudonymize(token, 'HOST');
  });
  return out;
}

/**
 * JSON-aware variant of `prescanAndMint` for `role:'tool'` message content — which is normally a
 * serialized digest whose KEYS are dotted `wazuh.*` field paths ("wazuh.agent.name",
 * "wazuh.rule.mitre.technique.id"). Running the flat text scan over that JSON would match those keys as
 * FQDN-shaped tokens and mint garbage HOST_n pseudonyms for FIELD NAMES (corrupting the digest's
 * keys and polluting the client-held map). This variant parses the JSON and scans only STRING
 * VALUES — keys are never touched — then re-serializes (JSON.stringify preserves key order, so a
 * digest with no scannable values round-trips byte-identical). Content that is not valid JSON
 * (e.g. a plain-text tool error string, exactly what the pre-scan exists to protect) falls back
 * to the flat text scan unchanged.
 *
 * The digest's `columns` array is passed through UNSCANNED: its entries are schema-hint field
 * PATHS (e.g. "wazuh.agent.name"), not data — the same labels `applyFieldPolicy` deliberately
 * leaves untouched — and are FQDN-shaped, so scanning them would mint the same garbage HOST_n
 * this fix exists to prevent.
 *
 * `metrics` is likewise unscanned: its `value` is a computed NUMBER, its `agg` is the
 * aggregation's own (model-chosen) name, and its `value_as_string` is OpenSearch's own date/
 * number formatting of that numeric value (a min/max on a date field) — never indexed
 * hostnames/IPs. Scanning `value_as_string` would misfire: the "00.000Z" tail of an ISO
 * timestamp is FQDN-token-shaped and would be minted as a garbage HOST_n, corrupting the one
 * human-readable form the field exists to carry. See digest.ts's `Digest.metrics` doc comment.
 */
const UNSCANNED_DIGEST_KEYS = new Set(['columns', 'metrics']);

export function prescanAndMintToolContent(
  text: string,
  pseudonymizer: Pseudonymizer,
): string {
  if (!text) {
    return text;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return prescanAndMint(text, pseudonymizer);
  }
  if (parsed === null || typeof parsed !== 'object') {
    // A JSON scalar (e.g. a bare quoted string) — scan its text form like any other free text.
    return prescanAndMint(text, pseudonymizer);
  }
  const scanValues = (node: unknown): unknown => {
    if (typeof node === 'string') {
      return prescanAndMint(node, pseudonymizer);
    }
    if (Array.isArray(node)) {
      return node.map(scanValues);
    }
    if (node !== null && typeof node === 'object') {
      const out: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(node)) {
        setOwnProperty(
          out,
          key,
          UNSCANNED_DIGEST_KEYS.has(key) ? value : scanValues(value),
        );
      }
      return out;
    }
    return node;
  };
  return JSON.stringify(scanValues(parsed));
}

/**
 * Known-entity dictionary scan (issue #8912): replaces every EXACT, word-boundary occurrence of an
 * already-minted real identifier in `text` with its EXISTING pseudonym — never minting a new one.
 *
 * WHY shape-scanning cannot close this by construction: `prescanAndMint`'s IPv4/IPv6/FQDN regexes
 * only match values that look like an address or a dotted hostname on their face. A bare, dotless
 * identifier — an agent name typed without its domain suffix, a short internal codename, a hostname
 * style like "DBPRIMARY03" — has no distinguishing shape at all; to a regex it is just another word,
 * indistinguishable from ordinary prose. The only thing that CAN single it out is having already
 * seen it minted somewhere else in this same conversation (an agent digest field, a prior turn's
 * `wazuh.agent.name`, etc.) — i.e. the pseudonymizer's own map. That is what this function scans
 * against, via `Pseudonymizer.knownEntities()`.
 *
 * This is therefore a STRICTLY NARROWER guarantee than the shape scan: an identifier NEVER seen
 * elsewhere in the conversation (no existing mapping to reuse) still passes through unscrubbed —
 * there being nothing to reuse and this function being explicitly forbidden from minting a fresh
 * pseudonym for a dictionary hit (that would let a free-text field silently start inventing
 * HOST_n/USER_n tokens for values no other part of the digest ever classified as that kind). The
 * residual (documented, not silently accepted) risk is exactly this: a value that is BOTH shapeless
 * AND never minted anywhere else. See privacy.test.ts's "unknown identifier" case for the explicit
 * test of that limitation.
 *
 * Boundary rule: a "boundary" is any NON-alphanumeric character (or start/end of string) — NOT the
 * conventional regex `\b` (which treats `_` as a word character). Real identifiers routinely embed
 * `-`/`_` as separators (`mysql-server-DBPRIMARY03-config`, `db_primary_03`), and a naive `\b...\b`
 * match would either fail to isolate the identifier inside such a compound token, or (worse, with
 * `_` specifically) refuse to treat `foo_DBPRIMARY03_bar` as containing a boundary at all. Using
 * `(?<![A-Za-z0-9])` / `(?![A-Za-z0-9])` lookarounds instead means only actual alphanumeric
 * characters count as "part of the same token" — a `-` or `_` immediately beside the identifier is
 * always a valid boundary, matching how `mysql-server-DBPRIMARY03-config` should scrub to
 * `mysql-server-{PSEUDONYM}-config`. The flip side (an intentional, accepted trade-off, same spirit
 * as `applyToText`'s longest-first ordering below): this also means a known identifier that is
 * merely a substring of a LARGER alphanumeric run (e.g. known value "host1" inside the single token
 * "host12") correctly does NOT match, because "2" is alphanumeric and therefore not a boundary.
 *
 * Case-insensitive: a provider/tool result may re-render an identifier in different casing
 * (`DBPRIMARY03` vs `dbprimary03`) from where it was first minted; both must resolve to the SAME
 * existing pseudonym for the map to stay conversation-consistent (see the class-level `pseudonymize`
 * doc comment on `Pseudonymizer` — reuse, never a second mint for the same real entity).
 *
 * Longest-known-value-first, for the same reason as `Pseudonymizer.applyToText`: a shorter known
 * value that happens to be a boundary-delimited PREFIX/SUFFIX chunk of a longer known value (e.g.
 * "DB03" and "DB03-PRIMARY" both minted) must not have the shorter one's replacement corrupt the
 * longer one's match.
 *
 * F1/F2 (adversarial validation of #8912's fix): the ONLY filter this function used to apply was
 * `entry.value.length > 0` — every string this request's pseudonymizer had EVER minted a pseudonym
 * for became a search-and-replace target over arbitrary text, including a user's own question. The
 * escape hatch's fail-closed default (`isEscapeHatch`, `scrubFieldValue` branch 4) pseudonymizes
 * every unlisted STRING field on `search_wazuh_data`, so the dictionary routinely contains ordinary
 * English words — live-reproduced: "Which Ubuntu agents are critical? root cause please" became
 * "Which VAL_2 agents are VAL_3? USER_4 cause please" once "ubuntu"/"critical"/"root" had each been
 * minted (as VAL/VAL/USER respectively) from unrelated fields earlier in the conversation. A second,
 * same-root-cause failure (F2): a minted single-character/short value (e.g. a bare "1") can match
 * INSIDE an already-inserted pseudonym token itself ("HOST_1" contains "1" preceded by the
 * non-alphanumeric "_", which this function's own boundary rule already treats as a valid boundary
 * — see the boundary-rule paragraph above), corrupting a token the depseudonymizer can no longer
 * reverse.
 *
 * `identifiersOnly` is set by the two PROSE call sites — `chat.ts`'s `scrubMessagesForProvider` (the
 * user's own typed text) and, since issue #8974, `scrubFieldValue`'s
 * `IDENTIFIER_BEARING_FREE_TEXT_FIELDS` branch (an `allow` field whose value is human-authored prose:
 * a rule title, a rule description, a custom rule/decoder name). The tool-VALUE call sites,
 * `scrubFieldValue`'s `allow-scan` branch and `deepScrubContainer`, pass no options and keep today's
 * allow-scan behavior unchanged, since a curated `allow-scan` field's value is a single identifier-
 * ish token, not a sentence, and already has a real field-policy decision behind it. The flag
 * restricts the dictionary to entries that both:
 *
 * 1. carry a pseudonym of kind IP/HOST/USER — `inferPseudonymKind`'s only kinds that are ever
 *    recoverable at reasonable confidence from a bare token in prose; VAL/URL are excluded because
 *    VAL is this file's catch-all "no better kind inferred" bucket (exactly what an ordinary noun
 *    like "critical" gets minted as under the escape hatch's fail-closed default), and
 * 2. pass `looksLikeIdentifierValue` — not a length/shape floor (that was tried first and
 *    regressed the NF-1 threat model this branch exists to close — see that function's doc
 *    comment for why), but a short curated stop-list of common words/placeholders that are
 *    plausible real minted USER/HOST values (a real "root" or "admin" account exists on plenty of
 *    systems) but corrupt ordinary prose far more often than they protect anything.
 *
 * Combined, this matches every NF-1 scenario value (`dbprod07`, `DBPRIMARY03`, `db-primary-03`,
 * `jsmith`) AND every SHORT real identifier a user might legitimately retype off a results table
 * (`jdoe`, `bob`, `titan`) while leaving `ubuntu`/`critical` (VAL-kind, excluded by the kind check)
 * and `root`/`admin`/`system`/`unknown` (IP/HOST/USER-kind, but stop-listed) untouched. F2's
 * token-corruption concern (a minted value matching inside an already-inserted pseudonym token,
 * e.g. known value "1" inside "HOST_1") is narrowed, NOT eliminated, by the `>= 3` character floor
 * below: the boundary regex's `(?<![A-Za-z0-9])`/`(?![A-Za-z0-9])` lookarounds mean a corrupting
 * match still requires a minted digit run that EXACTLY equals another live pseudonym's full numeric
 * counter suffix — not just contains it. A 1-2 digit mint can never collide (every counter starts
 * at 1, so a bare "1"/"12" is only ever a PREFIX of a 3+-digit counter, never boundary-delimited on
 * its own against one), but a live-verified 3-digit mint DOES still bite: minting `"123"` (any kind)
 * alongside a same-session counter that has climbed to a live `HOST_123` turns
 * `"why is HOST_123 noisy"` into `"why is HOST_USER_4 noisy"` (or whichever pseudonym `"123"` got).
 * Accurately: this requires a same-session counter of that KIND reaching >= 100 (three digits) PLUS
 * a numeric, exactly-3-char identifier being minted in the SAME session — plausible in a long
 * conversation with heavy tool use, not "unreachable". The consequence is bounded to a CORRUPTED,
 * unreversible TOKEN in what the provider receives (the same failure mode `StreamDepseudonymizer`
 * already can't recover from for any malformed token), not a leak of a real value — no additional
 * real customer data reaches the provider as a result of this specific collision.
 */
export interface ScrubKnownEntitiesOptions {
  /** Narrow the dictionary scan to IP/HOST/USER-kind, identifier-shaped entries only — see this
   * function's doc comment. Defaults to `false` (today's allow-scan behavior, unchanged). */
  identifiersOnly?: boolean;
}

/** True when `pseudonym` (e.g. "HOST_3") was minted for one of the kinds `scrubKnownEntities`'s
 * `identifiersOnly` mode trusts as recoverable from bare prose — IP/HOST/USER, never VAL/URL. */
function isRecoverableIdentifierPseudonym(pseudonym: string): boolean {
  return /^(?:IP|HOST|USER)_\d+$/.test(pseudonym);
}

/** Case-insensitive stop-list of common words/placeholders that are plausible real IP/HOST/USER
 * values (a genuine "root"/"admin" account, a genuine "localhost"/"windows" host-shaped value) but
 * are ordinary enough that masking them in a user's typed question corrupts far more sentences
 * than it protects — the exact F1 failure mode ("Which Ubuntu agents are critical? root cause
 * please" -> "... USER_4 cause please"). Deliberately curated and short, not derived from a
 * dictionary or a length heuristic: an earlier version of `looksLikeIdentifierValue` used a raw
 * length/shape floor instead (>= 5 chars + digit/separator, or >= 6 plain-alphabetic) and that
 * regressed the exact threat model NF-1 exists to close — EVERY IP/HOST/USER value shorter than 5
 * chars, and every 5-char alphabetic one, went unmasked, including entirely realistic short
 * identifiers a user would retype straight off a results table ("jdoe", "bob", "titan", 4-char AD
 * account names). A stop-list keeps those short REAL identifiers masked while still excluding the
 * handful of common words that would otherwise be indistinguishable from them.
 *
 * `'host'`/`'user'`/`'ip'`/`'url'`/`'val'` are on this list for a SECOND reason beyond prose
 * hygiene: they protect the PSEUDONYM TOKEN GRAMMAR itself, not just ordinary sentences. If a
 * minted value ever equalled one of these kind keywords and were NOT excluded here, it would be
 * eligible to match — and corrupt — the token boundary of a completely unrelated pseudonym: a
 * minted value `"host"` (kind USER, say) would turn `"why is HOST_12 noisy"` into
 * `"why is USER_9_12 noisy"` (the `(?<![A-Za-z0-9])`/`(?![A-Za-z0-9])` boundary this file's regex
 * uses treats `_` as a valid boundary by design — see `scrubKnownEntities`'s doc comment). `'ip'`/
 * `'url'`/`'val'` are added even though `identifiersOnly` text can never itself CONTAIN a `URL_n`/
 * `VAL_n` token today (only IP/HOST/USER pseudonyms are ever eligible dictionary entries here) —
 * they guard against exactly the kind of "safe until the next refactor" gap a future change to
 * `isRecoverableIdentifierPseudonym` could reopen without anyone revisiting this list. */
const IDENTIFIER_STOP_WORDS = new Set([
  'root',
  'admin',
  'administrator',
  'user',
  'users',
  'guest',
  'system',
  'host',
  'hostname',
  'local',
  'localhost',
  'none',
  'null',
  'unknown',
  'default',
  'test',
  'prod',
  'dev',
  'staging',
  'server',
  'agent',
  'group',
  'windows',
  'linux',
  'ubuntu',
  'debian',
  'centos',
  'service',
  'daemon',
  'other',
  'ip',
  'url',
  'val',
  // Issue #8974: common SERVICE-ACCOUNT names. These are real accounts on a great many systems (so
  // they genuinely get minted as USER_n from a `source.user.name`), but each is also the ordinary
  // name of the software itself and appears constantly in the prose fields this issue newly scans --
  // "Apache access log anomaly", "nginx configuration changed", "PostgreSQL authentication failure"
  // are rule TITLES, not references to the account. Masking them would corrupt a large share of
  // every web/database ruleset's titles while protecting an account name that is identical on every
  // host running that software, i.e. reveals nothing specific to this customer. Same principle as
  // the entries above: excluded at SCAN time only -- the account's own `source.user.name` field is
  // still pseudonymized by its own policy entry, untouched by this list.
  'apache',
  'nginx',
  'postgres',
  'mysql',
  'redis',
  'jenkins',
  'tomcat',
  'backup',
  'monitor',
  'www-data',
  'oracle',
  'git',
  'mongodb',
  'elastic',
]);

/** True when `value` is shaped enough like a real identifier (hostname/IP-adjacent/username) that
 * `identifiersOnly` mode should trust a dictionary match on it inside ordinary user-typed prose.
 *
 * F-I1 (answer-quality adversarial validation): `inferPseudonymKind` (see its own doc comment)
 * mints HOST for ANY field path whose last `.`-segment is bare `"name"` — not just genuine hostname
 * fields, but `process.name`/`file.name`/`package.name`/`service.name`/`group.name` too. Those
 * fields' real values are routinely short, ordinary English/Unix words: `"top"`, `"find"`,
 * `"make"`, `"less"`, `"more"`, `"cut"`, `"tar"`, `"git"`, `"ssh"`, `"cron"`, `"curl"`, `"wget"`,
 * `"init"`, `"kill"`, `"log"` are all real process/command names a `get_agent_processes`-style tool
 * can legitimately mint as HOST_n. Live-verified: once several of those had been minted this way,
 * "show me the top 10 and find all" became "show me the HOST_9 10 and HOST_10 USER_2" — the
 * analyst never sees why, because the reverse pass restores the words in the model's OWN answer;
 * they just see the assistant appear to misunderstand a completely ordinary question. `USER`-kind
 * inference (`inferPseudonymKind`'s `hasKeyword('user')` branch) does not have this problem: it
 * requires a literal `user` token to appear in the FIELD NAME itself (not just any field ending in
 * `.name`), which is specific enough that a `USER`-kind mint is trusted at any length — that is
 * where "jdoe"/"bob" live. So: at least 3 characters (the F2 corruption-floor — see this function's
 * own doc comment above for the exact boundary-collision analysis that makes 3 safe), NOT an exact
 * (case-insensitive) match of `IDENTIFIER_STOP_WORDS`, and — new — a short (< 5 char), plain-
 * alphabetic value is trusted ONLY when its pseudonym is `USER_`-prefixed; a short plain-alphabetic
 * HOST/IP-kind value is presumed `*.name`-inference noise and left unmasked. Needs the entry's own
 * `pseudonym` at the call site, not just its `value` — see `scrubKnownEntities` below. Verified to
 * still mask `jdoe` (USER, 4 chars), `bob` (USER, 3 chars), `titan` (HOST, 5 chars — clears the
 * length bar on its own), and `db1` (HOST, digit-bearing) while dropping `top`/`find`/`make`/
 * `less`. */
function looksLikeIdentifierValue(value: string, pseudonym: string): boolean {
  if (value.length < 3) {
    return false;
  }
  if (IDENTIFIER_STOP_WORDS.has(value.toLowerCase())) {
    return false;
  }
  // Short plain-alphabetic HOST/IP-kind values are dominated by `*.name` escape-hatch junk
  // (process/file/package names: "top", "find", "make", "less") that collides with ordinary
  // prose. USER-kind inference needs a literal `user` token in the field name, so it is precise
  // enough to trust at any length — that is where "jdoe"/"bob" live.
  if (
    value.length < 5 &&
    !/[0-9_.-]/.test(value) &&
    !pseudonym.startsWith('USER_')
  ) {
    return false;
  }
  return true;
}

/**
 * Issue #8974: the curated set of `allow` fields whose values are HUMAN-AUTHORED PROSE that can
 * quote a bare, dotless identifier — the "dotless-identifier residual" every one of these entries'
 * own comment in `FIELD_POLICY_DEFAULTS` used to accept as unfixable.
 *
 * The reported leak: with privacy mode ON, `wazuh.rule.title` reached the provider as
 * `"Successful user authentication - vagrant"`. `vagrant` is a real account name, but nothing in the
 * pipeline could catch it — `rule.title` is explicit `allow` (branch 6 of `scrubFieldValue`, the one
 * branch that skips BOTH scans, deliberately: most titles are fixed Wazuh-ruleset strings the model
 * needs verbatim, and anonymizing the whole field would replace every finding's label with an opaque
 * token), and the shape scan that DOES run over it downstream (chat.ts's
 * `prescanAndMintToolContent`) only matches IP/FQDN shapes, which a dotless username is not. Hence
 * the reported asymmetry: `"... - auditbot from IP_1"` — the IP masked, the username not.
 *
 * What this set changes: these fields keep their `allow` action (no policy, settings-schema or UI
 * change — the value still reaches the provider readable), but their string values now additionally
 * pass the known-entity DICTIONARY scan in `identifiersOnly` mode, so a username/hostname this
 * CONVERSATION has already minted a pseudonym for is replaced by that existing pseudonym instead of
 * being quoted verbatim. Strictly additive: `scrubKnownEntities` never mints, so a value not already
 * in the dictionary is untouched, and no existing scrub is relaxed.
 *
 * Why `identifiersOnly` and not the full dictionary that an explicit `allow-scan` field
 * (`package.name`) gets: these values are PROSE. The full dictionary is every value the request's
 * pseudonymizer ever minted, which under the escape hatch's fail-closed default routinely includes
 * ordinary English words (`"critical"`, `"ubuntu"` — the F1 failure mode documented on
 * `IDENTIFIER_STOP_WORDS`). Running that over a rule title would corrupt the sentence far more often
 * than it protects anything. `identifiersOnly` is exactly the narrow mode built for prose: IP/HOST/
 * USER-kind entries only, whole-token (non-alphanumeric boundary) matches only, and stop-listed
 * against common words — so a real account named `root`/`admin`/`system` is deliberately left alone.
 *
 * Why the shape scan is NOT added here: it already runs over every one of these values downstream
 * (chat.ts's `prescanAndMintToolContent` over the serialized digest), and adding it at this boundary
 * would break `document.name`'s deliberate decision to keep a THIRD-PARTY threat-intel indicator
 * (usually itself FQDN/IP-shaped) verbatim — see that entry's comment.
 *
 * Membership rule: a field belongs here if its value can be authored (or edited) BY A PERSON AT THE
 * CUSTOMER — a rule/Sigma title, rule/decoder documentation, a custom rule/decoder/KVDB name, a
 * detector/monitor name, a stored query body, a self-hosted service endpoint. Vendor-authored
 * content is included where the SAME field name is also reachable for customer-authored content on
 * another family (the `FieldPolicyEntry.field` mechanism has no index scope — see the
 * mechanism-limit note in `FIELD_POLICY_DEFAULTS`), because the scan is a no-op on a value that
 * quotes nothing the conversation has minted.
 *
 * Curated CLOSED vocabularies are excluded and cannot quote a customer identifier at all:
 * `wazuh.rule.category`, `wazuh.rule.compliance.*`, MITRE ids/names, `rule.level`/`rule.status`,
 * `queries.tags`, `event.*`.
 *
 * `check.name`/`check.rationale`/`check.remediation`/`policy.name` are excluded on a DIFFERENT and
 * weaker basis, stated honestly rather than as a safety claim: these are benchmark text, which is
 * vendor-authored (CIS et al.) in every shipped policy — but Wazuh supports CUSTOM SCA policies, and
 * a custom check's name/rationale/remediation is free text an administrator writes, so it CAN quote
 * a real path, hostname or account ("verify /home/jsmith is 0700", "ask dbprod07's owner"). They are
 * left out because these four are the longest, most sentence-like values any tool returns and the
 * whole point of `get_sca_checks` is that an analyst reads them verbatim: including them trades a
 * narrow custom-policy residual for a much broader prose-corruption surface. That residual is real
 * and is carried in the issue/PR text, not silently dropped. Revisit if custom SCA policies become
 * common, or if the dictionary scan gains a per-field confidence signal.
 */
export const IDENTIFIER_BEARING_FREE_TEXT_FIELDS = new Set<string>([
  WAZUH_FIELD.RULE_TITLE,
  'document.metadata.description',
  'document.name',
  'rule.metadata.title',
  // Security Analytics detector/monitor identity and stored Sigma-derived query bodies: a monitor
  // name is typed by whoever created the detector, and a query body embeds literal field VALUES
  // ("source.user.name: jsmith", "host.hostname: dbprod07") the author pasted in.
  'monitor_name',
  'queries.name',
  'queries.query',
  'rule.queries.value',
  // CTI consumer bookkeeping: `resource` is a full API URL and `context` a tenant/context id --
  // vendor-side on the SaaS backend, but a customer running a PRIVATE CTI mirror puts an INTERNAL
  // hostname in `resource` (the concession already recorded on those entries).
  'resource',
  'context',
]);

export function scrubKnownEntities(
  text: string,
  pseudonymizer: Pseudonymizer,
  options: ScrubKnownEntitiesOptions = {},
): string {
  if (!text) {
    return text;
  }
  let entities = pseudonymizer
    .knownEntities()
    .filter(entry => entry.value.length > 0);
  if (options.identifiersOnly) {
    entities = entities.filter(
      entry =>
        isRecoverableIdentifierPseudonym(entry.pseudonym) &&
        looksLikeIdentifierValue(entry.value, entry.pseudonym),
    );
  }
  entities = entities.sort((a, b) => b.value.length - a.value.length);
  let out = text;
  for (const { value, pseudonym } of entities) {
    const pattern = new RegExp(
      `(?<![A-Za-z0-9])${escapeRegExpLiteral(value)}(?![A-Za-z0-9])`,
      'gi',
    );
    out = out.replace(pattern, pseudonym);
  }
  return out;
}

/** Resolves the policy entry for `field` (optionally scoped to `toolName`). Tool-scoped entries
 * ("toolName/field") are checked first and win over plain ones; plain entries support a trailing
 * `.*` prefix match (e.g. "wazuh.rule.compliance.*" matches "wazuh.rule.compliance" itself and
 * "wazuh.rule.compliance.pci_dss"). First matching entry wins; `undefined` (no matching policy
 * entry) means "allow" by omission. */
function resolveFieldEntry(
  field: string,
  policy: FieldPolicyEntry[],
  toolName?: string,
): FieldPolicyEntry | undefined {
  if (toolName) {
    const scopedKey = `${toolName}/${field}`;
    for (const entry of policy) {
      if (entry.field === scopedKey) {
        return entry;
      }
    }
  }
  for (const entry of policy) {
    if (entry.field.includes('/')) {
      continue; // Tool-scoped entry for some other tool (or already checked above).
    }
    if (entry.field.endsWith('.*')) {
      const prefix = entry.field.slice(0, -2);
      if (field === prefix || field.startsWith(`${prefix}.`)) {
        return entry;
      }
    } else if (entry.field === field) {
      return entry;
    }
  }
  return undefined;
}

/**
 * Which field(s) drive an aggregation's bucket key, and how the key is shaped as a result:
 * - `scalar`: terms/significant_terms/cardinality -- the bucket key is a single string, the value
 *   of `field`.
 * - `multi`: `multi_terms` -- the bucket key is an ARRAY, positionally aligned with `fields`
 *   (`fields[i]` names the field `key[i]` is a value of). Position is the ONLY thing that ties a
 *   component to its field, unlike `composite` below -- there is no per-component name to key off.
 * - `composite`: `composite` -- the bucket key is an OBJECT, `{sourceName: value}`; `fields` maps
 *   each `sourceName` (the composite `sources[]` entry's own key, a caller-chosen label, NOT a
 *   field path) to the field path that source's `terms.field` aggregates on.
 */
export type AggFieldSpec =
  | { kind: 'scalar'; field: string }
  | { kind: 'multi'; fields: string[] }
  | { kind: 'composite'; fields: Record<string, string> };

/** `resolveAggFieldSpec`'s `multi_terms` branch: `{terms: [{field}, {field}, ...]}` -- mirrors the
 * shape `guardrails.ts`'s `checkAggs` already validates for this same agg type. */
function resolveMultiTermsSpec(
  aggDef: Record<string, unknown> | undefined,
): AggFieldSpec | undefined {
  const multiTerms = aggDef?.multi_terms as { terms?: unknown } | undefined;
  if (!multiTerms || !Array.isArray(multiTerms.terms)) {
    return undefined;
  }
  const fields = multiTerms.terms
    .map(spec => (spec as { field?: unknown } | undefined)?.field)
    .filter((field): field is string => typeof field === 'string');
  // Positional: a `multi_terms` bucket key's array length matches `terms.length`, INCLUDING any
  // entry this loop couldn't resolve to a string field (silently dropped by `filter` above would
  // desync position i in `fields` from position i in the bucket key array) -- so an incomplete
  // resolution is reported as no spec at all (`undefined`) rather than a partial, misaligned one.
  return fields.length > 0 && fields.length === multiTerms.terms.length
    ? { kind: 'multi', fields }
    : undefined;
}

/** `resolveAggFieldSpec`'s `composite` branch: `{sources: [{sourceName: {terms: {field}}}, ...]}`
 * -- mirrors the shape `guardrails.ts`'s `checkAggs` already validates for this same agg type. */
function resolveCompositeSpec(
  aggDef: Record<string, unknown> | undefined,
): AggFieldSpec | undefined {
  const composite = aggDef?.composite as { sources?: unknown } | undefined;
  if (!composite || !Array.isArray(composite.sources)) {
    return undefined;
  }
  const fields: Record<string, string> = {};
  for (const source of composite.sources) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) {
      continue;
    }
    for (const [sourceName, sourceSpec] of Object.entries(
      source as Record<string, unknown>,
    )) {
      const field = (sourceSpec as { terms?: { field?: unknown } } | undefined)
        ?.terms?.field;
      if (typeof field === 'string') {
        fields[sourceName] = field;
      }
    }
  }
  return Object.keys(fields).length > 0
    ? { kind: 'composite', fields }
    : undefined;
}

function resolveAggFieldSpec(
  aggDef: Record<string, unknown> | undefined,
): AggFieldSpec | undefined {
  // Bucket-producing types only -- `cardinality` (and every other metric agg) is deliberately
  // excluded, see extractAggFields's doc comment above for why mapping it here misattributes
  // samples[].key against a leading metric agg instead of the bucket agg the rows actually came
  // from (#8920 item 5).
  for (const aggType of ['terms', 'significant_terms'] as const) {
    const spec = aggDef?.[aggType] as { field?: unknown } | undefined;
    if (spec && typeof spec.field === 'string') {
      return { kind: 'scalar', field: spec.field };
    }
  }
  return resolveMultiTermsSpec(aggDef) ?? resolveCompositeSpec(aggDef);
}

/**
 * Reads the field(s) driving each of a digest's `breakdown` aggregations' bucket keys, from the
 * EXECUTED request body — the response's `aggregations` tree only carries bucket keys/counts,
 * never which field(s) produced them, so this must read the query side. Returns a map of
 * top-level aggregation name → `AggFieldSpec` (`undefined` for an agg with no extractable field,
 * e.g. a date_histogram), in the body's key order — the same order digest.ts's `buildBreakdown`
 * iterates, so the two can't drift apart. Breakdown entries name their aggregation (`agg`) only in
 * the multi-agg case; a single-agg entry attributes to the map's first key.
 *
 * Resolves `terms`/`significant_terms` (a single scalar field), `multi_terms` (an
 * array of fields, positionally aligned with the bucket key array), and `composite` (a
 * `sourceName -> field` map, aligned with the bucket key object's own keys) — see `AggFieldSpec`.
 * Any OTHER agg shape (date_histogram, histogram, filters, ...) resolves to `undefined`, exactly
 * as before this file learned about `multi_terms`/`composite`; `applyFieldPolicy`'s fail-closed
 * backstop for an `undefined` spec (see its own doc comment) is what now covers whatever agg shape
 * this function does not yet parse, rather than this function trying to enumerate every possible
 * future shape.
 *
 *
 * Only BUCKET-producing aggregation types carry a field here, deliberately: a metric aggregation
 * (`cardinality`/`avg`/`sum`/`min`/`max`/`value_count`) returns a NUMBER, so no string value of
 * its field ever leaves through the digest, and mapping its field would misattribute the `key`
 * sample column — since #8920 item 5, digest.ts's `bucketsToRows` sources rows from the first agg
 * WITH BUCKETS, skipping over a leading metric agg, so `applyFieldPolicy` below must resolve
 * `samples[].key` against the first agg with an extractable BUCKET field (the same skip), not
 * against whatever agg happens to be declared first. Mapping `cardinality` here (as this function
 * once did) would break exactly that: `aggs: {distinct_ids: {cardinality: wazuh.agent.id},
 * by_agent: {terms: wazuh.agent.name}}` resolved `key` — which holds HOSTNAMES from `by_agent` —
 * against `wazuh.agent.id`'s 'allow' policy and sent them to the provider verbatim.
 *
 * This is intentionally NOT threaded through `Digest` itself beyond the `agg` name: adding the
 * FIELD(S) to every digest object would change buildDigest's output even when privacy is off,
 * breaking the "privacy OFF is byte-identical to today" requirement. Computing it as a sibling
 * value in executor.ts (from the same `valved.body` it already has on hand) keeps digest.ts
 * privacy-agnostic.
 */
export function extractAggFields(
  body: Record<string, unknown> | undefined,
): Record<string, AggFieldSpec | undefined> | undefined {
  // Both spellings must be read: OpenSearch accepts `aggregations` as a synonym for `aggs`, and
  // the escape hatch passes the model's raw body through. Reading only `aggs` would leave the
  // breakdown of an `aggregations`-spelled query unattributed, and therefore unscrubbed.
  const aggs = (body?.aggs ?? body?.aggregations) as
    | Record<string, unknown>
    | undefined;
  if (!aggs) {
    return undefined;
  }
  const aggKeys = Object.keys(aggs);
  if (aggKeys.length === 0) {
    return undefined;
  }
  const fields: Record<string, AggFieldSpec | undefined> = {};
  for (const aggKey of aggKeys) {
    fields[aggKey] = resolveAggFieldSpec(
      aggs[aggKey] as Record<string, unknown> | undefined,
    );
  }
  return fields;
}

/**
 * Applies one field's policy to one scalar value — the single-field decision shared by the
 * `samples` loop's regular (non-aggregation-key) fields below and every "scalar" case of
 * `scrubAggKeyComponent`. `keep: false` means "field is 'never': omit it"; a caller decides for
 * itself what "omit" means at its own granularity (drop one sample field, drop one composite
 * property, or drop a whole bucket for a positional multi_terms component — see
 * `scrubAggKeyComponent`).
 *
 * The #8889/#8902 allow-by-omission branch below is the digest-boundary half of that hardening's
 * defense-in-depth (the other half, chat.ts's `scrubMessagesForProvider` running
 * `prescanAndMintToolContent`/`prescanAndMint` over every outbound message, is independent of this
 * function and does not substitute for it) and MUST survive any future refactor of this function.
 *
 * Branch order is deliberate and every branch matters — do not reorder or drop one without
 * re-checking every FIELD_POLICY_DEFAULTS entry that relies on it:
 * 1. `never` — drop.
 * 2. `anonymize` — pseudonymize.
 * 3. `allow-scan` (#8912) — shape scan (`prescanAndMint`) THEN known-entity dictionary scan
 *    (`scrubKnownEntities`); see that function's doc comment for why both passes are needed.
 * 4. escape-hatch fail-closed default for an unlisted field — pseudonymize (kind inferred).
 * 5. `#8889`/`#8902` allow-BY-OMISSION (typed tool, no explicit entry, not the escape hatch) —
 *    shape scan only (`prescanAndMint`), no dictionary scan: an unlisted field is trusted
 *    allow-by-default, but not curated the way an explicit `allow-scan` entry is, so it gets the
 *    narrower of the two scans. The value still reaches the provider verbatim, but an IP/FQDN
 *    embedded in otherwise-free text (e.g. a package/process name that happens to mention a
 *    hostname) gets a secondary scan. Curated entries (agent id, MITRE technique IDs, compliance
 *    citations, CIS benchmark content, ...) are explicit `allow` (case 6) and skip this — several
 *    of those values are legitimately FQDN-token-shaped without being hostnames, so scanning them
 *    here would misfire; they stay covered end-to-end regardless by chat.ts's
 *    scrubMessagesForProvider, which runs prescanAndMintToolContent over every tool-result string
 *    value unconditionally.
 * 5b. Issue #8974 — an explicit `allow` field listed in `IDENTIFIER_BEARING_FREE_TEXT_FIELDS`
 *    (human-authored prose: rule/Sigma titles, rule documentation, custom rule/decoder names): the
 *    real value passes through, but through the identifier-only known-entity dictionary scan first
 *    (no shape scan — see that constant's doc comment for both decisions). Sits between 5 and 6 so
 *    it can only ADD a scan to a value branch 6 previously sent completely unscanned.
 * 6. Explicit `allow` (or a non-string/empty value in any branch above that didn't already return)
 *    — passthrough, completely unscanned. This is the ONLY branch that skips both scans; every
 *    other outcome above goes through at least one of them.
 *
 * P-2 (AI/plan/a1a-review.md) added two branches ahead of the ones above: a STRING ARRAY under an
 * 'anonymize'/'allow-scan' entry recurses element-wise through this same function (so a multi-valued
 * field like `wazuh.agent.host.ip` is no longer silently unscrubbed just because it is an array
 * instead of a scalar), and an unlisted OBJECT/non-empty-ARRAY value under the escape hatch's
 * fail-closed default (branch 4) is now dropped outright rather than passed through raw — the
 * bounded fallback the review sanctioned over a full recursive per-leaf walk.
 *
 * NF-2 fix: the P-2 array-recursion branch above only ever matched when EVERY element of the array
 * was a string (`value.every(item => typeof item === 'string')`). Any other container shape under
 * an explicit 'anonymize'/'allow-scan' entry — an array of objects, a nested array, a mixed-type
 * array (a single null/number element was enough to miss the guard), or a plain object — matched
 * none of the branches in this function (they are gated on `!entry`, i.e. no explicit policy entry)
 * and fell all the way through to the terminal passthrough, reaching the provider RAW. That made an
 * explicitly-curated 'anonymize'/'allow-scan' field LESS protected than an unlisted one. Fixed by
 * `deepScrubContainer`: for an explicit 'anonymize'/'allow-scan' entry whose value is any
 * array/object shape (not just a flat string array), deep-map every string leaf through the same
 * per-string action the entry specifies, dropping (never passing through raw) any leaf whose type
 * cannot be safely mapped. The terminal passthrough (this function's final `return`) is also now
 * closed off for containers: reaching it with an array/object value that isn't behind an explicit
 * 'allow' entry is a genuinely unhandled case, and is now dropped rather than defaulting to "raw".
 */
// Exported purely so privacy.test.ts can drive the NF-2 container-shape branches directly, without
// wiring a full Digest through applyFieldPolicy for every shape — same rationale as chat.ts's
// exported chatRequestMessageSchema.
export function scrubFieldValue(
  field: string,
  value: unknown,
  policy: FieldPolicyEntry[],
  pseudonymizer: Pseudonymizer,
  toolName: string | undefined,
  isEscapeHatch: boolean,
): { keep: boolean; value: unknown } {
  const entry = resolveFieldEntry(field, policy, toolName);
  if (entry?.action === 'never') {
    return { keep: false, value: undefined };
  }
  // P-2 (AI/plan/a1a-review.md), widened by NF-2: a container value (array or object, ANY shape —
  // a flat string array, an array of objects, a nested array, a mixed-type array, a plain object)
  // under an explicit 'anonymize'/'allow-scan' entry used to bypass its own field's policy — this
  // function only matched `typeof value === 'string'` (plus, after P-2, a flat string array), so
  // any other container reached the terminal passthrough and went to the provider RAW. Deep-map
  // every string leaf through the same per-string action the entry specifies (reusing the scalar
  // logic below via `deepScrubContainer`, no duplicated anonymize/scan implementation), dropping
  // any leaf whose type can't be safely mapped. A non-container value (string/number/boolean/null)
  // still falls through unchanged to the scalar branches below, exactly as before this fix.
  if (
    (entry?.action === 'anonymize' || entry?.action === 'allow-scan') &&
    (Array.isArray(value) || (value !== null && typeof value === 'object'))
  ) {
    return {
      keep: true,
      value: deepScrubContainer(
        value,
        entry.action,
        entry.kind,
        field,
        pseudonymizer,
      ),
    };
  }
  if (
    entry?.action === 'anonymize' &&
    typeof value === 'string' &&
    value.length > 0
  ) {
    return {
      keep: true,
      value: pseudonymizer.pseudonymize(
        value,
        entry.kind ?? inferPseudonymKind(field),
      ),
    };
  }
  if (
    entry?.action === 'allow-scan' &&
    typeof value === 'string' &&
    value.length > 0
  ) {
    // #8912: value stays readable, but is scrubbed against BOTH the value-shape scan (fresh
    // IPs/FQDNs) and the known-entity dictionary (bare identifiers already minted elsewhere this
    // conversation) — see `scrubKnownEntities`'s doc comment for why the dictionary scan exists on
    // top of the shape scan, and this function's own doc comment for the full branch ordering.
    return {
      keep: true,
      value: scrubKnownEntities(
        prescanAndMint(value, pseudonymizer),
        pseudonymizer,
      ),
    };
  }
  if (!entry && isEscapeHatch && isNonEmptyObjectOrArray(value)) {
    // P-2, second consequence: the escape hatch's fail-closed default (see this function's doc
    // comment, branch 4) only ever fired for a STRING value — an unlisted field whose real value is
    // an object or array (`_source: ["queries"]` on a SAP finding, `_source: ["document"]` on a
    // vulnerability record) fell through every branch above untouched and reached the provider
    // completely unpseudonymized, defeating fail-closed for exactly the shape it exists to catch.
    // Bounded fix (the review's sanctioned fallback, chosen over a full recursive per-leaf walk to
    // keep this function's blast radius small): omit the value entirely, the same "drop" outcome a
    // 'never' field gets. A caller that needs a specific sub-path readable must add an explicit
    // dotted policy entry for it (as this branch's own new entries do for `queries.id` etc.) rather
    // than rely on the parent object/array passing through.
    return { keep: false, value: undefined };
  }
  if (
    !entry &&
    isEscapeHatch &&
    typeof value === 'string' &&
    value.length > 0
  ) {
    // Fail-closed: no explicit policy entry for this field, but the escape hatch can surface any
    // finding field, so an unlisted one is NOT trusted as safe-by-omission here.
    return {
      keep: true,
      value: pseudonymizer.pseudonymize(value, inferPseudonymKind(field)),
    };
  }
  if (!entry && typeof value === 'string' && value.length > 0) {
    // #8889/#8902: allow-BY-OMISSION (typed tool, no explicit policy entry — the escape-hatch case
    // above already handled isEscapeHatch). See this function's doc comment, branch 5, for why
    // this is shape-scan-only (no dictionary scan) unlike the explicit `allow-scan` branch above,
    // and for why this branch must never be silently dropped again (it was, once — see the
    // module-level history in scrubFieldValue's doc comment above).
    const scanned = prescanAndMint(value, pseudonymizer);
    // Issue #8974: a curated prose field (see `IDENTIFIER_BEARING_FREE_TEXT_FIELDS`) gets the
    // identifier-only dictionary scan on top of the shape scan even here, so the protection does
    // not silently disappear for a stored/edited policy that no longer carries the field's explicit
    // `allow` entry. Every other allow-by-omission field keeps the shape-scan-only behavior above.
    return {
      keep: true,
      value: IDENTIFIER_BEARING_FREE_TEXT_FIELDS.has(field)
        ? scrubKnownEntities(scanned, pseudonymizer, { identifiersOnly: true })
        : scanned,
    };
  }
  if (
    !entry &&
    !isEscapeHatch &&
    (Array.isArray(value) || (value !== null && typeof value === 'object'))
  ) {
    // F3 (adversarial validation of NF-2's container hardening): NF-2 closed the escape hatch's
    // container gap (the `isEscapeHatch` branch above) and the explicit anonymize/allow-scan
    // container gap (the branch near the top of this function), but its "drop any OTHER container
    // that reaches the terminal passthrough" hardening (now below) fired for THIS case too — an
    // unlisted field on a typed (non-escape-hatch) tool whose value happens to be a container, e.g.
    // `document.mitre.technique.id` (an array of technique ids, get-rules.ts) or
    // `document.enrichments` (get-threat-intel-components.ts). Those fields are certified as
    // allow-by-omission-safe (`field-policy-coverage.test.ts`'s `KNOWN_SAFE_STRUCTURAL_FIELDS`) and
    // used to pass through RAW before NF-2; after NF-2 they were silently DELETED from the digest
    // instead — privacy ON and privacy OFF now disagreed about which columns even exist, not just
    // their values. Deep-SCAN instead of dropping: apply the exact same shape-only scan the scalar
    // allow-by-omission branch above applies to a bare string (`prescanAndMint`, no dictionary
    // scan — this is still allow-by-omission, not a reviewed anonymize/allow-scan decision) to
    // every string leaf, via `deepScrubContainer`'s `'scan-shape'` action. This still never lets a
    // leaf through un-scanned, so fail-closed intent is preserved, but no longer loses the column.
    return {
      keep: true,
      value: deepScrubContainer(
        value,
        'scan-shape',
        undefined,
        field,
        pseudonymizer,
      ),
    };
  }
  if (
    entry?.action === 'allow' &&
    IDENTIFIER_BEARING_FREE_TEXT_FIELDS.has(field) &&
    typeof value === 'string' &&
    value.length > 0
  ) {
    // Issue #8974 (branch 5b in this function's doc comment): an explicit `allow` field that is
    // human-authored PROSE keeps its readable value, but gets the identifier-only known-entity
    // dictionary scan so a username/hostname this conversation already minted a pseudonym for is
    // not quoted verbatim inside it. No shape scan here, deliberately — see
    // `IDENTIFIER_BEARING_FREE_TEXT_FIELDS`'s doc comment for both that and why the dictionary is
    // narrowed to `identifiersOnly`. Must stay AHEAD of the plain `allow` passthrough below (which
    // would otherwise return first) and BEHIND every branch above it, so it can only ever ADD a
    // scan to a value that was previously sent completely unscanned — never relax one.
    return {
      keep: true,
      value: scrubKnownEntities(value, pseudonymizer, {
        identifiersOnly: true,
      }),
    };
  }
  if (entry?.action === 'allow') {
    // Explicit 'allow' (branch 6 in this function's doc comment): completely unscanned passthrough
    // is the deliberate, curated outcome for these fields — including when the value is a
    // container (e.g. `wazuh.rule.compliance.*`, `check.result`). Must stay ahead of the
    // container-drop guard below, which exists precisely to stop OTHER, unhandled containers from
    // inheriting this same raw passthrough by omission.
    return { keep: true, value };
  }
  if (Array.isArray(value) || (value !== null && typeof value === 'object')) {
    // NF-2 hardening, narrowed by F3: every branch above that is entitled to pass a container
    // through (explicit 'allow') or that must scrub one (explicit 'anonymize'/'allow-scan', the
    // escape hatch's fail-closed drop, or — since F3 — the typed-tool allow-by-omission
    // scan-shape branch above) has already returned. Reaching here with an array/object means the
    // field is unlisted AND on the escape hatch's own tool-scope path with a shape this file's
    // isNonEmptyObjectOrArray guard did not already catch (e.g. an empty array/object, or a shape
    // this function genuinely has no handling for) — fail closed rather than let it inherit "raw"
    // by omission.
    return { keep: false, value: undefined };
  }
  if (
    !entry &&
    !isEscapeHatch &&
    (Array.isArray(value) || (value !== null && typeof value === 'object'))
  ) {
    // F3 (adversarial validation of NF-2's container hardening): NF-2 closed the escape hatch's
    // container gap (the `isEscapeHatch` branch above) and the explicit anonymize/allow-scan
    // container gap (the branch near the top of this function), but its "drop any OTHER container
    // that reaches the terminal passthrough" hardening (now below) fired for THIS case too — an
    // unlisted field on a typed (non-escape-hatch) tool whose value happens to be a container, e.g.
    // `document.mitre.technique.id` (an array of technique ids, get-rules.ts) or
    // `document.enrichments` (get-threat-intel-components.ts). Those fields are certified as
    // allow-by-omission-safe (`field-policy-coverage.test.ts`'s `KNOWN_SAFE_STRUCTURAL_FIELDS`) and
    // used to pass through RAW before NF-2; after NF-2 they were silently DELETED from the digest
    // instead — privacy ON and privacy OFF now disagreed about which columns even exist, not just
    // their values. Deep-SCAN instead of dropping: apply the exact same shape-only scan the scalar
    // allow-by-omission branch above applies to a bare string (`prescanAndMint`, no dictionary
    // scan — this is still allow-by-omission, not a reviewed anonymize/allow-scan decision) to
    // every string leaf, via `deepScrubContainer`'s `'scan-shape'` action. This still never lets a
    // leaf through un-scanned, so fail-closed intent is preserved, but no longer loses the column.
    return {
      keep: true,
      value: deepScrubContainer(
        value,
        'scan-shape',
        undefined,
        field,
        pseudonymizer,
      ),
    };
  }
  if (entry?.action === 'allow') {
    // Explicit 'allow' (branch 6 in this function's doc comment): completely unscanned passthrough
    // is the deliberate, curated outcome for these fields — including when the value is a
    // container (e.g. `wazuh.rule.compliance.*`, `check.result`). Must stay ahead of the
    // container-drop guard below, which exists precisely to stop OTHER, unhandled containers from
    // inheriting this same raw passthrough by omission.
    return { keep: true, value };
  }
  if (Array.isArray(value) || (value !== null && typeof value === 'object')) {
    // NF-2 hardening, narrowed by F3: every branch above that is entitled to pass a container
    // through (explicit 'allow') or that must scrub one (explicit 'anonymize'/'allow-scan', the
    // escape hatch's fail-closed drop, or — since F3 — the typed-tool allow-by-omission
    // scan-shape branch above) has already returned. Reaching here with an array/object means the
    // field is unlisted AND on the escape hatch's own tool-scope path with a shape this file's
    // isNonEmptyObjectOrArray guard did not already catch (e.g. an empty array/object, or a shape
    // this function genuinely has no handling for) — fail closed rather than let it inherit "raw"
    // by omission.
    return { keep: false, value: undefined };
  }
  return { keep: true, value };
}

/** True for a non-null object or a non-empty array — the shapes `scrubFieldValue`'s escape-hatch
 * fail-closed branch (P-2) must not pass through raw. An empty array/object carries no data worth
 * omitting over and is left to the final passthrough branch. */
function isNonEmptyObjectOrArray(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return value !== null && typeof value === 'object';
}

/** Sentinel `deepScrubContainer` returns for a leaf it cannot safely map, so the array/object
 * branches that call it recursively can tell "drop this leaf" apart from a legitimately scrubbed
 * `undefined`-free value (which never occurs for our primitives, but keeps the signal unambiguous
 * rather than overloading `undefined`). */
const DEEP_SCRUB_DROP = Symbol('deepScrubContainer:drop');

/**
 * NF-2: deep-maps every string leaf of an array/object of ANY shape through the same per-string
 * action `scrubFieldValue` already applies to a scalar string under an explicit 'anonymize' or
 * 'allow-scan' entry — reusing that logic rather than duplicating the anonymize/scan
 * implementations. Primitives (number/boolean/null) pass through unchanged (nothing to scrub).
 * Any leaf whose type cannot be safely mapped (anything other than
 * string/number/boolean/null/array/plain-object — e.g. `undefined`) is DROPPED (fail closed: an
 * array element is omitted, an object key is omitted) rather than passed through raw.
 *
 * F3 adds a third action, `'scan-shape'`: the container counterpart of `scrubFieldValue`'s scalar
 * allow-by-omission branch (`!entry && typeof value === 'string'`) — a shape-only `prescanAndMint`
 * scan, no dictionary lookup and no `kind` (allow-by-omission never had a reviewed pseudonym kind
 * to mint under in the first place). Used for an unlisted typed-tool field whose value is a
 * container, so that field keeps its column instead of NF-2's hardening silently dropping it — see
 * `scrubFieldValue`'s `!entry && !isEscapeHatch` container branch.
 */
function deepScrubContainer(
  value: unknown,
  action: 'anonymize' | 'allow-scan' | 'scan-shape',
  kind: PseudonymKind | undefined,
  field: string,
  pseudonymizer: Pseudonymizer,
): unknown {
  if (typeof value === 'string') {
    if (value.length === 0) {
      return value;
    }
    if (action === 'anonymize') {
      return pseudonymizer.pseudonymize(
        value,
        kind ?? inferPseudonymKind(field),
      );
    }
    if (action === 'allow-scan') {
      return scrubKnownEntities(
        prescanAndMint(value, pseudonymizer),
        pseudonymizer,
      );
    }
    // 'scan-shape': allow-by-omission's shape-only scan, no dictionary lookup — mirrors
    // scrubFieldValue's scalar `!entry` string branch exactly.
    return prescanAndMint(value, pseudonymizer);
  }
  if (
    value === null ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .map(item => deepScrubContainer(item, action, kind, field, pseudonymizer))
      .filter(item => item !== DEEP_SCRUB_DROP);
  }
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, entryValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      const scrubbed = deepScrubContainer(
        entryValue,
        action,
        kind,
        field,
        pseudonymizer,
      );
      if (scrubbed !== DEEP_SCRUB_DROP) {
        setOwnProperty(result, key, scrubbed);
      }
    }
    return result;
  }
  // Anything else (undefined, function, symbol, bigint, ...) cannot be safely mapped to a scrubbed
  // value or to a known-safe primitive — fail closed by signalling the caller to omit this leaf.
  return DEEP_SCRUB_DROP;
}

/**
 * Scrubs one aggregation bucket's `key`, whatever shape it is, against `spec` (from
 * `extractAggFields` — `undefined` when the agg's field couldn't be determined, e.g. a
 * date_histogram). Returns `{drop: true}` when the ENTIRE bucket must be dropped (a scalar/
 * positional-multi 'never' — see below), otherwise `{drop: false, value}` with `value` the
 * (possibly scrubbed) replacement key.
 *
 * - `scalar` (terms/significant_terms/cardinality): the existing single-field decision, unchanged
 *   in behavior — 'never' drops the whole bucket (every bucket key IS a value of that one field,
 *   so there is nothing left to keep), 'anonymize' pseudonymizes the string key.
 * - `multi` (multi_terms — key is an ARRAY, `spec.fields[i]` names index `i`'s field): scrubbed
 *   per-component, BUT if ANY component's field is 'never', the WHOLE bucket is dropped rather
 *   than only that array slot — a positional array has no per-slot label the way `composite`'s
 *   object does, so removing one slot would silently shift the remaining values out of alignment
 *   with their own fields, which is worse than dropping the bucket outright.
 * - `composite` (key is an OBJECT, `{sourceName: value}`, `spec.fields[sourceName]` names that
 *   source's field): scrubbed per-component, and a 'never' component IS safely omittable here —
 *   each property is independently labeled by its own `sourceName`, so dropping one leaves the
 *   rest correctly attributable, unlike `multi` above. The bucket itself is only dropped if that
 *   leaves NO properties at all.
 * - `undefined` spec (no field could be determined — date_histogram, histogram, filters, or any
 *   agg shape this file does not parse): typed catalog tools never see an aggregation shape they
 *   did not build themselves, so a spec-less bucket here is trusted as non-field-bearing (the
 *   date_histogram case this default was written for) and passed through untouched. The
 *   `search_wazuh_data` escape hatch's arbitrary DSL, though, can put ANY agg shape here —
 *   including one this file does not yet parse but that DOES carry a real field — so it fails
 *   CLOSED instead: a string key is pseudonymized generically (no field name to infer a kind
 *   from), anything else (object/array/number) is dropped outright rather than risk shipping an
 *   unrecognized structured value verbatim.
 */
function scrubAggKey(
  rawKey: unknown,
  spec: AggFieldSpec | undefined,
  policy: FieldPolicyEntry[],
  pseudonymizer: Pseudonymizer,
  toolName: string | undefined,
  isEscapeHatch: boolean,
): { drop: boolean; value?: unknown } {
  if (!spec) {
    if (!isEscapeHatch) {
      return { drop: false, value: rawKey };
    }
    if (typeof rawKey === 'string' && rawKey.length > 0) {
      return {
        drop: false,
        value: pseudonymizer.pseudonymize(rawKey, inferPseudonymKind('key')),
      };
    }
    // An object/array of genuinely unknown shape cannot be safely component-scrubbed (no field
    // mapping exists for it), so the whole bucket is dropped rather than risk shipping raw
    // structured data. A harmless scalar (number, empty string) is not structured data worth
    // dropping over -- pass it through unchanged, same as the non-escape-hatch branch above.
    if (rawKey !== null && typeof rawKey === 'object') {
      return { drop: true };
    }
    return { drop: false, value: rawKey };
  }

  if (spec.kind === 'scalar') {
    const result = scrubFieldValue(
      spec.field,
      rawKey,
      policy,
      pseudonymizer,
      toolName,
      isEscapeHatch,
    );
    return result.keep ? { drop: false, value: result.value } : { drop: true };
  }

  if (spec.kind === 'multi') {
    if (!Array.isArray(rawKey) || rawKey.length !== spec.fields.length) {
      // Shape mismatch: not reachable through `extractAggFields` today (it only ever produces a
      // `multi` spec whose `fields.length` already matches the source `multi_terms.terms.length`,
      // and a well-formed OpenSearch response's bucket key array length always matches that same
      // `terms` count) -- but the escape hatch's arbitrary DSL is this file's only caller that
      // doesn't go through `extractAggFields`'s own validation on the way in, so this branch is
      // still the last fail-open path on that route. Symmetric with the `!spec` structured-key
      // branch above: an unrecognized/mismatched shape is dropped rather than trusted as safe.
      return { drop: true };
    }
    const out: unknown[] = [];
    for (let i = 0; i < rawKey.length; i += 1) {
      const result = scrubFieldValue(
        spec.fields[i],
        rawKey[i],
        policy,
        pseudonymizer,
        toolName,
        isEscapeHatch,
      );
      if (!result.keep) {
        return { drop: true }; // Any 'never' component drops the whole positional bucket.
      }
      out.push(result.value);
    }
    return { drop: false, value: out };
  }

  // composite
  if (!rawKey || typeof rawKey !== 'object' || Array.isArray(rawKey)) {
    return { drop: false, value: rawKey }; // Shape mismatch -- leave alone defensively.
  }
  const out: Record<string, unknown> = {};
  for (const [sourceName, componentValue] of Object.entries(
    rawKey as Record<string, unknown>,
  )) {
    const field = spec.fields[sourceName];
    if (!field) {
      // No resolved field for this named source (e.g. a composite source type `extractAggFields`
      // does not map to a field, like `histogram`/`date_histogram`/`geotile_grid` -- as of this
      // change `guardrails.ts`'s `checkAggs` REJECTS a non-`terms` composite source outright, so a
      // typed tool or a guardrail-checked escape-hatch query can no longer reach this branch with
      // one; kept as defense in depth for anything upstream of that check anyway). Typed catalog
      // tools keep today's pass-through (same rationale as the top-level `undefined`-spec branch
      // above: nothing curated is being bypassed). The escape hatch fails CLOSED instead: a string
      // component is pseudonymized generically, a structured one is omitted outright rather than
      // risk shipping an unrecognized value verbatim.
      if (!isEscapeHatch) {
        out[sourceName] = componentValue;
      } else if (
        typeof componentValue === 'string' &&
        componentValue.length > 0
      ) {
        out[sourceName] = pseudonymizer.pseudonymize(
          componentValue,
          inferPseudonymKind(sourceName),
        );
      }
      // else (escape hatch + non-string/empty component): omit the property entirely.
      continue;
    }
    const result = scrubFieldValue(
      field,
      componentValue,
      policy,
      pseudonymizer,
      toolName,
      isEscapeHatch,
    );
    if (result.keep) {
      out[sourceName] = result.value;
    }
    // else: 'never' on this one named component -- omit just that property, unlike `multi` above.
  }
  return { drop: Object.keys(out).length === 0, value: out };
}

/** Issue #8974: the fields whose HOST-kind pseudonym is pre-minted before a digest's prose fields
 * are scanned. An explicit, curated list rather than "every field `inferPseudonymKind` calls HOST",
 * because that inference treats ANY path ending in `.name` as a hostname alias — `process.name`,
 * `package.name`, `service.name`, `group.name` included — whose real values are short ordinary words
 * (`top`, `find`, `git`, `cron`). Pre-minting that class would both churn HOST counter numbering
 * across every digest and widen the dictionary with prose-colliding junk. Every entry here has an
 * explicit `anonymize` + `kind: 'HOST'` entry in `FIELD_POLICY_DEFAULTS`, i.e. is a REVIEWED
 * hostname field, and `field-policy-coverage`-style pairing is pinned by a test.
 *
 * `get_agents/name` is FUTURE-PROOFING, not a live path: a `get_agents` digest carries no member of
 * `IDENTIFIER_BEARING_FREE_TEXT_FIELDS` today, so the gate in `applyFieldPolicy` never even calls the
 * pre-mint for that tool. It is listed so the entry already exists if that tool ever samples a prose
 * column, and it is what the tool-scoped lookup below exists to resolve. Be aware of what that means
 * for the tests: the pairing test covers it (it has the right policy entry), but there is no
 * BEHAVIOURAL test for it, because there is no reachable behavior to assert. The two behavioural
 * pre-mint tests exercise `wazuh.agent.name` and `host.hostname`. */
export const PREMINT_HOST_FIELDS = new Set<string>([
  WAZUH_FIELD.AGENT_NAME,
  'host.hostname',
  'get_agents/name',
]);

/**
 * Issue #8974, the other half of the fix: mints a digest's own identifier pseudonyms BEFORE any of
 * its fields are scrubbed, so the dictionary scan the prose fields now get (see
 * `IDENTIFIER_BEARING_FREE_TEXT_FIELDS`) can find an identifier that this SAME digest carries.
 *
 * WHY THIS IS LOAD-BEARING, and not the redundancy it looks like — read this before deleting it.
 * The same-turn case alone would NOT justify it: `chat.ts`'s outbound `applyToText`/
 * `prescanAndMintToolContent` pass runs over the whole serialized message set at the END of the
 * turn, by which point the map holds every value the turn minted, so a live session's WIRE is
 * already covered whatever order this function ran in. The reason this function must exist is
 * DURABILITY: the pseudonym-form digest produced here is what gets PERSISTED as the conversation's
 * tool result, and a resumed conversation replays that stored digest with an EMPTY client-held map.
 * Whatever text was baked into the stored digest is what leaves on every later turn, and no
 * end-of-turn scrub can retroactively fix it, because the mapping that would have caught it no
 * longer exists. So a hostname or username left verbatim inside a stored rule title leaks once per
 * resumed turn, forever. Getting the mint order right HERE, at the digest boundary, is the only
 * place that can be fixed.
 *
 * That is also why the field walk below cannot rely on digest key order: `applyFieldPolicy`'s
 * samples loop walks `Object.entries(sample)` in insertion order, and `scrubKnownEntities` only
 * replaces what is already mapped — so a row shaped `{'wazuh.rule.title': '... - vagrant',
 * 'source.user.name': 'vagrant'}` would scrub the title while `vagrant` is still unknown and mint
 * `USER_1` one key too late. Key order comes from each tool's own sample-column list, so the
 * protection would silently hold for some tools and not others.
 *
 * Deliberately narrow, to keep this a pure REORDERING rather than a new mint source:
 * - Only fields the samples loop was ALREADY going to pseudonymize (an explicit `anonymize` entry,
 *   or an unlisted field under the escape hatch's fail-closed default) are pre-minted, with the
 *   exact same kind (`entry.kind ?? inferPseudonymKind(field)`) that loop would have used — so
 *   `pseudonymize`'s reuse-never-remint contract makes the later call return the same token. A field
 *   whose value is sent verbatim (`allow`/`allow-scan`) is never pre-minted: there is nothing to
 *   hide in the prose that is not already readable one key over.
 * - USER-kind fields of any name (`inferPseudonymKind`'s USER branch requires a literal `user` token
 *   in the field name, which is precise enough to trust), plus the explicitly curated
 *   `PREMINT_HOST_FIELDS` for HOST — see that constant for why HOST is a list and not an inference.
 * - Only called when the digest actually has a prose field to protect, so a digest without one is
 *   byte-identical to before this existed (pseudonym counter numbering included — pinned by a test).
 *
 * `breakdown` is not walked: a bucket digest's samples are `{key, doc_count}` rows, so a prose field
 * and a breakdown bucket never coexist in the same digest.
 */
function premintProseScanIdentifiers(
  digest: Digest,
  policy: FieldPolicyEntry[],
  pseudonymizer: Pseudonymizer,
  toolName: string | undefined,
  isEscapeHatch: boolean,
): void {
  for (const sample of digest.samples) {
    for (const [sampleKey, value] of Object.entries(sample)) {
      if (typeof value !== 'string' || value.length === 0) {
        continue;
      }
      const entry = resolveFieldEntry(sampleKey, policy, toolName);
      const willPseudonymize =
        entry?.action === 'anonymize' || (!entry && isEscapeHatch);
      if (!willPseudonymize) {
        continue;
      }
      const kind = entry?.kind ?? inferPseudonymKind(sampleKey);
      // A USER-kind field is trusted by its name alone; a HOST-kind one only if explicitly curated.
      // Both the bare field path and the `tool/field` scoped spelling are accepted, since
      // `get_agents/name` is stored scoped while `wazuh.agent.name` is not.
      const premintable =
        kind === 'USER' ||
        (kind === 'HOST' &&
          (PREMINT_HOST_FIELDS.has(sampleKey) ||
            (toolName !== undefined &&
              PREMINT_HOST_FIELDS.has(`${toolName}/${sampleKey}`))));
      if (!premintable) {
        continue;
      }
      pseudonymizer.pseudonymize(value, kind);
    }
  }
}

/**
 * Applies field policy to one digest, right before it is serialized as `toolResultContent`
 * (called from server/tools/executor.ts, immediately before `JSON.stringify`). `columns` (schema
 * hint labels) pass through with ONE filter: a field whose policy action is 'never' loses its
 * column entry too, per that action's "even the fact the field exists" contract (probe P4,
 * 2026-08-14, caught the name leaking while the values were gone). Other actions leave the
 * hint untouched — a schema-hint NAME is not a value.
 *
 * - `samples`: 'never' fields are dropped from the sample object entirely; 'anonymize' string
 *   values are pseudonymized (kind inferred from the field name); an explicit 'allow' field
 *   passes through unchanged, EXCEPT the curated prose fields of
 *   `IDENTIFIER_BEARING_FREE_TEXT_FIELDS` (#8974), which pass through the identifier-only
 *   known-entity dictionary scan — with this digest's own usernames and curated hostnames pre-minted
 *   first by `premintProseScanIdentifiers`, so neither key order nor a later resume with an empty
 *   client map decides whether the scan sees them; an explicit
 *   'allow-scan' field (#8912) passes through but is
 *   scrubbed by BOTH the value-shape scan and the known-entity dictionary scan (see
 *   `scrubFieldValue`'s doc comment for the full branch ordering and `scrubKnownEntities` for the
 *   dictionary scan itself). An UNLISTED field's behavior depends on `isEscapeHatch` (see
 *   below) — and, when it stays allowed (the non-escape-hatch default), its string value is
 *   still run through `prescanAndMint`'s IP/FQDN value-shape scan (#8889) so an identifier
 *   embedded in otherwise-readable free text is not missed just because the field itself is
 *   trusted.
 *   AGGREGATION samples are the one exception to "resolve by the sample's own field name": a bucket
 *   row's keys are `key`/`doc_count` (digest.ts's `bucketsToRows`), and `key` holds a VALUE of the
 *   AGGREGATED field, not of a field literally called "key". Resolving it by name matched no policy
 *   entry, so a top-agents/top-rules aggregation sent its real bucket values to the provider under
 *   `samples[].key` while `breakdown` — the same values, one key over — was correctly scrubbed.
 *   `key` is therefore resolved via `scrubAggKey` against `aggFields`' first aggregation spec
 *   whenever there is one — including `multi_terms`/`composite` shapes now, not just a scalar
 *   field, per-component (see `scrubAggKey`'s doc comment). A sample whose 'key' bucket resolves
 *   to `{drop: true}` (a scalar/positional-multi 'never') has its ENTIRE 'key' entry omitted, same
 *   as any other 'never' field — 'doc_count' and any other sample field are unaffected, matching
 *   the samples loop's existing per-field (not per-row) drop granularity.
 * - `breakdown`: a bucket key's field(s) can't be read from the digest alone (see
 *   `extractAggFields` above) — each bucket is attributed to its aggregation (the entry's `agg`
 *   name, or the first aggregation when unset — the single-agg case) and that aggregation's
 *   spec is resolved against the same policy via `scrubAggKey` ("a top-agents terms agg leaks
 *   hostnames otherwise"). A spec that resolves to `{drop: true}` drops that WHOLE bucket (a
 *   breakdown entry has no other field to fall back to, unlike a sample row's 'doc_count'); a
 *   bucket whose aggregation has no extractable field (e.g. date_histogram) passes through
 *   unscrubbed for typed tools, and fails closed for the escape hatch — see `scrubAggKey`'s
 *   `undefined`-spec branch (this inverted default, plus `multi_terms`/`composite` support, is
 *   what closed the gap where an escape-hatch multi_terms/composite bucket used to bypass the
 *   field policy entirely by falling through this same "no field" branch unconditionally).
 * - `message`: the Manager top-level `message` field is free text from the API, not a
 *   structured field a per-field policy entry can target — it is run through the pseudonymizer's
 *   whole-text scrub (`applyToText`, the same pass the outbound tool-call-argument scrub in
 *   chat.ts uses) so any already-known real value embedded in it is replaced. Only added to the
 *   returned object when present, so privacy-off (`applyFieldPolicy` isn't called at all then) and
 *   privacy-on-but-message-absent both stay byte-identical to before this existed.
 *
 * `isEscapeHatch`: typed catalog tools only ever expose the ~10 fields curated in
 * `FIELD_POLICY_DEFAULTS`, so "unlisted = allow" was a safe default — but search_wazuh_data's
 * arbitrary DSL can pick ANY finding field into `samples`/`breakdown` (data.win.*,
 * data.office365.*, data.aws.*, syscheck.path, ...), and every one of those was passing through
 * untouched under privacy mode, defeating the guarantee for the one tool built to reach arbitrary
 * fields. When the caller sets `isEscapeHatch: true` (threaded from
 * `ToolDefinition.failClosedFieldPolicy` at the executor.ts call site — issue #8917; NOT the same
 * as `deriveColumns`, which only controls how columns are computed and is set on tools of very
 * different risk profiles, see that flag's own doc comment in types.ts), an UNLISTED string
 * field's default flips from allow to anonymize (kind inferred from the field name, same as an
 * explicit 'anonymize' entry with no `kind`) — fail-closed: pseudonymize anything not explicitly
 * allow-listed. A field explicitly present in the policy (any action, including 'allow') is
 * unaffected either way — this only changes the *default for an absent entry*. Typed tools (the
 * default, `isEscapeHatch` false or omitted) keep today's allow-by-omission behavior exactly.
 */
export function applyFieldPolicy(
  digest: Digest,
  policy: FieldPolicyEntry[],
  pseudonymizer: Pseudonymizer,
  aggFields?: Record<string, AggFieldSpec | undefined>,
  toolName?: string,
  isEscapeHatch = false,
): Digest {
  // The field a bucket row's `key` holds the values OF — see the `samples` note above. The first
  // agg with an extractable BUCKET field, not the first DECLARED agg: since #8920 item 5,
  // digest.ts's `bucketsToRows` sources rows from the first agg with buckets, skipping a leading
  // metric agg, and `extractAggFields` above maps only bucket-producing types — so "first defined
  // entry" here walks in the exact same declaration order and lands on the same aggregation the
  // rows came from. `undefined` for a non-aggregation digest, or when no aggregation has an
  // extractable field (e.g. only a date_histogram — whose bucket keys are NUMBERS and never reach
  // the string-scrub branches anyway), in which case `key` resolves by its own name like any
  // other sample field.
  const firstAggField = aggFields
    ? Object.values(aggFields).find(field => field !== undefined)
    : undefined;
  const isAggDigest = aggFields !== undefined;

  // Issue #8974: pre-mint this digest's own usernames and curated hostnames so the prose fields'
  // new dictionary scan can see them regardless of sample key order — and, the load-bearing reason,
  // so the PERSISTED digest a resumed conversation replays with an empty map does not carry them
  // verbatim. See `premintProseScanIdentifiers`. Gated on the digest actually carrying a prose
  // field, so every other digest stays byte-identical, counter numbering included.
  if (
    digest.samples.some(sample =>
      Object.keys(sample).some(key =>
        IDENTIFIER_BEARING_FREE_TEXT_FIELDS.has(key),
      ),
    )
  ) {
    premintProseScanIdentifiers(
      digest,
      policy,
      pseudonymizer,
      toolName,
      isEscapeHatch,
    );
  }

  const samples = digest.samples.map(sample => {
    const out: Record<string, unknown> = {};
    for (const [sampleKey, value] of Object.entries(sample)) {
      if (sampleKey === 'key' && isAggDigest) {
        // `scrubAggKey`'s `drop: true` means "omit the 'key' entry" HERE, at sample granularity —
        // matching this loop's existing per-field (not per-row) drop behavior. It means something
        // stricter ("drop the whole bucket") in the `breakdown` loop below, which has no sibling
        // field like `doc_count` to preserve once the identity itself is gone; a sample row does,
        // so `doc_count`/any other sample field survives a dropped 'key' exactly as before.
        const result = scrubAggKey(
          value,
          firstAggField,
          policy,
          pseudonymizer,
          toolName,
          isEscapeHatch,
        );
        if (!result.drop) {
          out[sampleKey] = result.value;
        }
        continue;
      }
      // `sampleKey` is what the digest stays KEYED by (never rewritten — the model's view of
      // the digest shape must not change); `field` is only what the policy is resolved against
      // (`scrubFieldValue` resolves it via `resolveFieldEntry`, same as every other caller).
      const result = scrubFieldValue(
        sampleKey,
        value,
        policy,
        pseudonymizer,
        toolName,
        isEscapeHatch,
      );
      if (result.keep) {
        out[sampleKey] = result.value;
      }
    }
    return out;
  });

  let breakdown = digest.breakdown;
  if (breakdown && aggFields) {
    const firstAggName = Object.keys(aggFields)[0];
    const scrubbed: NonNullable<Digest['breakdown']> = [];
    for (const bucket of breakdown) {
      const spec = aggFields[bucket.agg ?? firstAggName];
      const result = scrubAggKey(
        bucket.key,
        spec,
        policy,
        pseudonymizer,
        toolName,
        isEscapeHatch,
      );
      if (result.drop) {
        continue;
      }
      scrubbed.push({ ...bucket, key: result.value });
    }
    // Assigned unconditionally, empty result included: an empty array means a 'never' entry
    // dropped every bucket, and the caller must then see NO breakdown at all. Falling back to
    // `digest.breakdown` here would restore the raw, unscrubbed buckets.
    breakdown = scrubbed;
  }

  const scrubbedDigest: Digest = {
    ...digest,
    // 'never' hides even the FIELD'S EXISTENCE (the action's contract above: "drops its name from
    // the `columns` schema hint") -- the wire capture of probe P4 (2026-08-14) showed the column
    // name still reaching the provider while the values were correctly gone, because this
    // function's earlier doc claimed columns were "left untouched per the design note" and the
    // implementation followed THAT sentence. The two docs now agree: names of 'never' fields are
    // filtered here; every other action keeps its column entry (a schema-hint NAME is not a
    // value, so anonymize/allow/allow-scan have nothing to scrub in it).
    columns: digest.columns.filter(
      field => resolveFieldEntry(field, policy, toolName)?.action !== 'never',
    ),
    samples,
    // `...digest` already spread the raw `message` through untouched when present; this explicit
    // key runs it through the whole-text scrub and overrides that spread (object spread is
    // left-to-right, so a later key wins). Omitted entirely when absent so there is no
    // `message: undefined` key added to the serialized digest.
    ...(digest.message
      ? { message: pseudonymizer.applyToText(digest.message) }
      : {}),
  };

  // Set or removed after the spread for the same reason as `message`: `...digest` carries the raw
  // breakdown, so the policy result has to overwrite it — or delete the key when the policy left
  // nothing to report.
  if (breakdown && breakdown.length > 0) {
    scrubbedDigest.breakdown = breakdown;
  } else {
    delete scrubbedDigest.breakdown;
    // A `breakdownNote` describes the bucket list it rides with (its truncation figures, which
    // end of the list was kept — see digest.ts's buildBucketTruncationNote). With the breakdown
    // deleted above, the note would assert concrete counts about a list that is not in the
    // payload (issue #8935 item 1's integration review caught this: a 'never' policy on the
    // aggregated field left the note's carry-trim figures dangling). buildDigest never emits the
    // note without the breakdown, so deleting both keeps that invariant through the scrub too.
    delete scrubbedDigest.breakdownNote;
  }

  return scrubbedDigest;
}
