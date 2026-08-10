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
 * The policy has exactly ONE boundary — what the AI provider receives — and the three actions differ
 * only in how much of a field's value get there:
 *
 * - `allow`: the provider receives the real value. Also the default for a field with no entry on a
 *   typed catalog tool (the search_wazuh_data escape hatch flips that default to `anonymize` — see
 *   `applyFieldPolicy`'s `isEscapeHatch`).
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

export type FieldPolicyAction = 'allow' | 'anonymize' | 'never';

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
  // Curated benchmark/policy content (CIS etc.), not analyst/attacker-supplied — reviewed 'allow'.
  { field: 'check.id', action: 'allow' },
  { field: 'check.name', action: 'allow' },
  { field: 'check.result', action: 'allow' },
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
  // meaningless pseudonyms under privacy mode. MOST entries below are software/config IDENTITY,
  // not a personal or infrastructure identifier -- the contrast with the fields that correctly
  // stay anonymized (host.hostname, process.command_line, source.ip/destination.ip,
  // source.user.name/destination.user.name -- all already listed above) is deliberate and must
  // not be widened without the same scrutiny. `package.vendor` below is the deliberate exception
  // to "identity, therefore allow" -- see its own comment.
  { field: 'package.name', action: 'allow' },
  { field: 'package.version', action: 'allow' },
  { field: 'package.type', action: 'allow' },
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
  // fix that closes that gap. Revisit this to 'allow-scan' once #8912 lands, to preserve the
  // distributor name while still catching the embedded address.
  { field: 'package.vendor', action: 'anonymize', kind: 'VAL' },
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
];

/**
 * Reconciles a STORED field policy array (the `wazuh-ai-assistant-settings` saved object's
 * `fieldPolicy` attribute) with the shipped `FIELD_POLICY_DEFAULTS`, so a policy entry added in a
 * later release reaches an installation whose saved object predates it (issue #8917: a deployed
 * lab's stored policy had 25 entries -- no `package.name`/`package.version` -- while the installed
 * code shipped 31, and `server/routes/settings.ts` was taking `found.attributes.fieldPolicy`
 * wholesale, so those two fields had NO policy entry at all and were pseudonymized wholesale by a
 * fail-closed tool: the reported over-redaction). Pure and side-effect free -- the caller
 * (`server/routes/settings.ts`'s `getOrCreateAssistantSettings`) decides what to do with `added`
 * (log it, surface it in the settings response).
 *
 * The rule is ADD-ONLY and per-field, in this order:
 *
 * 1. A field already present in `stored` (any action, including one that overrides the shipped
 *    default) is left completely untouched. The admin's own entry always wins -- this function
 *    never edits or removes a stored entry, only ever appends ones that were missing.
 * 2. A shipped default field ABSENT from `stored` is appended UNLESS it is also present in
 *    `knownFields`. `knownFields` is the set of field keys the stored policy was already reconciled
 *    against as of the settings object's last write (see `AssistantSettingsAttributes`'s
 *    `fieldPolicyKnownFields`, stamped at every PUT with the merged view the admin was editing).
 *    A field present in `knownFields` but absent from `stored` means the admin used the Settings
 *    page's "remove" control (`handleRemoveFieldPolicyRow`) to deliberately delete that row -- that
 *    deletion must stick, not be silently reverted on the next read.
 * 3. A saved object that predates this fix entirely carries no `fieldPolicyKnownFields` at all
 *    (`knownFields` is then `[]`) -- every currently-shipped default absent from its stored policy
 *    is therefore treated as "genuinely never reached this install" and is appended. That is
 *    exactly the one-time catch-up this fix performs for an existing installation: nothing was ever
 *    deliberately removed from an object that has never been through this reconciliation before, so
 *    there is nothing to protect from being "wrongly" re-added.
 *
 * SECURITY DIRECTION IS NOT UNIFORM -- read this before changing the rule above. Appending a missing
 * entry does not uniformly increase protection:
 *
 * - On a `failClosedFieldPolicy` tool (`applyFieldPolicy`'s `isEscapeHatch` branch below), a field
 *   with NO policy entry is fail-closed pseudonymized by default. Appending a shipped default whose
 *   action is `'allow'` (most of the inventory fields are: `package.name`, `package.version`,
 *   `host.os.name`, ...) therefore REDUCES redaction for that field on that tool -- from
 *   "pseudonymized because absent" to "sent verbatim because explicitly allowed". That is the
 *   correct outcome, not a regression: the shipped default reflects reviewed intent (see the
 *   comments above each entry in `FIELD_POLICY_DEFAULTS`, e.g. "software/config IDENTITY, not a
 *   personal or infrastructure identifier"), and the whole point of #8917 is that this reviewed
 *   intent never reached an upgraded install. The over-redaction the issue reports IS this gap.
 * - Appending a shipped default whose action is `'anonymize'` or `'never'` only ever INCREASES
 *   protection: an unlisted field on a non-escape-hatch tool is allow-by-omission today, and
 *   `'anonymize'`/`'never'` newly restricts it; on an escape-hatch tool the fail-closed default is
 *   already `'anonymize'`, so a shipped `'anonymize'` default is a no-op and a shipped `'never'`
 *   default (drops the field/bucket entirely) is strictly stronger. Never a regression either way.
 * - What this function will NEVER do, in either direction, is touch a field the admin already has
 *   an explicit opinion about (rule 1: present in `stored`). That is the one case that could
 *   plausibly move protection in a direction the admin did not ask for, and it is excluded by
 *   construction from both the append and the knownFields-suppression logic above.
 */
