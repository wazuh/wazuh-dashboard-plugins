import { TableSpec } from '../../common/types';
import { Digest } from './digest';

/**
 * Privacy mode: reversible pseudonymization at
 * the digest boundary. Everything in this module is pure/stateless-per-instance — no module-level
 * caches — so it is safe to construct fresh per HTTP request (see server/routes/chat.ts).
 *
 * The three actions do NOT all act at the same boundary, and the difference is deliberate:
 *
 * - `anonymize` is a MODEL-boundary control. The pseudonym map is reversible and stays inside the
 *   deployment, so the value must still be retrieved and still renders in clear text in the locally
 *   rendered result table — that is the whole point of pseudonymizing rather than dropping: the
 *   analyst keeps their data, the provider only ever sees `HOST_1`.
 * - `never` is a RETRIEVAL control. Nothing that is never allowed to leave should be fetched in the
 *   first place, so the field is stripped from the outbound query's projections
 *   (`applyProjectionPolicy`) and from the rendered table (`applyTablePolicy`) as well as from the
 *   digest (`applyFieldPolicy`).
 * - `allow` (also the default for an unlisted field on a typed tool) acts nowhere.
 */

export type FieldPolicyAction = 'allow' | 'anonymize' | 'never';

export interface FieldPolicyEntry {
  /** Either a plain digest field path ("agent.name", "GeoLocation.*") or a tool-scoped form
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

/**
 * Curated defaults. `full_log` is 'never' (Never-send: stripped from the digest entirely);
 * everything else here is 'anonymize'. `GeoLocation.*` uses the trailing `.*` prefix-match
 * convention (matches "GeoLocation" itself or any "GeoLocation.<subfield>").
 *
 * `data.username` is deliberately singular. A plural `data.usernames` variant could not be
 * confirmed against the wazuh-dashboard-plugins known-fields cache, and inventing a field name
 * that does not exist would add a policy entry that silently never matches.
 */
export const FIELD_POLICY_DEFAULTS: FieldPolicyEntry[] = [
  { field: 'agent.name', action: 'anonymize' },
  { field: 'agent.ip', action: 'anonymize' },
  // Wazuh 5.0 ECS rename: the states/inventory families carry the
  // agent identity under `wazuh.agent.*`. The retargeted vulnerability tools' digests emit
  // `wazuh.agent.name`; keep the bare `agent.*` entries above too, since alert tools not yet moved
  // off wazuh-alerts-* still emit those during the transition.
  { field: 'wazuh.agent.name', action: 'anonymize', kind: 'HOST' },
  { field: 'wazuh.agent.id', action: 'allow' },
  { field: 'data.srcip', action: 'anonymize' },
  { field: 'data.dstip', action: 'anonymize' },
  { field: 'data.srcuser', action: 'anonymize' },
  { field: 'data.dstuser', action: 'anonymize' },
  { field: 'data.username', action: 'anonymize' },
  { field: 'predecoder.hostname', action: 'anonymize' },
  { field: 'GeoLocation.*', action: 'anonymize' },
  { field: 'data.url', action: 'anonymize' },
  { field: 'full_log', action: 'never' },
  // Every field the row/digest widening (server/tools/catalog/common.ts's
  // ALERT_INVESTIGATION_ROW_FIELDS/ALERT_DIGEST_EXTRA_COLUMNS) exposes to the model must be
  // classified here.
  // `data.srcip`/`data.srcuser`/`data.dstuser` are already covered above (anonymize, kind inferred
  // as IP/USER from the field name). `data.command` can embed hostnames/paths/usernames — VAL (not
  // USER/HOST) since it is free-text shell input, not a single identifier. `rule.groups`,
  // `rule.mitre.id`, and `predecoder.program_name` are curated taxonomy/decoder fields, not
  // analyst-supplied data — explicit 'allow' entries so a future audit sees them as reviewed, not
  // merely unlisted.
  { field: 'data.command', action: 'anonymize', kind: 'VAL' },
  { field: 'rule.groups', action: 'allow' },
  { field: 'rule.mitre.id', action: 'allow' },
  { field: 'predecoder.program_name', action: 'allow' },
  // Manager-API tools carry bare, generic digest field names ("name", "ip") that must be scoped
  // per tool: "name" is an agent hostname here but a package name in get_agent_packages (which
  // must stay readable for the model to be useful).
  { field: 'get_active_agents/name', action: 'anonymize', kind: 'HOST' },
  { field: 'get_active_agents/ip', action: 'anonymize', kind: 'IP' },
  { field: 'get_disconnected_agents/name', action: 'anonymize', kind: 'HOST' },
  { field: 'get_disconnected_agents/ip', action: 'anonymize', kind: 'IP' },
  // Wazuh 5.0 rewrites: the syscollector/SCA tools moved from bare
  // Manager JSON names to ECS Indexer paths, so the old tool-scoped entries
  // (get_agent_os/hostname, get_agent_ports/local.ip + remote.ip, get_agent_processes/euser +
  // ruser, get_sca_checks/*) were replaced by the BARE entries below — the ECS paths are
  // unambiguous across tools (host.hostname is always a hostname, source.ip always an IP), so
  // tool scoping is no longer needed, and the same entries will cover the alert tools once they
  // move to the findings index (same ECS namespace). euser/ruser died with 4.14 (no owner field
  // in 5.0 process inventory — see get-agent-processes.ts).
  { field: 'host.hostname', action: 'anonymize', kind: 'HOST' },
  { field: 'source.ip', action: 'anonymize', kind: 'IP' },
  { field: 'destination.ip', action: 'anonymize', kind: 'IP' },
  { field: 'source.user.name', action: 'anonymize', kind: 'USER' },
  { field: 'destination.user.name', action: 'anonymize', kind: 'USER' },
  { field: 'process.command_line', action: 'anonymize', kind: 'VAL' },
  { field: 'file.owner', action: 'anonymize', kind: 'USER' },
  // Curated rule taxonomy / MITRE catalog / compliance requirements on findings-v5 (Wave 3):
  // not analyst/attacker-supplied — reviewed 'allow', replacing the 4.14 rule.groups/rule.mitre.id
  // entries below (kept inert for the not-yet-migrated escape-hatch paths).
  { field: 'rule.tags', action: 'allow' },
  { field: 'rule.category', action: 'allow' },
  { field: 'rule.compliance.pci_dss', action: 'allow' },
  { field: 'rule.mitre.technique.id', action: 'allow' },
  { field: 'rule.mitre.technique.name', action: 'allow' },
  { field: 'rule.mitre.tactic.name', action: 'allow' },
  // Curated benchmark/policy content (CIS etc.), not analyst/attacker-supplied — reviewed 'allow'
  // (same rationale as the 4.14 get_sca_checks/* entries these replace).
  { field: 'check.id', action: 'allow' },
  { field: 'check.name', action: 'allow' },
  { field: 'check.result', action: 'allow' },
  { field: 'policy.name', action: 'allow' },
  // get_agent_packages/name, get_agent_processes/name+cmd, get_sca_results/name are deliberately
  // NOT anonymized: package/process/policy names are what the analyst asked about, and known
  // mapped identifiers embedded in free text (e.g. a hostname inside a cmd path) are still caught
  // by the outbound applyToText scrub in chat.ts.
  // MITRE tactic and vulnerability CVSS/architecture fields: `rule.mitre.tactic` and the vulnerability/package fields are
  // curated taxonomy/public-CVE-database data (like `rule.mitre.id`/`vulnerability.severity`
  // above), not analyst/attacker-supplied text, so they are 'allow'.
  { field: 'rule.mitre.tactic', action: 'allow' },
  { field: 'vulnerability.score.base', action: 'allow' },
  { field: 'package.architecture', action: 'allow' },
  // syscheck.uname_after (4.14 FIM "who changed it") died with get_fim_events — the 5.0 states
  // surface has no equivalent; get_fim_files' file.owner is classified above. The old tool-scoped
  // get_agent_ports/remote.ip, get_agent_processes/euser+ruser and get_sca_checks/* entries were
  // likewise replaced by the bare ECS entries above (see the 5.0-rewrites comment block).
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
  if (
    lower.includes('hostname') ||
    lower === 'agent.name' ||
    lower.endsWith('.name')
  ) {
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
 * appear in a tool result field like `agent.name`). `\b`-anchored on both ends so a trailing
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
 * `agent.name`/`predecoder.hostname`) — this pre-scan only closes the gap for the analyst's own
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
 * serialized digest whose KEYS are dotted ECS field paths ("wazuh.agent.name",
 * "rule.mitre.technique.id"). Running the flat text scan over that JSON would match those keys as
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

/** Effective action for `field` under `policy` — `'allow'` when no entry matches, since an
 * unlisted field is allowed by omission (the escape hatch's fail-closed default is a digest-only
 * concern, see `applyFieldPolicy`). Exported for the retrieval/display passes below, which need the
 * action for a bare field path rather than the whole entry. */
export function resolveFieldAction(
  field: string,
  policy: FieldPolicyEntry[],
  toolName?: string,
): FieldPolicyAction {
  return resolveFieldEntry(field, policy, toolName)?.action ?? 'allow';
}

/**
 * The `_source`-style exclude patterns covering every 'never' entry that applies to `toolName`.
 * A tool-scoped entry ("get_active_agents/name") contributes only for its own tool, and only its
 * bare field part — scoping exists to disambiguate identical Manager field names across tools, and
 * that distinction is already made by the time we know which tool is executing. A prefix entry
 * ("GeoLocation.*") contributes BOTH "GeoLocation" and "GeoLocation.*": OpenSearch's `.*` matches
 * subfields only, so the parent has to be listed separately or a scalar `GeoLocation` would survive.
 */
function neverFieldExcludes(
  policy: FieldPolicyEntry[],
  toolName?: string,
): string[] {
  const patterns: string[] = [];
  for (const entry of policy) {
    if (entry.action !== 'never') {
      continue;
    }
    let field = entry.field;
    const separator = field.indexOf('/');
    if (separator !== -1) {
      if (!toolName || field.slice(0, separator) !== toolName) {
        continue;
      }
      field = field.slice(separator + 1);
    }
    if (field.endsWith('.*')) {
      const prefix = field.slice(0, -2);
      patterns.push(prefix, `${prefix}.*`);
    } else {
      patterns.push(field);
    }
  }
  return [...new Set(patterns)];
}

/** Projection keys (besides `_source`) whose value is a list of field names — none of the typed
 * catalog tools use them today, but the search_wazuh_data escape hatch forwards whatever body the
 * model produced, so a 'never' field must not be reachable through them either. */
const PROJECTION_LIST_KEYS = new Set([
  'docvalue_fields',
  'stored_fields',
  'fields',
]);

/** Drops every 'never' field name from one projection list — a bare `string[]`, a lone string, or
 * the `{field}`-object form `docvalue_fields`/`fields` also accept. Any other shape passes through
 * untouched rather than being guessed at. */
function filterProjectionList(
  value: unknown,
  isNever: (field: string) => boolean,
): unknown {
  if (typeof value === 'string') {
    return isNever(value) ? [] : value;
  }
  if (!Array.isArray(value)) {
    return value;
  }
  return value.filter(item => {
    if (typeof item === 'string') {
      return !isNever(item);
    }
    const field = (item as { field?: unknown } | null)?.field;
    return typeof field === 'string' ? !isNever(field) : true;
  });
}

/** Rewrites one `_source` value, whatever form it took: a list/string of includes, or the
 * `{includes, excludes}` object form (whose `includes` are filtered and whose `excludes` gain the
 * never patterns). `false` is returned untouched — it already retrieves nothing. */
function filterSourceValue(
  value: unknown,
  isNever: (field: string) => boolean,
  excludes: string[],
): unknown {
  if (value === false) {
    return value;
  }
  if (value === true || value === undefined) {
    return { excludes };
  }
  if (typeof value === 'string' || Array.isArray(value)) {
    // Shape-preserving on purpose: digest.ts's `deriveResultColumns` reads a plain `string[]`
    // `_source` to name the escape hatch's columns, and rewriting it to the object form would
    // silently fall back to key-union derivation. A wildcard include (e.g. "data.*") left in the
    // list can still fetch a 'never' field, but it can never SHOW one: the derived column is the
    // literal "data.*" path, which resolves to undefined in every row.
    return filterProjectionList(value, isNever);
  }
  if (value && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const previousExcludes = filterProjectionList(
      source.excludes ?? [],
      () => false,
    ) as unknown[];
    return {
      ...source,
      ...(source.includes === undefined
        ? {}
        : { includes: filterProjectionList(source.includes, isNever) }),
      excludes: [
        ...new Set([
          ...previousExcludes.filter(item => typeof item === 'string'),
          ...excludes,
        ]),
      ],
    };
  }
  return value;
}

/**
 * Retrieval half of the 'never' action: returns a copy of the executed Indexer body with every
 * 'never' field removed from its projections, so the value is never fetched from the indexer at all
 * rather than fetched and filtered afterwards.
 *
 * Both directions matter. Where a tool declares an explicit `_source` list, the never fields are
 * removed from it. Where it declares NONE (the alert-hits tools retrieve whole documents), an
 * `_source.excludes` is added — otherwise a 'never' field like `full_log` still comes back on the
 * wire even though nothing downstream displays it. Nested `_source` keys are rewritten too (a
 * `top_hits` sub-aggregation has its own).
 *
 * `query`/`aggs` clauses are deliberately NOT touched: a policy entry says a field's VALUES must not
 * be projected out, not that the field may not be used as a filter — rejecting the query would turn
 * a privacy setting into a silent capability outage. An aggregation OVER a 'never' field is a
 * projection in disguise (bucket keys are values), and that case is handled where the results are
 * shaped: `applyFieldPolicy` drops those buckets from the digest and `applyTablePolicy` drops them
 * from the table.
 *
 * Returns `body` itself (same reference) when the policy has no applicable 'never' entry, so a
 * policy without one leaves the executed request byte-identical.
 */
export function applyProjectionPolicy(
  body: Record<string, unknown>,
  policy: FieldPolicyEntry[],
  toolName?: string,
): Record<string, unknown> {
  const excludes = neverFieldExcludes(policy, toolName);
  if (excludes.length === 0) {
    return body;
  }
  const isNever = (field: string): boolean =>
    resolveFieldAction(field, policy, toolName) === 'never';

  const rewrite = (node: unknown): unknown => {
    if (Array.isArray(node)) {
      return node.map(rewrite);
    }
    if (!node || typeof node !== 'object') {
      return node;
    }
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(
      node as Record<string, unknown>,
    )) {
      if (key === '_source') {
        out[key] = filterSourceValue(value, isNever, excludes);
      } else if (PROJECTION_LIST_KEYS.has(key)) {
        out[key] = filterProjectionList(value, isNever);
      } else {
        out[key] = rewrite(value);
      }
    }
    return out;
  };

