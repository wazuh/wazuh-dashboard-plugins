import { Digest } from './digest';
import { WAZUH_FIELD } from '../../common/wazuh-fields';

/**
 * Privacy mode: reversible pseudonymization at
 * the digest boundary. Everything in this module is pure/stateless-per-instance — no module-level
 * caches — so it is safe to construct fresh per HTTP request (see server/routes/chat.ts).
 */

export type FieldPolicyAction = 'allow' | 'anonymize' | 'never';

export interface FieldPolicyEntry {
  /** Either a plain digest field path ("wazuh.agent.name") or a tool-scoped form
   * ("get_active_agents/name") for Manager-API tools whose digest fields are bare, generic names
   * ("name" means an agent hostname in get_active_agents but a package name in
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
  { field: 'get_active_agents/name', action: 'anonymize', kind: 'HOST' },
  { field: 'get_active_agents/ip', action: 'anonymize', kind: 'IP' },
  { field: 'get_disconnected_agents/name', action: 'anonymize', kind: 'HOST' },
  { field: 'get_disconnected_agents/ip', action: 'anonymize', kind: 'IP' },
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
  { field: WAZUH_FIELD.RULE_COMPLIANCE_PCI_DSS, action: 'allow' },
  { field: WAZUH_FIELD.RULE_MITRE_TECHNIQUE_ID, action: 'allow' },
  { field: WAZUH_FIELD.RULE_MITRE_TECHNIQUE_NAME, action: 'allow' },
  { field: WAZUH_FIELD.RULE_MITRE_TACTIC, action: 'allow' },
  { field: WAZUH_FIELD.RULE_MITRE_TACTIC_NAME, action: 'allow' },
  // Curated benchmark/policy content (CIS etc.), not analyst/attacker-supplied — reviewed 'allow'.
  { field: 'check.id', action: 'allow' },
  { field: 'check.name', action: 'allow' },
  { field: 'check.result', action: 'allow' },
  { field: 'policy.name', action: 'allow' },
  // get_agent_packages/name, get_agent_processes/name+cmd, get_sca_results/name are deliberately
  // NOT anonymized: package/process/policy names are what the analyst asked about, and known
  // mapped identifiers embedded in free text (e.g. a hostname inside a cmd path) are still caught
  // by the outbound applyToText scrub in chat.ts.
  { field: 'vulnerability.score.base', action: 'allow' },
  { field: 'package.architecture', action: 'allow' },
];

export type PseudonymKind = 'HOST' | 'IP' | 'USER' | 'URL' | 'VAL';

const PSEUDONYM_KINDS: PseudonymKind[] = ['HOST', 'IP', 'USER', 'URL', 'VAL'];

/** One client-held (or server-minted) pseudonym mapping entry; the wire shape of `privacy.map`
 * on the chat request body and of the `privacy_map` SSE event's `entries` (see common/types.ts). */
export interface PseudonymEntry {
  value: string;
  pseudonym: string;
}

/** Infers which pseudonym kind a field name should mint, from the field name alone ("kind
 * inferred from field name"). Checked in this order so a field matching more than one heuristic
 * (there are none in FIELD_POLICY_DEFAULTS today) resolves predictably; falls back to the generic
 * `VAL` kind (used by e.g. `GeoLocation.*`, which is neither a host/ip/user/url). */
export function inferPseudonymKind(field: string): PseudonymKind {
  const lower = field.toLowerCase();
  if (lower.includes('url')) {
    return 'URL';
  }
  if (lower.includes('ip')) {
    return 'IP';
  }
  if (lower.includes('user')) {
    return 'USER';
  }
  if (lower.includes('hostname') || lower.endsWith('.name')) {
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

  /** Replaces every known REAL value with its pseudonym, longest-value-first so a shorter value
   * that happens to be a substring of a longer one (e.g. "10.0.0.1" inside "10.0.0.10") is never
   * substituted first and left corrupting the longer value. Uses plain `split`/`join` rather than
   * a regex built from the (unescaped, attacker/data-controlled) value — sidesteps regex-escaping
   * entirely instead of trying to get it right. */
  applyToText(text: string): string {
    if (!text || this.valueToPseudonym.size === 0) {
      return text;
    }
    const values = [...this.valueToPseudonym.keys()].sort(
      (a, b) => b.length - a.length,
    );
    let out = text;
    for (const value of values) {
      if (!out.includes(value)) {
        continue;
      }
      out = out.split(value).join(this.valueToPseudonym.get(value) as string);
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
  out = out.replace(FQDN_TOKEN_RE, token => {
    if (ALL_NUMERIC_DOTTED_RE.test(token)) {
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
 */
const UNSCANNED_DIGEST_KEYS = new Set(['columns']);

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
 * `.*` prefix match (e.g. "GeoLocation.*" matches "GeoLocation" itself and
 * "GeoLocation.country_name"). First matching entry wins; `undefined` (no matching policy entry)
 * means "allow" by omission. */
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
 * significant_terms/cardinality aggregation's bucket keys), from the EXECUTED request body — the
 * response's `aggregations` tree only carries bucket keys/counts, never which field produced them,
 * so this must read the query side. Returns a map of top-level aggregation name → field (an entry
 * is `undefined` for an agg with no extractable field, e.g. a date_histogram), in the body's key
 * order — the same order digest.ts's `buildBreakdown` iterates, so the two can't drift apart.
 * Breakdown entries name their aggregation (`agg`) only in the multi-agg case; a single-agg
 * entry attributes to the map's first key.
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
    for (const aggType of [
      'terms',
      'significant_terms',
      'cardinality',
    ] as const) {
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
 *   values are pseudonymized (kind inferred from the field name); 'allow' fields pass through
 *   unchanged. An UNLISTED field's behavior depends on `isEscapeHatch` (see below).
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
 * `FIELD_POLICY_DEFAULTS`, so "unlisted = allow" was a safe default — but the search_wazuh_data
 * escape hatch's `deriveColumns` can pick ANY alert field into `samples`/`breakdown` (data.win.*,
 * data.office365.*, data.aws.*, syscheck.path, ...), and every one of those was passing through
 * untouched under privacy mode, defeating the guarantee for the one tool built to reach arbitrary
 * fields. When the caller sets `isEscapeHatch: true` (deriveColumns tools only — threaded from
 * `ToolDefinition.deriveColumns` at the executor.ts call site), an UNLISTED string field's default
 * flips from allow to anonymize (kind inferred from the field name, same as an explicit 'anonymize'
 * entry with no `kind`) — fail-closed: pseudonymize anything not explicitly allow-listed. A field
 * explicitly present in the policy (any action, including 'allow') is unaffected either way — this
 * only changes the *default for an absent entry*. Typed tools (the default, `isEscapeHatch` false
 * or omitted) keep today's allow-by-omission behavior exactly.
 */
export function applyFieldPolicy(
  digest: Digest,
  policy: FieldPolicyEntry[],
  pseudonymizer: Pseudonymizer,
  aggFields?: Record<string, string | undefined>,
  toolName?: string,
  isEscapeHatch = false,
): Digest {
  const samples = digest.samples.map(sample => {
    const out: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(sample)) {
      const entry = resolveFieldEntry(field, policy, toolName);
      if (entry?.action === 'never') {
        continue;
      }
      if (
        entry?.action === 'anonymize' &&
        typeof value === 'string' &&
        value.length > 0
      ) {
        out[field] = pseudonymizer.pseudonymize(
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
        // surface any alert field, so an unlisted one is NOT trusted as safe-by-omission here.
        out[field] = pseudonymizer.pseudonymize(
          value,
          inferPseudonymKind(field),
        );
      } else {
        out[field] = value;
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