export function mergeFieldPolicyWithDefaults(
  stored: FieldPolicyEntry[],
  defaults: FieldPolicyEntry[],
  knownFields: string[],
): { merged: FieldPolicyEntry[]; added: FieldPolicyEntry[] } {
  const storedFields = new Set(stored.map(entry => entry.field));
  const known = new Set(knownFields);
  const added = defaults.filter(
    entry => !storedFields.has(entry.field) && !known.has(entry.field),
  );
  return {
    merged: added.length > 0 ? [...stored, ...added] : stored,
    added,
  };
}

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

/** Deep-maps every string leaf of a JSON-like value through `mapFn`; objects/arrays are rebuilt,
 * everything else (number/boolean/null/undefined) passes through unchanged. Shared by
 * `Pseudonymizer.applyToObject` (real -> pseudonym, for outbound tool-call argument scrubbing) and
 * `.reverseObject` (pseudonym -> real, for inbound tool-call argument reversal). */
function deepMapStrings(
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
      out[key] = deepMapStrings(nested, mapFn);
    }
    return out;
  }
  return value;
}

/** Escapes every regex metacharacter in `value` so it can be embedded literally inside a
 * dynamically-built `RegExp` — needed by `Pseudonymizer.applyToText` below, which (unlike a plain
 * `split`/`join`) must express a word-boundary condition, and a raw attacker/data-controlled value
 * cannot be interpolated into a regex source without first escaping it. */
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
        out[key] = UNSCANNED_DIGEST_KEYS.has(key) ? value : scanValues(value);
      }
      return out;
    }
    return node;
  };
  return JSON.stringify(scanValues(parsed));
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
 * Reads the field name driving each of a digest's `breakdown` aggregations (a terms/
 * significant_terms aggregation's bucket keys), from the EXECUTED request body — the
 * response's `aggregations` tree only carries bucket keys/counts, never which field produced them,
 * so this must read the query side. Returns a map of top-level aggregation name → field (an entry
 * is `undefined` for an agg with no extractable field, e.g. a date_histogram), in the body's key
 * order — the same order digest.ts's `buildBreakdown` iterates, so the two can't drift apart.
 * Breakdown entries name their aggregation (`agg`) only in the multi-agg case; a single-agg
 * entry attributes to the map's first key.
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
 * FIELD to every digest object would change buildDigest's output even when privacy is off,
 * breaking the "privacy OFF is byte-identical to today" requirement. Computing it as a sibling
 * value in executor.ts (from the same `valved.body` it already has on hand) keeps digest.ts
 * privacy-agnostic.
 */
export function extractAggFields(
  body: Record<string, unknown> | undefined,
): Record<string, string | undefined> | undefined {
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
  const fields: Record<string, string | undefined> = {};
  for (const aggKey of aggKeys) {
    const aggDef = aggs[aggKey] as Record<string, unknown> | undefined;
    let field: string | undefined;
    // Bucket-producing types only — see the doc comment above for why metric types (cardinality
    // included) are deliberately NOT mapped.
    for (const aggType of ['terms', 'significant_terms'] as const) {
      const spec = aggDef?.[aggType] as { field?: unknown } | undefined;
      if (spec && typeof spec.field === 'string') {
        field = spec.field;
        break;
      }
    }
    fields[aggKey] = field;
  }
  return fields;
}