  const rewritten = rewrite(body) as Record<string, unknown>;
  if (rewritten._source === undefined) {
    // No `_source` anywhere in the body: the search returns whole documents, so the excludes have
    // to be introduced rather than merely filtered.
    rewritten._source = { excludes };
  }
  return rewritten;
}

/**
 * Display half of the 'never' action: drops every 'never' field from the `table` StreamEvent — its
 * column list, each row's keys (visible columns AND the row-only investigation fields the row
 * expander reveals), and `severityColumn` if that column itself went away.
 *
 * 'anonymize' fields are deliberately left in clear text: the table renders locally in the browser
 * and never reaches the provider, and the pseudonym map is reversible by design — a table of
 * `HOST_1`/`IP_3` would cost the analyst their data for no privacy gain. See this module's header.
 *
 * `aggFields` (when given) covers the aggregation-table case, where a row's keys are `key`/
 * `doc_count` rather than field paths and per-column resolution therefore can't see the underlying
 * field: if the FIRST top-level aggregation's field is 'never', every bucket key IS a value of that
 * field, so the rows are dropped entirely. Only the first aggregation is consulted because that is
 * the only one `buildTableSpec` renders (documented in search_wazuh_data.ts).
 */
export function applyTablePolicy(
  spec: TableSpec,
  policy: FieldPolicyEntry[],
  toolName?: string,
  aggFields?: Record<string, string | undefined>,
): TableSpec {
  const isNever = (field: string): boolean =>
    resolveFieldAction(field, policy, toolName) === 'never';

  const firstAggField = aggFields
    ? aggFields[Object.keys(aggFields)[0]]
    : undefined;
  if (firstAggField && isNever(firstAggField)) {
    return { ...spec, columns: spec.columns, rows: [] };
  }

  const columns = spec.columns.filter(column => !isNever(column.id));
  if (
    columns.length === spec.columns.length &&
    !spec.rows.some(row => Object.keys(row).some(isNever))
  ) {
    return spec;
  }

  const rows = spec.rows.map(row => {
    const out: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(row)) {
      if (!isNever(field)) {
        out[field] = value;
      }
    }
    return out;
  });

  const next: TableSpec = { ...spec, columns, rows };
  if (next.severityColumn && isNever(next.severityColumn)) {
    delete next.severityColumn;
  }
  return next;
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
    Record<string, unknown> | undefined;
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
    // `columns` is a schema hint naming the columns of the table already rendered to the user, so it
    // has to agree with what that table shows: `applyTablePolicy` drops 'never' columns from the
    // table, and advertising them here would describe a column the analyst cannot see. 'anonymize'
    // and 'allow' column labels stay untouched — they are field PATHS, not data (the same reason
    // prescanAndMintToolContent leaves them unscanned).
    columns: digest.columns.filter(
      column => resolveFieldAction(column, policy, toolName) !== 'never',
    ),
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