/**
 * Applies field policy to one digest, right before it is serialized as `toolResultContent`
 * (called from server/tools/executor.ts, immediately before `JSON.stringify`). `columns` (schema
 * hint labels) are left untouched per the design note — only data leaves through `samples`,
 * `breakdown`, and `message`.
 *
 * - `samples`: 'never' fields are dropped from the sample object entirely; 'anonymize' string
 *   values are pseudonymized (kind inferred from the field name); an explicit 'allow' field
 *   passes through unchanged. An UNLISTED field's behavior depends on `isEscapeHatch` (see
 *   below) — and, when it stays allowed (the non-escape-hatch default), its string value is
 *   still run through `prescanAndMint`'s IP/FQDN value-shape scan (#8889) so an identifier
 *   embedded in otherwise-readable free text is not missed just because the field itself is
 *   trusted.
 *   AGGREGATION samples are the one exception to "resolve by the sample's own field name": a bucket
 *   row's keys are `key`/`doc_count` (digest.ts's `bucketsToRows`), and `key` holds a VALUE of the
 *   AGGREGATED field, not of a field literally called "key". Resolving it by name matched no policy
 *   entry, so a top-agents/top-rules aggregation sent its real bucket values to the provider under
 *   `samples[].key` while `breakdown` — the same values, one key over — was correctly scrubbed.
 *   `key` is therefore resolved against `aggFields`' first aggregation field whenever there is one.
 * - `breakdown`: a bucket key's field can't be read from the digest alone (see `extractAggFields`
 *   above) — each bucket is attributed to its aggregation (the entry's `agg` name, or the first
 *   aggregation when unset — the single-agg case) and that aggregation's field is resolved against
 *   the same policy ("a top-agents terms agg leaks hostnames otherwise"). A 'never' field
 *   drops that aggregation's buckets entirely, since every bucket key IS a value of that field; a
 *   bucket whose aggregation has no extractable field (e.g. date_histogram) passes through.
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
  aggFields?: Record<string, string | undefined>,
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

  const samples = digest.samples.map(sample => {
    const out: Record<string, unknown> = {};
    for (const [sampleKey, value] of Object.entries(sample)) {
      // `sampleKey` is what the digest stays KEYED by (never rewritten — the model's view of the
      // digest shape must not change); `field` is only what the policy is resolved against.
      const field =
        sampleKey === 'key' && firstAggField ? firstAggField : sampleKey;
      const entry = resolveFieldEntry(field, policy, toolName);
      if (entry?.action === 'never') {
        continue;
      }
      if (
        entry?.action === 'anonymize' &&
        typeof value === 'string' &&
        value.length > 0
      ) {
        out[sampleKey] = pseudonymizer.pseudonymize(
          value,
          entry.kind ?? inferPseudonymKind(field),
        );
      } else if (
        !entry &&
        isEscapeHatch &&
        typeof value === 'string' &&
        value.length > 0
      ) {
        // Fail-closed: no explicit policy entry for this field, but the escape hatch can
        // surface any finding field, so an unlisted one is NOT trusted as safe-by-omission here.
        out[sampleKey] = pseudonymizer.pseudonymize(
          value,
          inferPseudonymKind(field),
        );
      } else if (!entry && typeof value === 'string' && value.length > 0) {
        // #8889: allow-BY-OMISSION (typed tool, no explicit policy entry — the escape-hatch case
        // above already handled isEscapeHatch). The value still reaches the provider verbatim,
        // same as before, but an IP/FQDN embedded in otherwise-free text (e.g. a package/process
        // name that happens to mention a hostname) previously had no secondary scan at all.
        // Deliberately narrower than "every allow-resolved value": an EXPLICIT policy entry
        // (agent id, MITRE technique IDs — which use dotted sub-technique notation like
        // "T1059.001" —, compliance citations, CIS benchmark content, ...) is a reviewed, curated
        // decision (see FIELD_POLICY_DEFAULTS' comments above) and several of those values are
        // legitimately FQDN-token-shaped without being hostnames; scanning them here too would
        // misfire. Those stay covered end-to-end regardless: chat.ts's scrubMessagesForProvider
        // runs prescanAndMintToolContent over every tool-result string value, regardless of field
        // policy, right before the request leaves the server. Bare single-word identifiers are
        // still not caught here (see prescanAndMint's own doc comment) — only the
        // embedded-IP/FQDN case closes.
        out[sampleKey] = prescanAndMint(value, pseudonymizer);
      } else {
        out[sampleKey] = value;
      }
    }
    return out;
  });

  let breakdown = digest.breakdown;
  if (breakdown && aggFields) {
    const firstAggName = Object.keys(aggFields)[0];
    const scrubbed: NonNullable<Digest['breakdown']> = [];
    for (const bucket of breakdown) {
      const field = aggFields[bucket.agg ?? firstAggName];
      if (!field) {
        scrubbed.push(bucket);
        continue;
      }
      const entry = resolveFieldEntry(field, policy, toolName);
      if (entry?.action === 'never') {
        continue;
      }
      if (entry?.action === 'anonymize') {
        const kind = entry.kind ?? inferPseudonymKind(field);
        scrubbed.push({
          ...bucket,
          key: pseudonymizer.pseudonymize(bucket.key, kind),
        });
      } else if (!entry && isEscapeHatch) {
        // Same fail-closed default as the samples loop above, applied to bucket keys.
        scrubbed.push({
          ...bucket,
          key: pseudonymizer.pseudonymize(
            bucket.key,
            inferPseudonymKind(field),
          ),
        });
      } else if (!entry) {
        // #8889: same allow-by-omission value-shape scan as the samples loop above (see that
        // branch's comment), applied to bucket keys — each bucket key IS a value of the
        // aggregated field.
        scrubbed.push({
          ...bucket,
          key: prescanAndMint(bucket.key, pseudonymizer),
        });
      } else {
        scrubbed.push(bucket);
      }
    }
    // Assigned unconditionally, empty result included: an empty array means a 'never' entry
    // dropped every bucket, and the caller must then see NO breakdown at all. Falling back to
    // `digest.breakdown` here would restore the raw, unscrubbed buckets.
    breakdown = scrubbed;
  }

  const scrubbedDigest: Digest = {
    ...digest,
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
  }

  return scrubbedDigest;
}
