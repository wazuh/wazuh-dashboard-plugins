import assert from 'node:assert/strict';
import {
  Pseudonymizer,
  StreamDepseudonymizer,
  inferPseudonymKind,
  applyFieldPolicy,
  extractAggFields,
  AggFieldSpec,
  prescanAndMint,
  prescanAndMintToolContent,
  scrubKnownEntities,
  scrubFieldValue,
  FieldPolicyEntry,
  FIELD_POLICY_DEFAULTS,
  IDENTIFIER_BEARING_FREE_TEXT_FIELDS,
  PREMINT_HOST_FIELDS,
} from './privacy';
import { Digest } from './digest';
import { WAZUH_FIELD } from '../../common/wazuh-fields';

/** Test-only shorthand for the common `terms`/`significant_terms`/`cardinality` case of
 * `AggFieldSpec` — every pre-existing test here predates `multi_terms`/`composite` support and
 * only ever needs this one shape. */
function scalarSpec(field: string): AggFieldSpec {
  return { kind: 'scalar', field };
}

// --- prescanAndMint (first-mention inbound pre-scan) ------------------------------------------

test('prescanAndMint: pseudonymizes an IPv4 address and is reversible', () => {
  const p = new Pseudonymizer();
  const out = prescanAndMint('why is 10.0.2.15 noisy?', p);
  assert.match(out, /IP_\d+/);
  assert.doesNotMatch(out, /10\.0\.2\.15/);
  const token = out.match(/IP_\d+/)![0];
  assert.equal(p.reverseText(token), '10.0.2.15');
});

test('prescanAndMint: pseudonymizes an FQDN but leaves bare words untouched', () => {
  const p = new Pseudonymizer();
  const out = prescanAndMint('the server webserver.corp.local is down', p);
  assert.match(out, /HOST_\d+/);
  assert.doesNotMatch(out, /webserver\.corp\.local/);
  // "server" / "is" / "down" are ordinary prose — must NOT be pseudonymized.
  assert.match(out, /\bthe server\b/);
});

test('prescanAndMint: leaves plain version/decimal dotted numbers untouched', () => {
  const p = new Pseudonymizer();
  const out = prescanAndMint('upgrade to 4.14.6 please', p);
  assert.equal(out, 'upgrade to 4.14.6 please');
});

test('prescanAndMint: a repeated value maps to the same pseudonym (stable)', () => {
  const p = new Pseudonymizer();
  const first = prescanAndMint('host.example.com', p);
  const second = prescanAndMint('again host.example.com', p);
  const t1 = first.match(/HOST_\d+/)![0];
  const t2 = second.match(/HOST_\d+/)![0];
  assert.equal(t1, t2);
});

test('prescanAndMint: leaves an ISO-8601 timestamp fragment untouched (29.000Z)', () => {
  const p = new Pseudonymizer();
  const out = prescanAndMint('at 2026-07-15T21:59:29.000Z something', p);
  assert.doesNotMatch(out, /HOST_\d+/);
  assert.match(out, /29\.000Z/);
});

test('prescanAndMint: leaves a dotted MITRE sub-technique id untouched (T1059.001)', () => {
  // Issue #8920 item 2: the technique-id breakdown ("T1059: 3, T1059.001: 9") is the rollup's
  // disclosure surface. "T1059.001" is FQDN-token-shaped, so without TECHNIQUE_ID_TOKEN_RE the
  // outbound scan minted it as HOST_n and the model received an unreadable split. A hostname is
  // NOT newly skipped: the exclusion requires "T"+digits then all-digit labels, which no real
  // FQDN (alphabetic TLD) satisfies.
  const p = new Pseudonymizer();
  const out = prescanAndMint('findings for T1059.001 rose sharply', p);
  assert.equal(out, 'findings for T1059.001 rose sharply');
  assert.equal(p.newEntries().length, 0);
});

test('prescanAndMintToolContent: a technique-id breakdown survives privacy intact', () => {
  const p = new Pseudonymizer();
  const digestJson = JSON.stringify({
    tool: 'get_mitre_findings',
    counts: { total: 12, returned: 12, truncated: false },
    breakdown: [
      { key: 'T1059', count: 3 },
      { key: 'T1059.001', count: 9 },
    ],
    samples: [],
    columns: ['wazuh.rule.mitre.technique.id'],
  });
  const out = prescanAndMintToolContent(digestJson, p);
  assert.equal(out, digestJson);
  assert.equal(p.newEntries().length, 0);
});

// --- prescanAndMint: #8889 dotted-token scanner narrowing --------------------------------------

test('prescanAndMint: leaves a field-path mention (wazuh.agent.name) untouched', () => {
  const p = new Pseudonymizer();
  // Before this fix, naming a dotted field in free text ("what is wazuh.agent.name for host X?")
  // got that mention replaced with a HOST_n, breaking the user's own query.
  const out = prescanAndMint('what does wazuh.agent.name look like here?', p);
  assert.doesNotMatch(out, /HOST_\d+/);
  assert.match(out, /wazuh\.agent\.name/);
});

test('prescanAndMint: leaves another field-path mention (wazuh.rule.id) untouched', () => {
  const p = new Pseudonymizer();
  const out = prescanAndMint('filter on wazuh.rule.id please', p);
  assert.doesNotMatch(out, /HOST_\d+/);
  assert.match(out, /wazuh\.rule\.id/);
});

test('prescanAndMint: leaves a Debian/Ubuntu-style package version string untouched', () => {
  const p = new Pseudonymizer();
  // Before this fix, a version string like this minted a bogus HOST_n, undermining a
  // package.version:{allow} query about the same package.
  const out = prescanAndMint('openssl 5.2.5-2ubuntu1 is installed', p);
  assert.doesNotMatch(out, /HOST_\d+/);
  assert.match(out, /5\.2\.5-2ubuntu1/);
});

test('prescanAndMint: still mints a real hostname that is not field-path or version shaped', () => {
  const p = new Pseudonymizer();
  const out = prescanAndMint('connect to backup-vault.internal.corp now', p);
  assert.match(out, /HOST_\d+/);
  assert.doesNotMatch(out, /backup-vault\.internal\.corp/);
});

// --- prescanAndMint: #1529 schema-vocabulary widening (WCS catalog) ---------------------------
//
// The reported corruption: the field policy curates ~10 fields, so `FIELD_PATH_WORDS` only knew
// THOSE paths' words and every other indexed field name was minted as a hostname. Wire capture:
//   "samples": [{"wazuh.agent.name":"HOST_5","HOST_4":"ai-qa-aio-node"}],
//   "columns": ["HOST_1","HOST_2","HOST_3","wazuh.agent.name","HOST_4"]
// with related.hosts -> HOST_1, related.ip -> HOST_2, related.user -> HOST_3,
// wazuh.cluster.node -> HOST_4. The vocabulary is now unioned with `FIELD_CATALOG`, so a token
// whose every '.'-segment is a known SCHEMA word is never minted.

test('prescanAndMint: leaves the #1529 reported field names untouched', () => {
  for (const fieldName of [
    'related.hosts',
    'related.ip',
    'related.user',
    'wazuh.cluster.node',
    // The sibling that already survived — pinned so the union cannot regress it.
    'wazuh.cluster.name',
  ]) {
    const p = new Pseudonymizer();
    const out = prescanAndMint(`the ${fieldName} column is empty`, p);
    assert.doesNotMatch(out, /HOST_\d+/, `${fieldName} was minted`);
    assert.ok(out.includes(fieldName), `${fieldName} was rewritten`);
    assert.equal(p.newEntries().length, 0);
  }
});

test('prescanAndMint: a whole digest columns hint survives the schema vocabulary', () => {
  const p = new Pseudonymizer();
  const columnsHint =
    '["related.hosts","related.ip","related.user","wazuh.agent.name","wazuh.cluster.node"]';
  assert.equal(prescanAndMint(columnsHint, p), columnsHint);
  assert.equal(p.newEntries().length, 0);
});

test('prescanAndMint: schema vocabulary still mints real dotted hostname VALUES', () => {
  // The safety property: the WCS catalog is consulted as WHOLE PATHS, so a value can only be
  // spared by the small curated-word vocabulary — never by a catalog path's segment words.
  for (const hostname of [
    'ai-qa-aio-node.corp.example.com',
    'lists.ubuntu.com',
    // Leading labels ARE schema words ("host", "agent", "user", "process"); the suffixes are not.
    'host.agent.local',
    'user.process.internal',
    'agent.name.example.net',
    // QA regression guard: these are assembled ENTIRELY from WCS path segment words — "server" /
    // "home", "data" / "io" ("io" is also a real TLD, ".home" a real router-assigned local
    // suffix), "dns" / "cloud" / "host". Had the catalog been flattened into the ALL-segments
    // vocabulary instead of matched whole-path, every segment would have counted as "known" and
    // these would have stopped being pseudonymized. None is a field path, so all must still mint.
    'server.home',
    'data.io',
    'dns.cloud.host',
  ]) {
    const p = new Pseudonymizer();
    const out = prescanAndMint(`connect to ${hostname} now`, p);
    assert.match(out, /HOST_\d+/, `${hostname} was not minted`);
    assert.ok(!out.includes(hostname), `${hostname} survived verbatim`);
  }
});

// --- prescanAndMint / prescanAndMintToolContent: #8920 item 8 version-grammar coverage --------
//
// The reported instances were two Ubuntu `dpkg -l` versions ("3.118ubuntu5",
// "3.20191218.1ubuntu2.3") that got minted as HOST_n because VERSION_LIKE_TOKEN_RE only recognized
// digit-only dot-labels, not the full Debian/RPM grammar (letters fused into a label, "~"/"+" in a
// revision suffix). The class is the whole grammar, not those two strings, so these two corpora are
// data-driven tables: a newly observed version scheme or hostname shape is a one-line addition, and
// what's asserted per row never changes (never-minted vs always-minted, both directions pinned via
// `newEntries()` so a silent partial mint can't pass). Each corpus is run through BOTH the flat-text
// scanner (`prescanAndMint`, this section) and the JSON-aware one (`prescanAndMintToolContent`,
// below) since the two boundaries have independent code paths.

/** Real Debian/RPM/semver version strings. Every one of these must reach the model UNCHANGED —
 * minting a HOST_n for a version string breaks a `package.version:{allow}`-style query. Covers
 * wire-capture token shapes on both sides of the boundary -- letters fused into a dot-label with no
 * leading "-", a plain "-suffix", and a "~"-broken compound token -- so a regression in either
 * direction shows up here. */
const VERSION_GRAMMAR_CORPUS = [
  '3.118ubuntu5', // letter-fused label, no "-" prefix
  '3.20191218.1ubuntu2.3', // same shape, 4 labels
  '1.1.1k', // NON-Ubuntu letter-fused label (openssl) -- blocks a distro-hardcoded reversion
  '1.1.1k-9.el8', // openssl on RHEL8: letter-fused label + dist-tag revision
  '1.9.9p1', // sudo's patchlevel notation
  '0.21-4ubuntu4', // plain digit labels + "-suffix"
  '11.4.0-1ubuntu1~22.04.3', // "~" splits it; residues are version/all-numeric shaped
  '5.2.5-2ubuntu1',
  '1.21.1-1ubuntu2~22.04.2',
  '2.4.41-4+deb11u1', // Debian NMU/backport revision ("+deb11u1")
  'v1.2.3',
  '4.15.0-213.224', // kernel-style dotted revision
  '5.15.0-91-generic', // SECOND hyphen (kernel/linux-image family --
  // agent.os.kernel carries exactly this string for every Ubuntu agent)
  '5.4.0-150-generic',
  '5.15.0-91-lowlatency',
  '2.4.37-43.module+el8.5.0+1022+b541f3b1', // RHEL modular build, "+" splits
  // off the FQDN-shaped "el8.5.0" -- covered by the whole-token compound check
  '1.0+git20200101.abc1234-1', // git snapshot version
  '1.0.0+build.5', // semver build metadata
  '0.9.8+really0.9.7-1', // Debian "+really" convention
  // NOTE: '1.2.3' never reaches VERSION_LIKE_TOKEN_RE at all -- ALL_NUMERIC_DOTTED_RE catches it
  // first. Kept as an anchor that the two exclusions do not fight each other.
  '1.2.3',
];

/** Real hostnames that must ALWAYS mint a HOST_n; if any of them stopped minting, the fix would
 * have widened a privacy hole instead of just narrowing a fidelity one. The load-bearing rows are
 * the all-numeric-first-label FQDNs (0.pool.ntp.org and friends): they are the exact shape a
 * future "accept letter-initial version labels" loosening would stop minting, which is why that
 * loosening is forbidden (see VERSION_LIKE_TOKEN_RE's KNOWN, DELIBERATE RESIDUE note).
 * 3com/01server are NOT boundary cases — each fails the version test twice over (letters within
 * the first label AND an alphabetic final label) — they are here as ordinary regression rows. */
const HOSTNAME_BOUNDARY_CORPUS = [
  'wazuh-aio-05.internal.corp',
  'web-prod-01.example.com',
  '0.pool.ntp.org', // all-numeric FIRST label: the guard against loosening subsequent labels
  '1.gravatar.com',
  '2.bp.blogspot.com',
  '10.corp.local',
  '3com.example.com', // digit-initial first label, but a letter WITHIN that same label
  '01server.corp.local', // same: digit-initial first label, letters fused in
  'ns1.google.com',
  'backup-vault.internal.corp',
  'web1.corp',
];

test('prescanAndMint (#8920 item 8): version-grammar corpus passes through verbatim, never minted', () => {
  const failures: string[] = [];
  for (const token of VERSION_GRAMMAR_CORPUS) {
    const p = new Pseudonymizer();
    const input = `installed version ${token} today`;
    const out = prescanAndMint(input, p);
    if (out !== input) {
      failures.push(`${token}: expected verbatim, got "${out}"`);
    }
    if (p.newEntries().length !== 0) {
      failures.push(
        `${token}: expected no pseudonym entries, minted ${
          p.newEntries().length
        }`,
      );
    }
  }
  assert.deepEqual(failures, []);
});

test('prescanAndMint (#8920 item 8): hostname corpus at the boundary still mints HOST_n', () => {
  const failures: string[] = [];
  for (const token of HOSTNAME_BOUNDARY_CORPUS) {
    const p = new Pseudonymizer();
    const out = prescanAndMint(`connect to ${token} now`, p);
    if (!/HOST_\d+/.test(out)) {
      failures.push(`${token}: expected a HOST_n pseudonym, got "${out}"`);
    }
    if (out.includes(token)) {
      failures.push(`${token}: real value leaked into output "${out}"`);
    }
  }
  assert.deepEqual(failures, []);
});

test('prescanAndMint (#8920 item 8): newly version-excluded shapes are pinned as NON-minting', () => {
  // The tokens whose minting behaviour this fix actually CHANGED on the hostname side: digit-run
  // labels with trailing letters. None is a plausible hostname; each is a plausible version
  // fragment, and this pins the accepted direction of the change so it cannot silently flip.
  for (const token of ['10.0.2c', '01.2srv', '2.6prod', '123.4abc.5x']) {
    const p = new Pseudonymizer();
    const input = `value ${token} seen`;
    assert.equal(prescanAndMint(input, p), input, `${token} must not mint`);
    assert.equal(p.newEntries().length, 0);
  }
});

test('prescanAndMint (#8920 item 8): letter-initial version labels are the KNOWN residue and still mint', () => {
  // Deliberate residue (see VERSION_LIKE_TOKEN_RE's doc comment): "4.6.3.el7"/"2.0.rc1"-style
  // labels are legal versions, but excluding them would require accepting letter-initial
  // subsequent labels — which would stop minting 0.pool.ntp.org-shaped REAL hostnames. This test
  // pins the residue as minting so a future "fix" cannot take the privacy-regressing direction
  // without tripping over it and reading why.
  for (const token of ['4.6.3.el7', '2.0.rc1', '4.0.dev0']) {
    const p = new Pseudonymizer();
    const out = prescanAndMint(`version ${token} installed`, p);
    assert.match(
      out,
      /HOST_\d+/,
      `${token} is the documented fidelity residue`,
    );
  }
});

// --- prescanAndMintToolContent (JSON-aware digest pre-scan) -----------------------------------

test('prescanAndMintToolContent: never pseudonymizes dotted ECS field-name KEYS', () => {
  const p = new Pseudonymizer();
  const digest = JSON.stringify({
    tool: 'get_findings_by_time',
    samples: [
      {
        'wazuh.agent.name': 'wazuh-server-01',
        'rule.description': 'x',
        'source.ip': '198.51.100.10',
      },
    ],
    columns: ['@timestamp', 'wazuh.agent.name', 'rule.description'],
  });
  const out = prescanAndMintToolContent(digest, p);
  const parsed = JSON.parse(out);
  // KEYS survive verbatim — no HOST_n minted for "wazuh.agent.name"/"rule.description".
  assert.ok(
    Object.prototype.hasOwnProperty.call(parsed.samples[0], 'wazuh.agent.name'),
  );
  assert.ok(
    Object.prototype.hasOwnProperty.call(parsed.samples[0], 'rule.description'),
  );
  assert.deepEqual(parsed.columns, [
    '@timestamp',
    'wazuh.agent.name',
    'rule.description',
  ]);
  // The map only ever minted the one real IP VALUE, nothing for the dotted keys.
  assert.equal(p.newEntries().length, 1);
  assert.equal(p.newEntries()[0].value, '198.51.100.10');
});

test('prescanAndMintToolContent: still pseudonymizes a hostname/IP in a string VALUE', () => {
  const p = new Pseudonymizer();
  const digest = JSON.stringify({
    message: 'connection from attacker.evil.com refused',
  });
  const out = prescanAndMintToolContent(digest, p);
  assert.match(out, /HOST_\d+/);
  assert.doesNotMatch(out, /attacker\.evil\.com/);
});

test('F4: prescanAndMintToolContent preserves a JSON-derived "__proto__" key as an own property (no prototype pollution)', () => {
  // `JSON.parse('{"__proto__": ...}')` hands back "__proto__" as a perfectly ordinary own key of
  // the parsed object. Rebuilding that object with a plain `out[key] = value` assignment does not
  // create a property at all for that one key -- it invokes Object.prototype's `__proto__`
  // setter, silently dropping the value and rewriting the rebuilt object's own prototype.
  const p = new Pseudonymizer();
  const digest = '{"__proto__": {"message": "polluted"}, "safe": "value"}';
  const out = prescanAndMintToolContent(digest, p);
  const parsedOut = JSON.parse(out);
  assert.equal(Object.getPrototypeOf(parsedOut), Object.prototype);
  assert.ok(
    Object.prototype.hasOwnProperty.call(parsedOut, '__proto__'),
    '"__proto__" must survive as an own property',
  );
  assert.deepEqual(
    Object.getOwnPropertyDescriptor(parsedOut, '__proto__')?.value,
    { message: 'polluted' },
  );
  assert.equal(parsedOut.safe, 'value');
});

test('prescanAndMintToolContent: falls back to flat scan for non-JSON (plain error string)', () => {
  const p = new Pseudonymizer();
  const out = prescanAndMintToolContent(
    'Manager request failed: host db.internal.local down',
    p,
  );
  assert.match(out, /HOST_\d+/);
  assert.doesNotMatch(out, /db\.internal\.local/);
});

test('prescanAndMintToolContent: a digest with no scannable values round-trips unchanged', () => {
  const p = new Pseudonymizer();
  const digest = JSON.stringify({
    tool: 't',
    counts: { total: 3 },
    samples: [{ 'rule.level': 'critical' }],
  });
  const out = prescanAndMintToolContent(digest, p);
  assert.equal(out, digest);
  assert.equal(p.newEntries().length, 0);
});

// --- prescanAndMintToolContent: #8920 item 8 version-grammar coverage (JSON boundary) ----------
// Same two corpora as the `prescanAndMint` section above, run through the JSON-aware digest path
// instead, since a tool result reaches privacy scanning through `prescanAndMintToolContent`, not
// the flat scanner directly — the class fix (one shared regex) has to hold on both boundaries.

test('prescanAndMintToolContent (#8920 item 8): version-grammar corpus stays verbatim in a JSON value', () => {
  const failures: string[] = [];
  for (const token of VERSION_GRAMMAR_CORPUS) {
    const p = new Pseudonymizer();
    const digest = JSON.stringify({
      message: `installed version ${token} today`,
    });
    const out = prescanAndMintToolContent(digest, p);
    if (out !== digest) {
      failures.push(`${token}: expected byte-identical JSON, got "${out}"`);
    }
    if (p.newEntries().length !== 0) {
      failures.push(
        `${token}: expected no pseudonym entries, minted ${
          p.newEntries().length
        }`,
      );
    }
  }
  assert.deepEqual(failures, []);
});

test('prescanAndMintToolContent (#8920 item 8): hostname corpus at the boundary still mints in a JSON value', () => {
  const failures: string[] = [];
  for (const token of HOSTNAME_BOUNDARY_CORPUS) {
    const p = new Pseudonymizer();
    const digest = JSON.stringify({ message: `connect to ${token} now` });
    const out = prescanAndMintToolContent(digest, p);
    const parsed = JSON.parse(out) as { message: string };
    if (!/HOST_\d+/.test(parsed.message)) {
      failures.push(
        `${token}: expected a HOST_n pseudonym, got "${parsed.message}"`,
      );
    }
    if (parsed.message.includes(token)) {
      failures.push(
        `${token}: real value leaked into output "${parsed.message}"`,
      );
    }
  }
  assert.deepEqual(failures, []);
});

function baseDigest(overrides: Partial<Digest> = {}): Digest {
  return {
    tool: 'test_tool',
    counts: { returned: 0, truncated: false },
    samples: [],
    columns: [],
    ...overrides,
  };
}

// --- inferPseudonymKind -----------------------------------------------------------------------

test('inferPseudonymKind: infers kind prefixes from field names', () => {
  assert.equal(inferPseudonymKind('data.url'), 'URL');
  assert.equal(inferPseudonymKind('agent.ip'), 'IP');
  assert.equal(inferPseudonymKind('data.srcuser'), 'USER');
  assert.equal(inferPseudonymKind('agent.name'), 'HOST');
  assert.equal(inferPseudonymKind('predecoder.hostname'), 'HOST');
  assert.equal(inferPseudonymKind('GeoLocation.country_name'), 'VAL');
});

test('inferPseudonymKind: does not misclassify "description" as an IP field', () => {
  // 'wazuh.rule.description'.includes('ip') is true ("descr-IP-tion") under raw substring
  // matching. A description field is generic free text (VAL), not IP.
  assert.equal(inferPseudonymKind('wazuh.rule.description'), 'VAL');
  // Same substring trap, different word: "recipient" also contains "ip" mid-word.
  assert.equal(inferPseudonymKind('email.recipient'), 'VAL');
});

test('inferPseudonymKind: still infers IP for an actual "...ip"-shaped field', () => {
  // A real, curated field (WAZUH_FIELD.AGENT_IP) whose final path segment IS the word "ip".
  assert.equal(inferPseudonymKind(WAZUH_FIELD.AGENT_IP), 'IP');
  // Legacy Wazuh alert field with no delimiter before "ip" -- must still match as a suffix.
  assert.equal(inferPseudonymKind('data.srcip'), 'IP');
  // "ip_address": splitting on '_' isolates "ip" as its own token.
  assert.equal(inferPseudonymKind('data.ip_address'), 'IP');
});

// --- Pseudonymizer -----------------------------------------------------------------------------

test('Pseudonymizer: same value maps to the same pseudonym (stable)', () => {
  const p = new Pseudonymizer();
  const first = p.pseudonymize('web-01.corp', 'HOST');
  const second = p.pseudonymize('web-01.corp', 'HOST');
  assert.equal(first, second);
});

test('Pseudonymizer: distinct values map to distinct pseudonyms with kind prefixes', () => {
  const p = new Pseudonymizer();
  const host = p.pseudonymize('web-01.corp', 'HOST');
  const ip = p.pseudonymize('10.0.0.5', 'IP');
  const user = p.pseudonymize('jdoe', 'USER');
  const url = p.pseudonymize('http://evil.example', 'URL');
  const val = p.pseudonymize('some-value', 'VAL');

  assert.match(host, /^HOST_\d+$/);
  assert.match(ip, /^IP_\d+$/);
  assert.match(user, /^USER_\d+$/);
  assert.match(url, /^URL_\d+$/);
  assert.match(val, /^VAL_\d+$/);

  const all = [host, ip, user, url, val];
  assert.equal(
    new Set(all).size,
    all.length,
    'all pseudonyms must be distinct',
  );
});

test('Pseudonymizer: reverse (pseudonym -> real) round-trips via reverseText', () => {
  const p = new Pseudonymizer();
  const real = 'web-01.corp';
  const pseudonym = p.pseudonymize(real, 'HOST');
  const text = `Host ${pseudonym} is alerting.`;
  const reversed = p.reverseText(text);
  assert.equal(reversed, `Host ${real} is alerting.`);
});

test('Pseudonymizer: applyToText replaces every known value, longest first', () => {
  const p = new Pseudonymizer();
  p.pseudonymize('10.0.0.1', 'IP');
  p.pseudonymize('10.0.0.10', 'IP');
  const text = 'Traffic from 10.0.0.10 and 10.0.0.1 was observed.';
  const out = p.applyToText(text);
  // Neither real IP should remain in the output, and the shorter value must not have corrupted
  // the longer one's replacement (the longest-first substitution order).
  assert.ok(!out.includes('10.0.0.10'));
  assert.ok(!out.includes('10.0.0.1'));
  assert.match(out, /^Traffic from IP_\d+ and IP_\d+ was observed\.$/);
});

// applyToText must not let a pseudonymized word corrupt an unrelated value it merely happens to
// appear inside of — e.g. "ubuntu" (pseudonymized from host.os.platform) must not turn the package
// version "7.81.0-1ubuntu1.14" into "7.81.0-1VAL_21.14". These pin the word-boundary discipline
// (boundary = any non-alphanumeric character) that guarantees this without breaking the cases that
// must keep working.

test('Pseudonymizer: applyToText leaves a pseudonymized word untouched when it is glued inside a larger alphanumeric run (version string)', () => {
  const p = new Pseudonymizer();
  const pseudonym = p.pseudonymize('ubuntu', 'VAL');
  const text = 'Installed openssh 7.81.0-1ubuntu1.14 on the host.';
  const out = p.applyToText(text);
  assert.equal(out, text, 'the version string must be left byte-identical');
  assert.ok(!out.includes(pseudonym));
});

test('Pseudonymizer: applyToText still replaces a standalone occurrence of the same value', () => {
  const p = new Pseudonymizer();
  const pseudonym = p.pseudonymize('ubuntu', 'VAL');
  const text = 'The agent reports its platform is ubuntu.';
  const out = p.applyToText(text);
  assert.equal(out, `The agent reports its platform is ${pseudonym}.`);
});

test('Pseudonymizer: applyToText still replaces a value glued to a larger token by "-" or "_" (whole token, not the compound)', () => {
  const p = new Pseudonymizer();
  const pseudonym = p.pseudonymize('ubuntu', 'VAL');
  const hyphenated = p.applyToText(
    'Image tag myapp-ubuntu-server was deployed.',
  );
  assert.equal(hyphenated, `Image tag myapp-${pseudonym}-server was deployed.`);
  const underscored = p.applyToText(
    'Image tag myapp_ubuntu_server was deployed.',
  );
  assert.equal(
    underscored,
    `Image tag myapp_${pseudonym}_server was deployed.`,
  );
});

test('Pseudonymizer: applyToText still replaces an embedded IP address', () => {
  const p = new Pseudonymizer();
  const pseudonym = p.pseudonymize('10.0.0.5', 'IP');
  const out = p.applyToText('Connection refused from 10.0.0.5 on port 22.');
  assert.equal(out, `Connection refused from ${pseudonym} on port 22.`);
});

test('Pseudonymizer: applyToText still replaces an embedded FQDN', () => {
  const p = new Pseudonymizer();
  const pseudonym = p.pseudonymize('web01.corp.local', 'HOST');
  const out = p.applyToText('Alert raised on web01.corp.local just now.');
  assert.equal(out, `Alert raised on ${pseudonym} just now.`);
});

test('Pseudonymizer: applyToText skips an empty seeded value instead of matching every position', () => {
  const p = new Pseudonymizer([{ value: '', pseudonym: 'VAL_1' }]);
  const text = 'unchanged text';
  assert.equal(p.applyToText(text), text);
});

test('Pseudonymizer: applyToObject deep-maps nested structures', () => {
  const p = new Pseudonymizer();
  const pseudonym = p.pseudonymize('web-01.corp', 'HOST');
  const input = {
    agent: { name: 'web-01.corp' },
    list: ['web-01.corp', 'unrelated'],
    nested: { deeper: { name: 'web-01.corp' } },
  };
  const out = p.applyToObject(input);
  assert.equal(out.agent.name, pseudonym);
  assert.equal(out.list[0], pseudonym);
  assert.equal(out.list[1], 'unrelated');
  assert.equal(out.nested.deeper.name, pseudonym);
});

test('F4: applyToObject (deepMapStrings) preserves a "__proto__" key as an own property (no prototype pollution)', () => {
  const p = new Pseudonymizer();
  const pseudonym = p.pseudonymize('web-01.corp', 'HOST');
  // Simulates a tool-call argument object shaped like `JSON.parse` output with a "__proto__" own
  // key -- e.g. a model echoing back an object it was handed. Built via `JSON.parse` of a STRING
  // (not an object literal, where a bare `__proto__:` key is special-cased by JS syntax itself to
  // set the prototype rather than create an own property) so this actually exercises the same
  // "__proto__ as an ordinary own key" shape JSON.parse produces. A plain `out[key] = value`
  // rebuild would run Object.prototype's `__proto__` setter here instead of creating a property.
  const input = JSON.parse('{"__proto__": {"name": "web-01.corp"}}');
  const out = p.applyToObject(input) as Record<string, unknown>;
  assert.equal(Object.getPrototypeOf(out), Object.prototype);
  assert.ok(Object.prototype.hasOwnProperty.call(out, '__proto__'));
  assert.deepEqual(Object.getOwnPropertyDescriptor(out, '__proto__')?.value, {
    name: pseudonym,
  });
});

test('Pseudonymizer: seeded entries are reused and counters continue from the seed', () => {
  const seed = [{ value: 'web-01.corp', pseudonym: 'HOST_5' }];
  const p = new Pseudonymizer(seed);
  assert.equal(p.pseudonymize('web-01.corp', 'HOST'), 'HOST_5');
  const next = p.pseudonymize('web-02.corp', 'HOST');
  assert.equal(next, 'HOST_6');
  // Seeded entries are not part of newEntries(); only freshly minted ones are.
  const minted = p.newEntries();
  assert.equal(minted.length, 1);
  assert.equal(minted[0].value, 'web-02.corp');
});

// --- StreamDepseudonymizer ----------------------------------------------------------------------

test('StreamDepseudonymizer: a pseudonym split across two chunks still re-expands', () => {
  const p = new Pseudonymizer();
  const real = 'web-01.corp';
  const pseudonym = p.pseudonymize(real, 'HOST'); // e.g. "HOST_1"

  const full = `Host ${pseudonym} is up`;
  // Split the token itself across two chunks (mid-token split).
  const splitPoint = full.indexOf(pseudonym) + Math.floor(pseudonym.length / 2);
  const chunk1 = full.slice(0, splitPoint);
  const chunk2 = full.slice(splitPoint);

  const dep = new StreamDepseudonymizer(p);
  const out1 = dep.push(chunk1);
  const out2 = dep.push(chunk2);
  const out3 = dep.flush();

  const assembled = out1 + out2 + out3;
  assert.equal(assembled, `Host ${real} is up`);
  // The real value must never have leaked out incompletely as a partial token; since we only
  // check the final assembled string here, additionally assert no chunk emitted the raw pseudonym.
  assert.ok(!assembled.includes(pseudonym));
});

test('StreamDepseudonymizer: a real value never leaks (fully reversed after flush)', () => {
  const p = new Pseudonymizer();
  const real = 'jdoe';
  const pseudonym = p.pseudonymize(real, 'USER');
  const dep = new StreamDepseudonymizer(p);

  let out = '';
  // Feed the token one character at a time to stress the holdback logic.
  const text = `User ${pseudonym} logged in from a new device`;
  for (const ch of text) {
    out += dep.push(ch);
  }
  out += dep.flush();

  assert.equal(out, `User ${real} logged in from a new device`);
});

test('StreamDepseudonymizer: flush on empty buffer returns empty string (idempotent)', () => {
  const p = new Pseudonymizer();
  const dep = new StreamDepseudonymizer(p);
  assert.equal(dep.flush(), '');
  assert.equal(dep.flush(), '');
});

// --- applyFieldPolicy ---------------------------------------------------------------------------

test('applyFieldPolicy: "never" field is dropped from samples', () => {
  const policy: FieldPolicyEntry[] = [{ field: 'full_log', action: 'never' }];
  const p = new Pseudonymizer();
  const digest = baseDigest({
    samples: [{ full_log: 'raw log line', 'rule.id': '100' }],
  });
  const out = applyFieldPolicy(digest, policy, p);
  assert.ok(!('full_log' in out.samples[0]));
  assert.equal(out.samples[0]['rule.id'], '100');
});

test('applyFieldPolicy: "never" drops the field name from the columns schema hint too (probe P4)', () => {
  // Wire capture 2026-08-14 (/vagrant/qa-out/privacy-p4.jsonl): with package.version set to
  // 'never' the VALUES were correctly gone, but the digest's `columns` hint still named the
  // field -- the action's contract says even the field's existence is hidden.
  const policy: FieldPolicyEntry[] = [
    { field: 'package.version', action: 'never' },
  ];
  const p = new Pseudonymizer();
  const digest = baseDigest({
    columns: ['package.name', 'package.version', 'package.architecture'],
    samples: [{ 'package.name': 'lxd', 'package.version': '5.0.8' }],
  });
  const out = applyFieldPolicy(digest, policy, p);
  assert.deepEqual(out.columns, ['package.name', 'package.architecture']);
  assert.ok(!('package.version' in out.samples[0]));
});

test('applyFieldPolicy: anonymize/allow keep their columns entries (a schema-hint name is not a value)', () => {
  const policy: FieldPolicyEntry[] = [
    { field: 'agent.name', action: 'anonymize' },
    { field: 'rule.id', action: 'allow' },
  ];
  const p = new Pseudonymizer();
  const digest = baseDigest({
    columns: ['agent.name', 'rule.id'],
    samples: [{ 'agent.name': 'web-01.corp', 'rule.id': '100' }],
  });
  const out = applyFieldPolicy(digest, policy, p);
  assert.deepEqual(out.columns, ['agent.name', 'rule.id']);
});

test('applyFieldPolicy: "anonymize" field is pseudonymized', () => {
  const policy: FieldPolicyEntry[] = [
    { field: 'agent.name', action: 'anonymize' },
  ];
  const p = new Pseudonymizer();
  const digest = baseDigest({ samples: [{ 'agent.name': 'web-01.corp' }] });
  const out = applyFieldPolicy(digest, policy, p);
  assert.match(out.samples[0]['agent.name'] as string, /^HOST_\d+$/);
});

// --- applyFieldPolicy: #8889 value-shape scan over allow-by-omission field values ---------------

test('applyFieldPolicy: allow-by-omission value with an embedded IP still gets scanned', () => {
  // "package.name" has no FIELD_POLICY_DEFAULTS entry -- it stays readable (allow-by-omission),
  // but before this fix an identifier embedded in it had no secondary scan at all.
  const policy: FieldPolicyEntry[] = [];
  const p = new Pseudonymizer();
  const digest = baseDigest({
    samples: [
      { 'package.name': 'connector reaching out to 203.0.113.7 for updates' },
    ],
  });
  const out = applyFieldPolicy(digest, policy, p, undefined, undefined, false);
  const value = out.samples[0]['package.name'] as string;
  assert.doesNotMatch(value, /203\.0\.113\.7/);
  assert.match(value, /^connector reaching out to IP_\d+ for updates$/);
});

test('applyFieldPolicy: allow-by-omission value with an embedded FQDN still gets scanned', () => {
  const policy: FieldPolicyEntry[] = [];
  const p = new Pseudonymizer();
  const digest = baseDigest({
    samples: [
      {
        'get_agent_processes/cmd':
          'curl https://backup-vault.internal.corp/agent',
      },
    ],
  });
  const out = applyFieldPolicy(digest, policy, p, undefined, undefined, false);
  const value = out.samples[0]['get_agent_processes/cmd'] as string;
  assert.doesNotMatch(value, /backup-vault\.internal\.corp/);
  assert.match(value, /^curl https:\/\/HOST_\d+\/agent$/);
});

test('applyFieldPolicy: an EXPLICIT "allow" entry is not scanned for embedded IPs/FQDNs', () => {
  // Deliberate scoping (see the samples-loop comment in privacy.ts): an explicit entry is a
  // reviewed decision (e.g. a curated taxonomy field), left exactly as before -- only the
  // allow-BY-OMISSION path gets the new scan.
  const policy: FieldPolicyEntry[] = [{ field: 'check.name', action: 'allow' }];
  const p = new Pseudonymizer();
  const digest = baseDigest({
    samples: [{ 'check.name': 'Reach out to 203.0.113.7 if this fails' }],
  });
  const out = applyFieldPolicy(digest, policy, p, undefined, undefined, false);
  assert.equal(
    out.samples[0]['check.name'],
    'Reach out to 203.0.113.7 if this fails',
  );
});

test('applyFieldPolicy: unlisted field passes through when isEscapeHatch is false', () => {
  const policy: FieldPolicyEntry[] = [];
  const p = new Pseudonymizer();
  const digest = baseDigest({
    samples: [{ 'data.win.system.computerName': 'DESKTOP-01' }],
  });
  const out = applyFieldPolicy(digest, policy, p, undefined, undefined, false);
  assert.equal(out.samples[0]['data.win.system.computerName'], 'DESKTOP-01');
});

test('applyFieldPolicy: unlisted field is anonymized when isEscapeHatch is true (fail-closed)', () => {
  const policy: FieldPolicyEntry[] = [];
  const p = new Pseudonymizer();
  const digest = baseDigest({
    samples: [{ 'data.win.system.computerName': 'DESKTOP-01' }],
  });
  const out = applyFieldPolicy(digest, policy, p, undefined, undefined, true);
  const value = out.samples[0]['data.win.system.computerName'] as string;
  assert.notEqual(value, 'DESKTOP-01');
  assert.match(value, /^(HOST|IP|USER|URL|VAL)_\d+$/);
});

test('applyFieldPolicy: explicit "allow" entry is unaffected by isEscapeHatch', () => {
  const policy: FieldPolicyEntry[] = [
    { field: 'data.win.system.computerName', action: 'allow' },
  ];
  const p = new Pseudonymizer();
  const digest = baseDigest({
    samples: [{ 'data.win.system.computerName': 'DESKTOP-01' }],
  });
  const out = applyFieldPolicy(digest, policy, p, undefined, undefined, true);
  assert.equal(out.samples[0]['data.win.system.computerName'], 'DESKTOP-01');
});

// --- get_agent_inventory's deriveColumns/isEscapeHatch fail-closed default, against the REAL
// The cluster node name reached the provider in clear under privacy mode ON, because a single
// `wazuh.cluster.*` wildcard swept the cluster's configured LABEL and a machine's HOSTNAME into
// one `allow`. The compensating value-shape scan could not catch it either: `FQDN_TOKEN_RE`
// requires a dot, so a bare single-word node name is never minted by shape, and the documented
// fallback for a bare-word hostname is the field-policy scrub -- which was this `allow`.

test('applyFieldPolicy: wazuh.cluster.node is pseudonymized as a HOST while wazuh.cluster.name stays readable', () => {
  const p = new Pseudonymizer();
  const digest = baseDigest({
    columns: ['wazuh.cluster.name', 'wazuh.cluster.node'],
    samples: [
      { 'wazuh.cluster.name': 'wazuh', 'wazuh.cluster.node': 'a-node' },
    ],
  });
  const out = applyFieldPolicy(digest, FIELD_POLICY_DEFAULTS, p);
  // The configured label is curated vocabulary -- it stays readable so the model can still tell
  // which cluster a document belongs to.
  assert.equal(out.samples[0]['wazuh.cluster.name'], 'wazuh');
  // The node name is a real machine's hostname: replaced, and with a HOST-kind pseudonym so it
  // shares a namespace with wazuh.agent.name/host.hostname rather than minting a second token for
  // the same host.
  assert.notEqual(out.samples[0]['wazuh.cluster.node'], 'a-node');
  assert.match(String(out.samples[0]['wazuh.cluster.node']), /^HOST_\d+$/);
  // The KEY must survive: the reported symptom was exactly inverted -- the value stayed in clear
  // while the field NAME arrived as HOST_1, so the model could not tell what the column meant.
  assert.deepEqual(out.columns, ['wazuh.cluster.name', 'wazuh.cluster.node']);
});

test('applyFieldPolicy: the same host reaching the digest twice gets ONE pseudonym across both fields', () => {
  const p = new Pseudonymizer();
  const digest = baseDigest({
    samples: [{ 'wazuh.agent.name': 'a-node', 'wazuh.cluster.node': 'a-node' }],
  });
  const out = applyFieldPolicy(digest, FIELD_POLICY_DEFAULTS, p);
  assert.equal(
    out.samples[0]['wazuh.cluster.node'],
    out.samples[0]['wazuh.agent.name'],
  );
});

// Order matters: `resolveFieldEntry` returns the FIRST matching entry, so the two exact entries
// have to sit ABOVE the surviving `wazuh.cluster.*` wildcard or the wildcard would still win.
test('FIELD_POLICY_DEFAULTS: the exact wazuh.cluster entries precede the wildcard', () => {
  const index = (field: string) =>
    FIELD_POLICY_DEFAULTS.findIndex(entry => entry.field === field);
  const wildcard = index('wazuh.cluster.*');
  assert.ok(wildcard >= 0, 'the wildcard is still present as the catch-all');
  assert.ok(index('wazuh.cluster.name') < wildcard);
  assert.ok(index('wazuh.cluster.node') < wildcard);
});

// FIELD_POLICY_DEFAULTS (not a hand-built test-local policy): confirms the explicit 'allow'
// entries added for it actually land where they need to, and that the fields which must stay
// anonymized on this same tool still do. Regression guard for the "which fields are safe to allow
// on a deriveColumns tool" review, not just the generic mechanism already covered above. ---------

test('applyFieldPolicy: a packages-kind get_agent_inventory digest keeps package.name readable under privacy mode', () => {
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'get_agent_inventory',
    samples: [
      {
        'package.name': 'openssl',
        'package.version': '3.0.2',
        'package.architecture': 'amd64',
      },
    ],
  });
  const out = applyFieldPolicy(
    digest,
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    'get_agent_inventory',
    true, // isEscapeHatch: true, matching get_agent_inventory's deriveColumns: true
  );
  assert.equal(out.samples[0]['package.name'], 'openssl');
  assert.equal(out.samples[0]['package.version'], '3.0.2');
  assert.equal(out.samples[0]['package.architecture'], 'amd64');
});

test('applyFieldPolicy: a packages-kind get_agent_inventory digest anonymizes package.vendor while keeping name/version/architecture readable', () => {
  // package.vendor is the deliberate exception in this group (see privacy.ts's comment on its
  // entry): a distributor string ("Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>")
  // routinely embeds a maintainer email address, unlike the pure software-identity fields above,
  // so it stays 'anonymize' even though it sits right next to three 'allow' entries reading the
  // exact same index. This also pins the OUTCOME the field-policy-coverage.test.ts fix protects:
  // before `package.vendor` had this explicit entry, it reached this exact result only by
  // accident (the deriveColumns fail-closed default), with no reviewed decision behind it.
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'get_agent_inventory',
    samples: [
      {
        'package.name': 'openssl',
        'package.version': '3.0.2',
        'package.architecture': 'amd64',
        'package.vendor':
          'Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>',
      },
    ],
  });
  const out = applyFieldPolicy(
    digest,
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    'get_agent_inventory',
    true, // isEscapeHatch: true, matching get_agent_inventory's deriveColumns: true
  );
  assert.equal(out.samples[0]['package.name'], 'openssl');
  assert.equal(out.samples[0]['package.version'], '3.0.2');
  assert.equal(out.samples[0]['package.architecture'], 'amd64');
  // package.vendor is 'allow-scan' since the #8912 follow-through (its entry's own comment
  // promised the change once that landed): the distributor NAME stays readable while the
  // embedded address is caught by the value-shape scan.
  const vendor = out.samples[0]['package.vendor'] as string;
  assert.match(vendor, /^Ubuntu Developers /);
  assert.doesNotMatch(vendor, /lists\.ubuntu\.com/);
});

test('applyFieldPolicy: a ports-kind get_agent_inventory digest still anonymizes source.ip/destination.ip', () => {
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'get_agent_inventory',
    samples: [
      {
        'source.ip': '10.0.0.5',
        'source.port': 443,
        'destination.ip': '198.51.100.10',
        'destination.port': 51422,
        'network.transport': 'tcp',
        'process.name': 'nginx',
      },
    ],
  });
  const out = applyFieldPolicy(
    digest,
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    'get_agent_inventory',
    true,
  );
  // The addresses are still pseudonymized -- the fix allow-lists port-inventory MECHANICS, not the
  // IPs those mechanics are attached to.
  assert.match(out.samples[0]['source.ip'] as string, /^IP_\d+$/);
  assert.match(out.samples[0]['destination.ip'] as string, /^IP_\d+$/);
  // network.transport/process.name are the string fields that actually exercise the new 'allow'
  // entries (applyFieldPolicy's fail-closed branch only ever touches string values -- a numeric
  // port never would have been pseudonymized either way, so source.port/destination.port below
  // just confirm they round-trip, not that the fix specifically caused it).
  assert.equal(out.samples[0]['source.port'], 443);
  assert.equal(out.samples[0]['destination.port'], 51422);
  assert.equal(out.samples[0]['network.transport'], 'tcp');
  assert.equal(out.samples[0]['process.name'], 'nginx');
});

test('applyFieldPolicy: an os-kind get_agent_inventory digest keeps OS identity readable but still anonymizes host.hostname', () => {
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'get_agent_inventory',
    samples: [
      {
        'host.hostname': 'web-prod-01',
        'host.os.name': 'Ubuntu',
        'host.os.version': '22.04',
        'host.os.platform': 'ubuntu',
      },
    ],
  });
  const out = applyFieldPolicy(
    digest,
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    'get_agent_inventory',
    true,
  );
  assert.match(out.samples[0]['host.hostname'] as string, /^HOST_\d+$/);
  assert.equal(out.samples[0]['host.os.name'], 'Ubuntu');
  assert.equal(out.samples[0]['host.os.version'], '22.04');
  assert.equal(out.samples[0]['host.os.platform'], 'ubuntu');
});

test('applyFieldPolicy: a processes-kind get_agent_inventory digest keeps process.name readable but still anonymizes process.command_line', () => {
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'get_agent_inventory',
    samples: [
      {
        'process.name': 'sshd',
        'process.command_line':
          '/usr/sbin/sshd -D -p 22 --config /home/alice/.ssh/config',
      },
    ],
  });
  const out = applyFieldPolicy(
    digest,
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    'get_agent_inventory',
    true,
  );
  assert.equal(out.samples[0]['process.name'], 'sshd');
  assert.match(out.samples[0]['process.command_line'] as string, /^VAL_\d+$/);
});

test('applyFieldPolicy: a hotfixes-kind get_agent_inventory digest keeps package.hotfix.name readable', () => {
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'get_agent_inventory',
    samples: [{ 'package.hotfix.name': 'KB5034441' }],
  });
  const out = applyFieldPolicy(
    digest,
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    'get_agent_inventory',
    true,
  );
  assert.equal(out.samples[0]['package.hotfix.name'], 'KB5034441');
});

test('applyFieldPolicy: a "*"-suffixed entry matches the prefix field itself and any subfield', () => {
  const policy: FieldPolicyEntry[] = [
    { field: 'wazuh.rule.compliance.*', action: 'allow' },
  ];
  const p = new Pseudonymizer();
  // String values on purpose: applyFieldPolicy's fail-closed anonymize branch (isEscapeHatch:
  // true) only triggers for `typeof value === 'string'`, so an array-valued sample (the real
  // shape of these compliance fields) would pass through unchanged in the `else` branch
  // regardless of whether the wildcard actually matched — that would prove nothing about
  // resolveFieldEntry's prefix-match logic. Strings are what actually exercise it.
  const digest = baseDigest({
    samples: [
      {
        'wazuh.rule.compliance.pci_dss': '10.6',
        'wazuh.rule.compliance.hipaa': '164.308.a.1.ii.D',
        'wazuh.rule.compliance': 'top-level-value',
      },
    ],
  });
  const out = applyFieldPolicy(digest, policy, p, undefined, undefined, true);
  // isEscapeHatch: true (fail-closed) would anonymize anything NOT matched by the wildcard —
  // these three all stay untouched only if the wildcard entry actually matched each of them.
  assert.equal(out.samples[0]['wazuh.rule.compliance.pci_dss'], '10.6');
  assert.equal(
    out.samples[0]['wazuh.rule.compliance.hipaa'],
    '164.308.a.1.ii.D',
  );
  assert.equal(out.samples[0]['wazuh.rule.compliance'], 'top-level-value');
});

test('applyFieldPolicy: a "*"-suffixed entry does not match an unrelated sibling field', () => {
  const policy: FieldPolicyEntry[] = [
    { field: 'wazuh.rule.compliance.*', action: 'allow' },
  ];
  const p = new Pseudonymizer();
  const digest = baseDigest({
    samples: [{ 'wazuh.rule.compliance_other': 'should not match' }],
  });
  const out = applyFieldPolicy(digest, policy, p, undefined, undefined, true);
  // Fail-closed anonymizes it, proving the wildcard did NOT swallow this look-alike field —
  // "wazuh.rule.compliance_other" is not "wazuh.rule.compliance" or a ".compliance." subfield.
  assert.notEqual(
    out.samples[0]['wazuh.rule.compliance_other'],
    'should not match',
  );
});

test('applyFieldPolicy: multi-agg breakdown scrubs each bucket under its own agg field', () => {
  const policy: FieldPolicyEntry[] = [
    { field: 'agent.name', action: 'anonymize' },
    { field: 'rule.id', action: 'allow' },
  ];
  const p = new Pseudonymizer();
  const digest = baseDigest({
    breakdown: [
      { key: 'web-01.corp', count: 5, agg: 'by_agent' },
      { key: '100', count: 3, agg: 'by_rule' },
    ],
  });
  const aggFields = {
    by_agent: scalarSpec('agent.name'),
    by_rule: scalarSpec('rule.id'),
  };
  const out = applyFieldPolicy(digest, policy, p, aggFields);
  assert.ok(out.breakdown);
  const byAgent = out.breakdown!.find(b => b.agg === 'by_agent')!;
  const byRule = out.breakdown!.find(b => b.agg === 'by_rule')!;
  assert.match(byAgent.key as string, /^HOST_\d+$/);
  assert.equal(byRule.key, '100');
});

test('applyFieldPolicy: a "never" agg field drops only its own buckets', () => {
  const policy: FieldPolicyEntry[] = [
    { field: 'data.srcip', action: 'never' },
    { field: 'rule.id', action: 'allow' },
  ];
  const p = new Pseudonymizer();
  const digest = baseDigest({
    breakdown: [
      { key: '10.0.0.5', count: 5, agg: 'by_ip' },
      { key: '100', count: 3, agg: 'by_rule' },
    ],
  });
  const aggFields = {
    by_ip: scalarSpec('data.srcip'),
    by_rule: scalarSpec('rule.id'),
  };
  const out = applyFieldPolicy(digest, policy, p, aggFields);
  assert.ok(out.breakdown);
  assert.equal(out.breakdown!.length, 1);
  assert.equal(out.breakdown![0].agg, 'by_rule');
});

test('applyFieldPolicy: when a "never" policy drops EVERY bucket, breakdownNote goes with the breakdown', () => {
  // FAILS ON BASE (and against #8935 item 1's first cut): the spread carried `breakdownNote`
  // through untouched while the empty scrub result deleted `breakdown`, leaving a note that
  // asserts concrete truncation figures about a bucket list that is not in the payload. 'never'
  // is user-settable (server/routes/settings.ts), so this is reachable from settings alone.
  const policy: FieldPolicyEntry[] = [{ field: 'data.srcip', action: 'never' }];
  const p = new Pseudonymizer();
  const digest = baseDigest({
    breakdown: [
      { key: '10.0.0.5', count: 5 },
      { key: '10.0.0.6', count: 3 },
    ],
    breakdownNote:
      'Per-bucket counts are exact, but the bucket list is incomplete — further matches fall ' +
      'under keys not listed (12).',
  });
  const aggFields = { by_ip: scalarSpec('data.srcip') };
  const out = applyFieldPolicy(digest, policy, p, aggFields);
  assert.ok(!('breakdown' in out), 'every bucket was policy-dropped');
  assert.ok(
    !('breakdownNote' in out),
    'a note describing a deleted breakdown must not reach the provider',
  );
});

test('applyFieldPolicy: get_agent_inventory packages breakdown anonymizes package.vendor buckets, not package.architecture', () => {
  // Reproduces the exact reported defect against the REAL FIELD_POLICY_DEFAULTS + the same shape
  // of scalar AggFieldSpec map executor.ts builds for a breakdownDimensions tool (dimension ->
  // {kind: 'scalar', field: dimension}, see executor.ts's `aggFields` fallback) -- before
  // package.vendor had its own entry, this bucket already came out as an opaque VAL_n (the
  // deriveColumns fail-closed default), but with no reviewed policy behind it; this pins that the
  // SAME outcome now happens deliberately, and that the sibling package.architecture dimension (a
  // real 'allow' entry) still reports its real bucket keys.
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'get_agent_inventory',
    breakdown: [
      { key: 'amd64', count: 40, agg: 'package.architecture' },
      {
        key: 'Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>',
        count: 12,
        agg: 'package.vendor',
      },
    ],
  });
  const aggFields = {
    'package.architecture': {
      kind: 'scalar' as const,
      field: 'package.architecture',
    },
    'package.vendor': { kind: 'scalar' as const, field: 'package.vendor' },
  };
  const out = applyFieldPolicy(
    digest,
    FIELD_POLICY_DEFAULTS,
    p,
    aggFields,
    'get_agent_inventory',
    true, // isEscapeHatch: true, matching get_agent_inventory's deriveColumns: true
  );
  assert.ok(out.breakdown);
  const arch = out.breakdown!.find(b => b.agg === 'package.architecture')!;
  const vendor = out.breakdown!.find(b => b.agg === 'package.vendor')!;
  assert.equal(arch.key, 'amd64');
  // allow-scan (the #8912 follow-through): the distributor name survives, the embedded
  // address does not.
  assert.match(vendor.key as string, /^Ubuntu Developers /);
  // The real ADDRESS (the part that identifies infrastructure) never appears in the digest.
  assert.doesNotMatch(JSON.stringify(out), /lists\.ubuntu\.com/);
});

test('applyFieldPolicy: message field is run through the whole-text scrub', () => {
  const policy: FieldPolicyEntry[] = [];
  const p = new Pseudonymizer();
  const pseudonym = p.pseudonymize('web-01.corp', 'HOST');
  const digest = baseDigest({
    message: 'AR command was not sent to web-01.corp',
  });
  const out = applyFieldPolicy(digest, policy, p);
  assert.equal(out.message, `AR command was not sent to ${pseudonym}`);
});

test('applyFieldPolicy: absent message stays absent (no message key added)', () => {
  const policy: FieldPolicyEntry[] = [];
  const p = new Pseudonymizer();
  const digest = baseDigest();
  const out = applyFieldPolicy(digest, policy, p);
  assert.ok(!('message' in out));
});

// --- extractAggFields ----------------------------------------------------------------------------

test('extractAggFields: maps each top-level BUCKET agg name to its terms/significant_terms field', () => {
  const body = {
    aggs: {
      by_rule: { terms: { field: 'rule.id', size: 20 } },
      by_ip_count: { cardinality: { field: 'data.srcip' } },
      by_sig: { significant_terms: { field: 'rule.description' } },
    },
  };
  const fields = extractAggFields(body);
  assert.ok(fields);
  assert.deepEqual(fields!.by_rule, scalarSpec('rule.id'));
  // A metric agg's field is deliberately NOT mapped (its response is a number — no string value
  // of that field ever leaves through the digest) so it can never win the `samples[].key`
  // attribution over the bucket agg that actually produced the rows. See extractAggFields'
  // doc comment for the leak this prevents.
  assert.equal(fields!.by_ip_count, undefined);
  assert.ok('by_ip_count' in fields!);
  assert.deepEqual(fields!.by_sig, scalarSpec('rule.description'));
});

// --- applyFieldPolicy: samples[].key attribution with a leading metric agg (#8920 item 5) --------

/**
 * Since digest.ts's `bucketsToRows` sources rows from the first agg WITH BUCKETS (skipping a
 * leading metric agg), the `key` sample column must be resolved against that same aggregation's
 * field — not the first DECLARED one. These two pin both directions of the misattribution a
 * declaration-order lookup would reintroduce.
 */
test('applyFieldPolicy: "key" resolves against the BUCKET agg, not a leading cardinality agg', () => {
  // cardinality on an 'allow' field (wazuh.agent.id) declared FIRST; terms on an 'anonymize'
  // field (wazuh.agent.name) second. The rows/samples come from the terms agg, so the hostnames
  // under samples[].key MUST be pseudonymized — resolving against wazuh.agent.id's 'allow' entry
  // would send them to the provider verbatim.
  const policy: FieldPolicyEntry[] = [
    { field: 'wazuh.agent.id', action: 'allow' },
    { field: 'wazuh.agent.name', action: 'anonymize', kind: 'HOST' },
  ];
  const p = new Pseudonymizer();
  const out = applyFieldPolicy(
    baseDigest({ samples: [{ key: 'web-prod-01', doc_count: 42 }] }),
    policy,
    p,
    extractAggFields({
      aggs: {
        distinct_ids: { cardinality: { field: 'wazuh.agent.id' } },
        by_agent: { terms: { field: 'wazuh.agent.name', size: 10 } },
      },
    }),
  );
  assert.deepEqual(out.samples, [{ key: 'HOST_1', doc_count: 42 }]);
});

test('applyFieldPolicy: a leading fieldless metric agg does not blanket-pseudonymize bucket keys', () => {
  // Mirror direction: an avg/sum/min/max agg has no extractable field at all. If it won the
  // attribution, `key` would resolve by its own literal name, find no policy entry, and the
  // escape hatch's fail-closed default would mint VAL_n for every bucket key — real rule ids
  // arriving at the model as pseudonyms while breakdown carries them verbatim. The terms agg's
  // 'allow' field must win instead.
  const policy: FieldPolicyEntry[] = [
    { field: 'wazuh.rule.id', action: 'allow' },
  ];
  const p = new Pseudonymizer();
  const out = applyFieldPolicy(
    baseDigest({ samples: [{ key: '5710', doc_count: 66 }] }),
    policy,
    p,
    extractAggFields({
      aggs: {
        avg_level: { avg: { field: 'wazuh.rule.level' } },
        by_rule: { terms: { field: 'wazuh.rule.id', size: 10 } },
      },
    }),
    'search_wazuh_data',
    true, // isEscapeHatch — the fail-closed default is exactly what must NOT fire here
  );
  assert.deepEqual(out.samples, [{ key: '5710', doc_count: 66 }]);
  assert.equal(p.newEntries().length, 0);
});

test('extractAggFields: date_histogram (no field-bearing key) maps to undefined', () => {
  const body = {
    aggs: {
      over_time: {
        date_histogram: { field: 'timestamp', fixed_interval: '1h' },
      },
    },
  };
  const fields = extractAggFields(body);
  assert.ok(fields);
  assert.equal(fields!.over_time, undefined);
  assert.ok('over_time' in fields!);
});

test('extractAggFields: returns undefined when body has no aggs', () => {
  assert.equal(extractAggFields({}), undefined);
  assert.equal(extractAggFields(undefined), undefined);
});

// --- applyFieldPolicy: breakdown SECURITY REGRESSIONS for multi_terms / composite ----------------
//
// extractAggFields must resolve multi_terms and composite aggregation fields, not just
// terms/significant_terms/cardinality: otherwise the breakdown loop's
// `if (!field) { scrubbed.push(bucket); continue; }` passes every such bucket's RAW key through
// untouched, WITH PRIVACY ON — a multi_terms/composite pivot on source.ip would leak real IPs
// regardless of the field's own 'anonymize' policy entry. `scrubAggKey` handles each bucket key
// structurally rather than only ever handling a bare string (see the extractAggFields tests above).

test('applyFieldPolicy: multi_terms on source.ip + wazuh.agent.id pseudonymizes both positions', () => {
  const policy: FieldPolicyEntry[] = [
    { field: 'source.ip', action: 'anonymize', kind: 'IP' },
    { field: 'wazuh.agent.id', action: 'allow' },
  ];
  const p = new Pseudonymizer();
  const digest = baseDigest({
    breakdown: [{ key: ['198.51.100.10', '007'], count: 12 }],
  });
  const aggFields = {
    by_ip_and_agent: {
      kind: 'multi' as const,
      fields: ['source.ip', 'wazuh.agent.id'],
    },
  };
  const out = applyFieldPolicy(digest, policy, p, aggFields);
  assert.ok(out.breakdown);
  assert.equal(out.breakdown!.length, 1);
  const [ip, agent] = out.breakdown![0].key as unknown[];
  assert.match(ip as string, /^IP_\d+$/);
  assert.equal(agent, '007');
});

test('applyFieldPolicy: multi_terms drops the WHOLE bucket when any positional component is "never"', () => {
  // Positional array: partially redacting one slot would silently misalign the remaining values
  // with their fields, so any 'never' component drops the entire bucket instead (see
  // scrubAggKey's doc comment).
  const policy: FieldPolicyEntry[] = [
    { field: 'source.ip', action: 'never' },
    { field: 'wazuh.agent.id', action: 'allow' },
  ];
  const p = new Pseudonymizer();
  const digest = baseDigest({
    breakdown: [
      { key: ['198.51.100.10', '007'], count: 12 },
      { key: ['198.51.100.11', '008'], count: 3 },
    ],
  });
  const aggFields = {
    by_ip_and_agent: {
      kind: 'multi' as const,
      fields: ['source.ip', 'wazuh.agent.id'],
    },
  };
  const out = applyFieldPolicy(digest, policy, p, aggFields);
  assert.deepEqual(out.breakdown, undefined);
});

test('applyFieldPolicy: multi_terms with an array-length mismatch drops the bucket (fail-closed)', () => {
  // Not reachable through extractAggFields today (its "multi" spec length always matches the
  // source multi_terms.terms.length, and a well-formed response's bucket key array length always
  // matches that same count) -- hand-crafted here because it is still the last fail-open path on
  // the escape hatch's key route (a hand-built aggFields/response pairing that disagrees with each
  // other). Symmetric with the top-level unresolved-structured-key branch: an unrecognized/
  // mismatched shape is dropped rather than trusted as safe.
  const policy: FieldPolicyEntry[] = [{ field: 'source.ip', action: 'allow' }];
  const p = new Pseudonymizer();
  const digest = baseDigest({
    breakdown: [{ key: ['198.51.100.10', '007', 'extra'], count: 4 }],
  });
  const aggFields = {
    by_ip_and_agent: {
      kind: 'multi' as const,
      fields: ['source.ip', 'wazuh.agent.id'], // length 2, bucket key length 3 -- mismatch.
    },
  };
  const out = applyFieldPolicy(digest, policy, p, aggFields);
  assert.deepEqual(out.breakdown, undefined);
});

test('applyFieldPolicy: composite with an unresolved property fails closed under the escape hatch', () => {
  // Defense in depth behind guardrails.ts's new composite-source-type rejection: even if a
  // composite source's field somehow could not be resolved (spec.fields has no entry for a
  // property actually present on the bucket key), the escape hatch must not pass that component
  // through raw -- a string is pseudonymized generically, a structured value is omitted.
  const p = new Pseudonymizer();
  const digest = baseDigest({
    breakdown: [
      { key: { ip: '198.51.100.10', mystery: 'raw-value' }, count: 9 },
    ],
  });
  const aggFields = {
    by_ip_and_mystery: {
      kind: 'composite' as const,
      fields: { ip: 'source.ip' }, // no entry for "mystery" -- unresolved property.
    },
  };
  const out = applyFieldPolicy(
    digest,
    [{ field: 'source.ip', action: 'allow' }],
    p,
    aggFields,
    'search_wazuh_data',
    true,
  );
  assert.ok(out.breakdown);
  const key = out.breakdown![0].key as Record<string, unknown>;
  assert.equal(key.ip, '198.51.100.10');
  assert.match(key.mystery as string, /^VAL_\d+$/);
});

test('applyFieldPolicy: composite with an unresolved property passes through for typed tools', () => {
  // Non-escape-hatch call sites keep today's pass-through for an unresolved property -- typed
  // catalog tools never produce a composite this file cannot fully resolve in practice, and this
  // proves the escape-hatch fail-closed default above did not change that default for them.
  const p = new Pseudonymizer();
  const digest = baseDigest({
    breakdown: [
      { key: { ip: '198.51.100.10', mystery: 'raw-value' }, count: 9 },
    ],
  });
  const aggFields = {
    by_ip_and_mystery: {
      kind: 'composite' as const,
      fields: { ip: 'source.ip' },
    },
  };
  const out = applyFieldPolicy(
    digest,
    [{ field: 'source.ip', action: 'allow' }],
    p,
    aggFields,
  );
  assert.deepEqual(out.breakdown![0].key, {
    ip: '198.51.100.10',
    mystery: 'raw-value',
  });
});

test('applyFieldPolicy: composite on source.ip + wazuh.agent.id scrubs each named component', () => {
  const policy: FieldPolicyEntry[] = [
    { field: 'source.ip', action: 'anonymize', kind: 'IP' },
    { field: 'wazuh.agent.id', action: 'allow' },
  ];
  const p = new Pseudonymizer();
  const digest = baseDigest({
    breakdown: [{ key: { ip: '198.51.100.10', agent: '007' }, count: 12 }],
  });
  const aggFields = {
    by_ip_and_agent: {
      kind: 'composite' as const,
      fields: { ip: 'source.ip', agent: 'wazuh.agent.id' },
    },
  };
  const out = applyFieldPolicy(digest, policy, p, aggFields);
  assert.ok(out.breakdown);
  const key = out.breakdown![0].key as Record<string, unknown>;
  assert.match(key.ip as string, /^IP_\d+$/);
  assert.equal(key.agent, '007');
});

test('applyFieldPolicy: composite omits only the "never" named component, keeping the rest', () => {
  // Unlike multi_terms above, a composite bucket's properties are individually named, so a
  // 'never' component can be safely omitted without misaligning the others.
  const policy: FieldPolicyEntry[] = [
    { field: 'source.ip', action: 'never' },
    { field: 'wazuh.agent.id', action: 'allow' },
  ];
  const p = new Pseudonymizer();
  const digest = baseDigest({
    breakdown: [{ key: { ip: '198.51.100.10', agent: '007' }, count: 12 }],
  });
  const aggFields = {
    by_ip_and_agent: {
      kind: 'composite' as const,
      fields: { ip: 'source.ip', agent: 'wazuh.agent.id' },
    },
  };
  const out = applyFieldPolicy(digest, policy, p, aggFields);
  assert.ok(out.breakdown);
  assert.deepEqual(out.breakdown![0].key, { agent: '007' });
});

test('applyFieldPolicy: a harmless date_histogram breakdown still passes through unscathed', () => {
  // Regression guard for the inverted-default fix: a genuinely fieldless agg (extractAggFields
  // resolves it to undefined) must still pass through for typed catalog tools, exactly as before
  // multi_terms/composite support and the fail-closed backstop were added.
  const policy: FieldPolicyEntry[] = [
    { field: 'wazuh.agent.name', action: 'never' },
  ];
  const p = new Pseudonymizer();
  const digest = baseDigest({
    breakdown: [{ key: '2026-07-31T00:00:00.000Z', count: 42 }],
  });
  const out = applyFieldPolicy(digest, policy, p, { over_time: undefined });
  assert.deepEqual(out.breakdown, [
    { key: '2026-07-31T00:00:00.000Z', count: 42 },
  ]);
});

test('applyFieldPolicy: an escape-hatch unresolvable-field bucket fails closed (string key)', () => {
  // The inverted default: unlike the typed-tool case above, the escape hatch's arbitrary DSL can
  // put an agg shape here this file does not parse but that DOES carry a real (unknown) field, so
  // a string key is pseudonymized generically rather than trusted as safe.
  const p = new Pseudonymizer();
  const digest = baseDigest({
    breakdown: [{ key: 'mystery-value', count: 5 }],
  });
  const out = applyFieldPolicy(
    digest,
    [],
    p,
    { unknown_shape: undefined },
    'search_wazuh_data',
    true,
  );
  assert.ok(out.breakdown);
  assert.match(out.breakdown![0].key as string, /^VAL_\d+$/);
});

test('applyFieldPolicy: an escape-hatch unresolvable-field bucket fails closed (structured key, dropped)', () => {
  // Sibling of the string-key case above: a STRUCTURED key (object/array) under an unresolvable
  // spec cannot be safely pseudonymized component-by-component (no field mapping exists for it),
  // so the escape hatch drops the whole bucket outright rather than shipping raw structured data.
  const p = new Pseudonymizer();
  const digest = baseDigest({
    breakdown: [{ key: { mystery: 'raw-value' }, count: 5 }],
  });
  const out = applyFieldPolicy(
    digest,
    [],
    p,
    { unknown_shape: undefined },
    'search_wazuh_data',
    true,
  );
  assert.deepEqual(out.breakdown, undefined);
});

// --- applyFieldPolicy: aggregation SAMPLES (the `key` sample field) ------------------------------

/**
 * A bucket row's sample keys are `key`/`doc_count`, so resolving `key` by its own name matched no
 * policy entry and sent the real bucket VALUE to the provider — the same value `breakdown` was
 * already scrubbing one key over. These cover both actions on that path.
 */
test('applyFieldPolicy: drops the "key" sample of an aggregation over a "never" field', () => {
  const policy: FieldPolicyEntry[] = [
    { field: 'wazuh.agent.name', action: 'never' },
  ];
  const p = new Pseudonymizer();
  const out = applyFieldPolicy(
    baseDigest({ samples: [{ key: 'web-01.corp', doc_count: 42 }] }),
    policy,
    p,
    { top_agents: scalarSpec('wazuh.agent.name') },
  );
  assert.deepEqual(out.samples, [{ doc_count: 42 }]);
  // Not even a pseudonym is minted for it: "never" means the value gets no representation at all.
  assert.equal(p.newEntries().length, 0);
});

test('applyFieldPolicy: pseudonymizes the "key" sample of an "anonymize" aggregation', () => {
  const policy: FieldPolicyEntry[] = [
    { field: 'wazuh.agent.name', action: 'anonymize', kind: 'HOST' },
  ];
  const p = new Pseudonymizer();
  const out = applyFieldPolicy(
    baseDigest({ samples: [{ key: 'web-01.corp', doc_count: 42 }] }),
    policy,
    p,
    { top_agents: scalarSpec('wazuh.agent.name') },
  );
  // Still keyed by `key` — the digest SHAPE the model sees must not change, only the value.
  assert.deepEqual(out.samples, [{ key: 'HOST_1', doc_count: 42 }]);
});

test('applyFieldPolicy: resolves the aggregated field tool-scoped, like every other field', () => {
  const policy: FieldPolicyEntry[] = [
    { field: 'get_top_agents/wazuh.agent.name', action: 'never' },
  ];
  const p = new Pseudonymizer();
  const digest = baseDigest({
    samples: [{ key: 'web-01.corp', doc_count: 7 }],
  });
  const scoped = applyFieldPolicy(
    digest,
    policy,
    p,
    { top_agents: scalarSpec('wazuh.agent.name') },
    'get_top_agents',
  );
  assert.deepEqual(scoped.samples, [{ doc_count: 7 }]);
  // Another tool's aggregation over the same field is not affected by that scoped entry. Uses a
  // bare, non-dotted value on purpose (unlike the "scoped" case above): this resolves to
  // allow-BY-OMISSION for "get_top_rules" (the policy only has a "get_top_agents/..." scoped
  // entry), which since #8889 runs the IP/FQDN value-shape scan (see applyFieldPolicy's samples
  // loop) — a dotted, FQDN-shaped value like "web-01.corp" would legitimately get minted there,
  // which would test that scan instead of the tool-scoping isolation this test is actually about.
  const other = applyFieldPolicy(
    baseDigest({ samples: [{ key: 'web-01', doc_count: 7 }] }),
    policy,
    p,
    { top_agents: scalarSpec('wazuh.agent.name') },
    'get_top_rules',
  );
  assert.deepEqual(other.samples, [{ key: 'web-01', doc_count: 7 }]);
});

test('applyFieldPolicy: a real field named "key" is unaffected without an aggregation', () => {
  const policy: FieldPolicyEntry[] = [{ field: 'key', action: 'allow' }];
  const p = new Pseudonymizer();
  const out = applyFieldPolicy(
    baseDigest({ samples: [{ key: 'literal-value' }] }),
    policy,
    p,
  );
  assert.deepEqual(out.samples, [{ key: 'literal-value' }]);
});

test('applyFieldPolicy: an aggregation with no extractable field leaves "key" alone', () => {
  const policy: FieldPolicyEntry[] = [
    { field: 'wazuh.agent.name', action: 'never' },
  ];
  const p = new Pseudonymizer();
  const out = applyFieldPolicy(
    baseDigest({ samples: [{ key: '2026-07-31T00:00:00Z', doc_count: 3 }] }),
    policy,
    p,
    // A date_histogram: extractAggFields reports the aggregation with no field.
    { over_time: undefined },
  );
  assert.deepEqual(out.samples, [
    { key: '2026-07-31T00:00:00Z', doc_count: 3 },
  ]);
});

// --- scrubKnownEntities (#8912 known-entity dictionary scan) -----------------------------------

test('scrubKnownEntities: a dictionary hit is replaced with the SAME pseudonym used elsewhere', () => {
  // CRITICAL correctness property: pseudonym reuse must be conversation-consistent (same real
  // value -> same pseudonym everywhere), or the model sees two different names for one host.
  const p = new Pseudonymizer();
  const pseudonym = p.pseudonymize('DBPRIMARY03', 'HOST'); // minted elsewhere, e.g. wazuh.agent.name
  const out = scrubKnownEntities(
    'installed package for DBPRIMARY03 host role',
    p,
  );
  assert.equal(out, `installed package for ${pseudonym} host role`);
  // No SECOND pseudonym was minted for the same real value.
  assert.equal(p.newEntries().length, 1);
});

test('scrubKnownEntities: case-insensitive hit still resolves to the existing pseudonym', () => {
  const p = new Pseudonymizer();
  const pseudonym = p.pseudonymize('DBPRIMARY03', 'HOST');
  const out = scrubKnownEntities('connecting to dbprimary03 now', p);
  assert.equal(out, `connecting to ${pseudonym} now`);
});

test('scrubKnownEntities: a known identifier embedded via "-"/"_" is still matched (non-alphanumeric boundary)', () => {
  const p = new Pseudonymizer();
  const pseudonym = p.pseudonymize('DBPRIMARY03', 'HOST');
  const out = scrubKnownEntities('mysql-server-DBPRIMARY03-config', p);
  assert.equal(out, `mysql-server-${pseudonym}-config`);
});

test('scrubKnownEntities: a substring of a LARGER alphanumeric word does not match', () => {
  const p = new Pseudonymizer();
  p.pseudonymize('DBPRIMARY03', 'HOST');
  // "DBPRIMARY03" is a substring of "DBPRIMARY031", but the trailing "1" is alphanumeric, so
  // there is no boundary there -- the whole larger token must be left alone.
  const out = scrubKnownEntities('host DBPRIMARY031 is unrelated', p);
  assert.equal(out, 'host DBPRIMARY031 is unrelated');
});

test('scrubKnownEntities: an unknown identifier (never minted anywhere) passes through unscrubbed', () => {
  // Documented residual limitation (see the function's own doc comment): a value that is BOTH
  // shapeless (no IP/FQDN pattern) AND never minted anywhere else in the conversation has nothing
  // for this scan to reuse, and is honestly left untouched rather than silently "handled".
  const p = new Pseudonymizer();
  p.pseudonymize('DBPRIMARY03', 'HOST'); // an unrelated known entity
  const out = scrubKnownEntities('host NEVERSEENHOST99 reporting in', p);
  assert.equal(out, 'host NEVERSEENHOST99 reporting in');
});

test('scrubKnownEntities: an empty dictionary is a no-op', () => {
  const p = new Pseudonymizer();
  const out = scrubKnownEntities('nothing minted yet for DBPRIMARY03', p);
  assert.equal(out, 'nothing minted yet for DBPRIMARY03');
});

test('scrubKnownEntities: longest known value wins so a shorter one does not corrupt it', () => {
  const p = new Pseudonymizer();
  const shortPseudonym = p.pseudonymize('DB03', 'HOST');
  const longPseudonym = p.pseudonymize('DB03-PRIMARY', 'HOST');
  const out = scrubKnownEntities('cluster member DB03-PRIMARY online', p);
  assert.equal(out, `cluster member ${longPseudonym} online`);
  assert.notEqual(shortPseudonym, longPseudonym);
});

// --- F1/F2 (adversarial validation): scrubKnownEntities's `identifiersOnly` filter --------------
//
// Live-reproduced defect (F1): "Which Ubuntu agents are critical? root cause please" became
// "Which VAL_2 agents are VAL_3? USER_4 cause please" once "ubuntu"/"critical"/"root" had each
// been minted from unrelated fields earlier in the conversation -- the unfiltered dictionary scan
// treated every minted string as a search-and-replace target over the user's own words. F2 is the
// same root cause turned on an already-inserted pseudonym token: a minted "1" corrupts "HOST_1"
// into "HOST_VAL_7" because "_" is a valid boundary. `identifiersOnly: true` (the mode the
// USER-TEXT call site in chat.ts's scrubMessagesForProvider now always passes) is the fix under
// test here; the tool-value call sites (scrubFieldValue's allow-scan branch, deepScrubContainer)
// pass no options and keep today's unfiltered behavior, covered by the pre-existing tests above.

test('F1: identifiersOnly masks all four NF-1 scenario values, in any casing', () => {
  const p = new Pseudonymizer();
  const dbprod07 = p.pseudonymize('dbprod07', 'HOST');
  const dbprimary03 = p.pseudonymize('DBPRIMARY03', 'HOST');
  const dbPrimaryDashed = p.pseudonymize('db-primary-03', 'HOST');
  const jsmith = p.pseudonymize('jsmith', 'USER');

  assert.equal(
    scrubKnownEntities('checking on DBPROD07 now', p, {
      identifiersOnly: true,
    }),
    `checking on ${dbprod07} now`,
  );
  assert.equal(
    scrubKnownEntities('agent dbprimary03 is noisy', p, {
      identifiersOnly: true,
    }),
    `agent ${dbprimary03} is noisy`,
  );
  assert.equal(
    scrubKnownEntities('mysql-server-DB-PRIMARY-03-config', p, {
      identifiersOnly: true,
    }),
    `mysql-server-${dbPrimaryDashed}-config`,
  );
  assert.equal(
    scrubKnownEntities('what did JSMITH do yesterday', p, {
      identifiersOnly: true,
    }),
    `what did ${jsmith} do yesterday`,
  );
});

test('F1: identifiersOnly leaves minted common words untouched (kind-filtered out)', () => {
  const p = new Pseudonymizer();
  // Mirrors the live repro exactly: "ubuntu"/"critical" minted as the generic VAL kind (the
  // escape hatch's fail-closed default for a field name with no host/ip/user keyword), "root"
  // minted as USER (a real "root" user is a plausible value of a user.name-shaped field) but too
  // short to pass the identifier-shape check, and a bare "3" excluded on both counts.
  p.pseudonymize('ubuntu', 'VAL');
  p.pseudonymize('critical', 'VAL');
  p.pseudonymize('root', 'USER');
  p.pseudonymize('3', 'VAL');

  const text = 'Which Ubuntu agents are critical? root cause please';
  const out = scrubKnownEntities(text, p, { identifiersOnly: true });
  assert.equal(out, text);
});

test('F1: without identifiersOnly (tool-value call sites), the same common words WOULD be corrupted -- proving the option is the fix', () => {
  const p = new Pseudonymizer();
  p.pseudonymize('ubuntu', 'VAL');
  p.pseudonymize('critical', 'VAL');
  p.pseudonymize('root', 'USER');

  const text = 'Which Ubuntu agents are critical? root cause please';
  const out = scrubKnownEntities(text, p); // identifiersOnly defaults to false
  assert.notEqual(out, text);
});

test('F2: identifiersOnly excludes a short/numeric minted value, so it cannot corrupt an already-inserted HOST_n token', () => {
  const p = new Pseudonymizer();
  p.pseudonymize('1', 'VAL'); // the short/numeric value that would corrupt HOST_1 if matched
  const hostPseudonym = p.pseudonymize('dbprod07', 'HOST');
  assert.equal(hostPseudonym, 'HOST_1');

  const text = `why is ${hostPseudonym} noisy`;
  const out = scrubKnownEntities(text, p, { identifiersOnly: true });
  assert.equal(out, text);
  assert.doesNotMatch(out, /HOST_VAL_\d+/);
});

test('F2: the shape filter alone (not just the kind filter) excludes a short value even when it carries an IP/HOST/USER-kind pseudonym', () => {
  // Isolates the SHAPE half of the identifiersOnly filter: a pathological short value minted
  // under a recoverable kind (HOST) must still be excluded by looksLikeIdentifierValue's length
  // floor, not merely by the kind check -- otherwise a short HOST/USER/IP value could still
  // corrupt another pseudonym token the same way F2's "1" did.
  const p = new Pseudonymizer();
  const shortHostPseudonym = p.pseudonymize('1', 'HOST'); // pathological: length-1 value, HOST kind
  assert.equal(shortHostPseudonym, 'HOST_1');
  const realHostPseudonym = p.pseudonymize('dbprod07', 'IP');
  assert.equal(realHostPseudonym, 'IP_1');

  const text = `why is ${realHostPseudonym} noisy`;
  const out = scrubKnownEntities(text, p, { identifiersOnly: true });
  assert.equal(out, text);
});

// --- Round-2 adversarial validation: the length/shape floor under-masked real SHORT identifiers
// (a genuine regression vs. shipped upstream, where the `user` branch's unfiltered `applyToText`
// masked ANY exact-case retype regardless of length). `looksLikeIdentifierValue` was rewritten from
// a length/shape floor to a curated stop-list: any IP/HOST/USER-kind value of length >= 3 is now
// treated as an identifier UNLESS it exactly (case-insensitively) matches `IDENTIFIER_STOP_WORDS`.

test('round 2: identifiersOnly masks real SHORT identifiers ("jdoe", "titan", "bob") in any casing that the old length floor missed', () => {
  const p = new Pseudonymizer();
  const jdoe = p.pseudonymize('jdoe', 'USER'); // 4 chars -- the old floor required 5+
  const titan = p.pseudonymize('titan', 'HOST'); // 5 chars, alpha-only -- the old floor required 6+
  const bob = p.pseudonymize('bob', 'USER'); // 3 chars -- the old floor required 5+

  assert.equal(
    scrubKnownEntities('and what did JDOE do?', p, { identifiersOnly: true }),
    `and what did ${jdoe} do?`,
  );
  assert.equal(
    scrubKnownEntities('is TITAN still noisy', p, { identifiersOnly: true }),
    `is ${titan} still noisy`,
  );
  assert.equal(
    scrubKnownEntities('ask Bob about it', p, { identifiersOnly: true }),
    `ask ${bob} about it`,
  );
});

// --- F-I1 (answer-quality adversarial validation): `inferPseudonymKind` mints HOST for ANY field
// ending in a bare `.name` segment, not just genuine hostname fields -- `process.name`/
// `file.name`/`package.name` etc. routinely mint ordinary short words ("top", "find", "make",
// "less") as HOST. Live-verified: "show me the top 10 and find all" became
// "show me the HOST_9 10 and HOST_10 USER_2" once those words had been minted this way elsewhere in
// the conversation -- invisible to the analyst, since the reverse pass restores them in the MODEL's
// own answer; they just see the assistant seem to misunderstand an ordinary question.

test('F-I1: short plain-alphabetic HOST-kind command/process names are NOT replaced in prose', () => {
  const p = new Pseudonymizer();
  p.pseudonymize('top', 'HOST'); // e.g. minted from an unlisted process.name field
  p.pseudonymize('find', 'HOST');
  p.pseudonymize('make', 'HOST');
  p.pseudonymize('less', 'HOST');

  const text = 'show me the top 10 and find all, then make it less noisy';
  const out = scrubKnownEntities(text, p, { identifiersOnly: true });
  assert.equal(out, text);
});

test('F-I1: the fix does not regress masking of real short identifiers ("jdoe"/"bob" USER, "titan" HOST-5, "db1" HOST-digit)', () => {
  const p = new Pseudonymizer();
  const jdoe = p.pseudonymize('jdoe', 'USER');
  const bob = p.pseudonymize('bob', 'USER');
  const titan = p.pseudonymize('titan', 'HOST');
  const db1 = p.pseudonymize('db1', 'HOST');

  assert.equal(
    scrubKnownEntities('ping jdoe about the outage', p, {
      identifiersOnly: true,
    }),
    `ping ${jdoe} about the outage`,
  );
  assert.equal(
    scrubKnownEntities('ask bob too', p, { identifiersOnly: true }),
    `ask ${bob} too`,
  );
  assert.equal(
    scrubKnownEntities('is titan still up', p, { identifiersOnly: true }),
    `is ${titan} still up`,
  );
  assert.equal(
    scrubKnownEntities('check db1 again', p, { identifiersOnly: true }),
    `check ${db1} again`,
  );
});

test('F-I1: without the pseudonym-kind check, a short HOST-kind command name WOULD be replaced -- proving the fix is load-bearing', () => {
  const p = new Pseudonymizer();
  p.pseudonymize('top', 'HOST');
  const text = 'show me the top 10';
  // Unfiltered dictionary scan (identifiersOnly: false/omitted) has no length/kind exemption at
  // all -- this is the allow-scan tool-value behavior, deliberately unchanged by F-I1.
  const out = scrubKnownEntities(text, p);
  assert.notEqual(out, text);
});

test('round 2: identifiersOnly leaves stop-listed common words untouched even though they clear the length floor', () => {
  const p = new Pseudonymizer();
  p.pseudonymize('root', 'USER');
  p.pseudonymize('admin', 'USER');
  p.pseudonymize('system', 'HOST');
  p.pseudonymize('unknown', 'HOST');

  const text = 'the root and admin accounts on this system are unknown to me';
  const out = scrubKnownEntities(text, p, { identifiersOnly: true });
  assert.equal(out, text);
});

test('round 2: the >= 3 character floor (not the stop-list) is what saves an inserted HOST_1 token from a minted "1"', () => {
  // Fixes a tautological predecessor of this test: minting only a STOP-LISTED value ("system")
  // plus an UNRELATED value ("dbprod07" — never appears in the asserted text) proved nothing,
  // because no minted value was ever a candidate to match inside the token either way — the
  // assertion would have passed identically with the whole `identifiersOnly` filter deleted. This
  // version mints the actual corrupting value from F2's own live repro ("1", NOT stop-listed, NOT
  // excluded by kind) and shows the length floor is what stops it: "1" clears the kind filter
  // (HOST) but fails length < 3, so it's excluded from the dictionary scan and the boundary match
  // that would otherwise turn "why is HOST_1 noisy" into "why is HOSTHOST_1_1 noisy"-shaped
  // corruption never gets the chance to fire.
  const p = new Pseudonymizer();
  const shortHostPseudonym = p.pseudonymize('1', 'HOST');
  assert.equal(shortHostPseudonym, 'HOST_1');

  const text = `why is ${shortHostPseudonym} noisy`;
  const out = scrubKnownEntities(text, p, { identifiersOnly: true });
  assert.equal(out, text);

  // Prove the floor is actually load-bearing here (not vacuously true for some other reason):
  // without `identifiersOnly`, the SAME minted value DOES corrupt the token, boundary rules and
  // all — grounding the claim that `identifiersOnly`'s length floor is what changes the outcome.
  const corrupted = scrubKnownEntities(text, p);
  assert.notEqual(corrupted, text);
});

// --- applyFieldPolicy: 'allow-scan' action (#8912) ----------------------------------------------

test('applyFieldPolicy: "allow-scan" field replaces a known dictionary hit with its existing pseudonym', () => {
  const policy: FieldPolicyEntry[] = [
    { field: 'package.name', action: 'allow-scan' },
  ];
  const p = new Pseudonymizer();
  const pseudonym = p.pseudonymize('DBPRIMARY03', 'HOST'); // minted from an earlier agent.name field
  const digest = baseDigest({
    samples: [{ 'package.name': 'vendor-agent-DBPRIMARY03-connector' }],
  });
  const out = applyFieldPolicy(digest, policy, p);
  assert.equal(
    out.samples[0]['package.name'],
    `vendor-agent-${pseudonym}-connector`,
  );
});

test('applyFieldPolicy: "allow-scan" field still runs the shape scan for embedded IPs/FQDNs', () => {
  const policy: FieldPolicyEntry[] = [
    { field: 'package.name', action: 'allow-scan' },
  ];
  const p = new Pseudonymizer();
  const digest = baseDigest({
    samples: [{ 'package.name': 'connector phoning home to 203.0.113.7' }],
  });
  const out = applyFieldPolicy(digest, policy, p);
  const value = out.samples[0]['package.name'] as string;
  assert.doesNotMatch(value, /203\.0\.113\.7/);
  assert.match(value, /^connector phoning home to IP_\d+$/);
});

test('applyFieldPolicy: "allow-scan" field with no dictionary/shape hits passes through verbatim', () => {
  const policy: FieldPolicyEntry[] = [
    { field: 'package.name', action: 'allow-scan' },
  ];
  const p = new Pseudonymizer();
  const digest = baseDigest({ samples: [{ 'package.name': 'openssl' }] });
  const out = applyFieldPolicy(digest, policy, p);
  assert.equal(out.samples[0]['package.name'], 'openssl');
});

test('applyFieldPolicy: a curated "allow" field is not affected by the allow-scan dictionary scan', () => {
  // check.name stays plain 'allow' -- a known-entity hit inside it must NOT be scrubbed, unlike
  // the allow-scan case above. Confirms the two actions stay genuinely distinct.
  const policy: FieldPolicyEntry[] = [{ field: 'check.name', action: 'allow' }];
  const p = new Pseudonymizer();
  p.pseudonymize('DBPRIMARY03', 'HOST');
  const digest = baseDigest({
    samples: [{ 'check.name': 'Verify DBPRIMARY03 patch level' }],
  });
  const out = applyFieldPolicy(digest, policy, p);
  assert.equal(out.samples[0]['check.name'], 'Verify DBPRIMARY03 patch level');
});

// --- applyFieldPolicy: 'allow-scan' through EVERY scrubAggKey bucket-key SHAPE (#8912 rework) ----
//
// The v1 version of this fix wired allow-scan inline in applyFieldPolicy's breakdown loop, which
// only ever saw a flat string key. feat/8909 (544d73a93) refactored that loop to delegate to
// `scrubAggKey`, which dispatches on the aggregation's ACTUAL key shape (scalar/multi/composite).
// Since `scrubFieldValue` is now the single place the allow-scan branch lives, and all three
// `scrubAggKey` shapes call back into `scrubFieldValue` for each component, a single allow-scan
// entry must be honored no matter which shape carries it -- these three tests prove each path
// independently rather than trusting that "it worked for scalar" generalizes.

test('applyFieldPolicy: "allow-scan" SCALAR breakdown bucket key is scrubbed against the known dictionary', () => {
  const policy: FieldPolicyEntry[] = [
    { field: 'package.name', action: 'allow-scan' },
  ];
  const p = new Pseudonymizer();
  const pseudonym = p.pseudonymize('DBPRIMARY03', 'HOST');
  const digest = baseDigest({
    breakdown: [{ key: 'agent-DBPRIMARY03-pkg', count: 2, agg: 'by_package' }],
  });
  const out = applyFieldPolicy(digest, policy, p, {
    by_package: scalarSpec('package.name'),
  });
  assert.ok(out.breakdown);
  assert.equal(out.breakdown![0].key, `agent-${pseudonym}-pkg`);
});

test('applyFieldPolicy: "allow-scan" MULTI (multi_terms) breakdown component is scrubbed against the known dictionary', () => {
  const policy: FieldPolicyEntry[] = [
    { field: 'package.name', action: 'allow-scan' },
    { field: 'wazuh.agent.id', action: 'allow' },
  ];
  const p = new Pseudonymizer();
  const pseudonym = p.pseudonymize('DBPRIMARY03', 'HOST');
  const digest = baseDigest({
    breakdown: [{ key: ['agent-DBPRIMARY03-pkg', '007'], count: 4 }],
  });
  const aggFields = {
    by_package_and_agent: {
      kind: 'multi' as const,
      fields: ['package.name', 'wazuh.agent.id'],
    },
  };
  const out = applyFieldPolicy(digest, policy, p, aggFields);
  assert.ok(out.breakdown);
  const [pkg, agent] = out.breakdown![0].key as unknown[];
  assert.equal(pkg, `agent-${pseudonym}-pkg`);
  assert.equal(agent, '007');
});

test('applyFieldPolicy: "allow-scan" COMPOSITE breakdown component is scrubbed against the known dictionary', () => {
  const policy: FieldPolicyEntry[] = [
    { field: 'package.name', action: 'allow-scan' },
    { field: 'wazuh.agent.id', action: 'allow' },
  ];
  const p = new Pseudonymizer();
  const pseudonym = p.pseudonymize('DBPRIMARY03', 'HOST');
  const digest = baseDigest({
    breakdown: [
      { key: { pkg: 'agent-DBPRIMARY03-pkg', agent: '007' }, count: 4 },
    ],
  });
  const aggFields = {
    by_package_and_agent: {
      kind: 'composite' as const,
      fields: { pkg: 'package.name', agent: 'wazuh.agent.id' },
    },
  };
  const out = applyFieldPolicy(digest, policy, p, aggFields);
  assert.ok(out.breakdown);
  const key = out.breakdown![0].key as Record<string, unknown>;
  assert.equal(key.pkg, `agent-${pseudonym}-pkg`);
  assert.equal(key.agent, '007');
});

// --- FIELD_POLICY_DEFAULTS: #8912 package.name reclassified to allow-scan -----------------------

test('FIELD_POLICY_DEFAULTS: package.name is "allow-scan", not plain allow-by-omission or "allow"', () => {
  const entry = FIELD_POLICY_DEFAULTS.find(e => e.field === 'package.name');
  assert.ok(entry, 'package.name must have an explicit policy entry');
  assert.equal(entry!.action, 'allow-scan');
});

test('FIELD_POLICY_DEFAULTS: end-to-end -- a known agent hostname embedded in package.name is caught', () => {
  const p = new Pseudonymizer();
  const pseudonym = p.pseudonymize('DBPRIMARY03', 'HOST'); // as would happen via wazuh.agent.name
  const digest = baseDigest({
    tool: 'get_agent_inventory',
    samples: [{ 'package.name': 'custom-build-for-DBPRIMARY03' }],
  });
  const out = applyFieldPolicy(
    digest,
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    'get_agent_inventory',
    true,
  );
  assert.equal(out.samples[0]['package.name'], `custom-build-for-${pseudonym}`);
});

// --- FIELD_POLICY_DEFAULTS: #8889 explicit entry for a commonly-surfaced field -------------------

test('FIELD_POLICY_DEFAULTS: wazuh.rule.title has an explicit entry, not allow-by-omission', () => {
  const entry = FIELD_POLICY_DEFAULTS.find(
    e => e.field === WAZUH_FIELD.RULE_TITLE,
  );
  assert.ok(
    entry,
    'wazuh.rule.title must have an explicit policy entry, not rely on allow-by-omission',
  );
  // Reviewed 'allow' (see the entry's own comment in privacy.ts for the reasoning and the
  // residual risk) -- an intentional decision, not a default.
  assert.equal(entry!.action, 'allow');
});

// --- Newly reachable families through search_wazuh_data's deriveColumns/
// isEscapeHatch fail-closed default, against the REAL FIELD_POLICY_DEFAULTS -- same style as the
// get_agent_inventory group above, pinning both the 'allow' fields and the ones that correctly
// stay anonymized on this same escape hatch. ------------------------------------------------------

test('applyFieldPolicy: search_wazuh_data keeps wazuh-metrics-agents identity/OS fields readable but anonymizes the new register.ip', () => {
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'search_wazuh_data',
    samples: [
      {
        'wazuh.agent.status': 'active',
        'wazuh.agent.version': 'v5.0.0',
        'wazuh.agent.host.os.platform': 'ubuntu',
        // Real docs carry this as an ARRAY
        // ("wazuh-metrics-agents": `{"agent":{"groups":["default"]}}`), not the bare string the
        // pre-review test asserted (a shape real data never produces) -- 'allow' means unscanned
        // passthrough regardless of shape, so the array survives untouched.
        'wazuh.agent.groups': ['default'],
        'wazuh.agent.register.ip': '203.0.113.7',
      },
    ],
  });
  const out = applyFieldPolicy(
    digest,
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    'search_wazuh_data',
    true, // isEscapeHatch: true, matching search_wazuh_data's deriveColumns: true
  );
  assert.equal(out.samples[0]['wazuh.agent.status'], 'active');
  assert.equal(out.samples[0]['wazuh.agent.version'], 'v5.0.0');
  assert.equal(out.samples[0]['wazuh.agent.host.os.platform'], 'ubuntu');
  assert.deepEqual(out.samples[0]['wazuh.agent.groups'], ['default']);
  assert.match(out.samples[0]['wazuh.agent.register.ip'] as string, /^IP_\d+$/);
});

// --- P-2: array/object privacy bypass regression tests -----------------

test('P-2 regression: an array-valued anonymize field is anonymized element-wise, not passed through raw', () => {
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'search_wazuh_data',
    samples: [
      {
        // Real shape on wazuh-metrics-agents: "host": {"ip": ["127.0.0.1", "10.0.0.5"]}.
        [WAZUH_FIELD.AGENT_IP]: ['127.0.0.1', '10.0.0.5'],
      },
    ],
  });
  const out = applyFieldPolicy(
    digest,
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    'search_wazuh_data',
    true,
  );
  const scrubbed = out.samples[0][WAZUH_FIELD.AGENT_IP] as string[];
  assert.equal(scrubbed.length, 2);
  assert.match(scrubbed[0], /^IP_\d+$/);
  assert.match(scrubbed[1], /^IP_\d+$/);
  assert.notEqual(scrubbed[0], scrubbed[1]);
  assert.doesNotMatch(JSON.stringify(scrubbed), /127\.0\.0\.1|10\.0\.0\.5/);
});

test('P-2 regression: an unlisted object value under the escape hatch fail-closed default is omitted, not passed through raw', () => {
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'search_wazuh_data',
    samples: [
      {
        // Real shape when `_source: ["document"]` is requested on
        // .wazuh-threatintel-vulnerabilities-a: `document` itself has no policy entry (only its
        // dotted children do), so under fail-closed it must be omitted, never shipped raw.
        document: { unlistedNested: 'attacker-influenced free text' },
      },
    ],
  });
  const out = applyFieldPolicy(
    digest,
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    'search_wazuh_data',
    true,
  );
  assert.equal('document' in out.samples[0], false);
});

test('P-2 regression: an unlisted non-empty array of objects under the escape hatch fail-closed default is omitted', () => {
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'search_wazuh_data',
    samples: [
      {
        // Real shape when `_source: ["queries"]` is requested on an .opensearch-sap-*-findings
        // document: `queries` itself is an array of objects with no bare policy entry.
        queries: [{ id: 'q1', query: 'srcip:1.2.3.4' }],
      },
    ],
  });
  const out = applyFieldPolicy(
    digest,
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    'search_wazuh_data',
    true,
  );
  assert.equal('queries' in out.samples[0], false);
});

// --- NF-2: scrubFieldValue container-shape hardening (a security-validation finding) ------------
//
// The P-2 array-recursion branch above only ever matched an array where EVERY element was a
// string. Any other container shape (array of objects, nested array, mixed-type array, plain
// object) under an EXPLICIT 'anonymize'/'allow-scan' policy entry missed every scanned branch and
// fell through to the terminal passthrough, reaching the provider raw -- making a curated field
// LESS protected than an unlisted one. These tests drive `scrubFieldValue` directly (exported
// purely for this) rather than via a full Digest, since the fix is entirely inside that function.

test('NF-2: an array of OBJECTS under an anonymize entry is deep-scrubbed, not passed through raw', () => {
  const p = new Pseudonymizer();
  const result = scrubFieldValue(
    WAZUH_FIELD.AGENT_IP, // FIELD_POLICY_DEFAULTS: action 'anonymize', kind 'IP'
    [{ addr: '127.0.0.1' }, { addr: '10.0.0.5', tag: 'primary' }],
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    false,
  );
  assert.equal(result.keep, true);
  const value = result.value as Array<Record<string, string>>;
  assert.match(value[0].addr, /^IP_\d+$/);
  assert.match(value[1].addr, /^IP_\d+$/);
  // Every STRING LEAF under this entry's subtree gets the entry's action -- deepScrubContainer
  // does not try to guess which nested key "is" the IP and leave siblings alone (there is no
  // reliable signal to do that from), so a sibling string field is pseudonymized too, with the
  // SAME 'IP' kind the entry specifies. This is the deliberate, conservative fail-closed choice:
  // better an unrelated string gets an IP-kind pseudonym than a real value slips through raw.
  assert.match(value[1].tag, /^IP_\d+$/);
  assert.doesNotMatch(
    JSON.stringify(value),
    /127\.0\.0\.1|10\.0\.0\.5|primary/,
  );
});

test('NF-2: a NESTED ARRAY under an anonymize entry is deep-scrubbed, not passed through raw', () => {
  const p = new Pseudonymizer();
  const result = scrubFieldValue(
    WAZUH_FIELD.AGENT_IP,
    [['127.0.0.1', '10.0.0.5'], ['192.168.1.1']],
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    false,
  );
  assert.equal(result.keep, true);
  const value = result.value as string[][];
  assert.match(value[0][0], /^IP_\d+$/);
  assert.match(value[0][1], /^IP_\d+$/);
  assert.match(value[1][0], /^IP_\d+$/);
  assert.doesNotMatch(
    JSON.stringify(value),
    /127\.0\.0\.1|10\.0\.0\.5|192\.168\.1\.1/,
  );
});

test('NF-2: a MIXED-TYPE array (a single null/number breaks the old .every guard) is deep-scrubbed', () => {
  const p = new Pseudonymizer();
  const result = scrubFieldValue(
    WAZUH_FIELD.AGENT_IP,
    ['127.0.0.1', null, 42, '10.0.0.5'],
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    false,
  );
  assert.equal(result.keep, true);
  const value = result.value as unknown[];
  assert.match(value[0] as string, /^IP_\d+$/);
  assert.equal(value[1], null);
  assert.equal(value[2], 42);
  assert.match(value[3] as string, /^IP_\d+$/);
});

test('F4: deepScrubContainer preserves a "__proto__" key as an own property (no prototype pollution)', () => {
  const policy: FieldPolicyEntry[] = [
    { field: 'wazuh.custom.blob', action: 'anonymize', kind: 'VAL' },
  ];
  const p = new Pseudonymizer();
  // Same JSON.parse-of-a-string construction as the deepMapStrings/prescanAndMintToolContent
  // tests above -- an object-literal `{ __proto__: ... }` would set the prototype instead of
  // creating an own key, which is not the shape this fix protects against.
  const value = JSON.parse('{"__proto__": "attacker value", "safe": "ok"}');
  const result = scrubFieldValue(
    'wazuh.custom.blob',
    value,
    policy,
    p,
    undefined,
    false,
  );
  assert.equal(result.keep, true);
  const out = result.value as Record<string, unknown>;
  assert.equal(Object.getPrototypeOf(out), Object.prototype);
  assert.ok(Object.prototype.hasOwnProperty.call(out, '__proto__'));
  assert.match(
    Object.getOwnPropertyDescriptor(out, '__proto__')?.value as string,
    /^VAL_\d+$/,
  );
});

test('NF-2: a plain OBJECT under an anonymize entry is deep-scrubbed, not passed through raw', () => {
  const p = new Pseudonymizer();
  const result = scrubFieldValue(
    WAZUH_FIELD.AGENT_IP,
    { primary: '127.0.0.1', secondary: '10.0.0.5', count: 2 },
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    false,
  );
  assert.equal(result.keep, true);
  const value = result.value as Record<string, unknown>;
  assert.match(value.primary as string, /^IP_\d+$/);
  assert.match(value.secondary as string, /^IP_\d+$/);
  assert.equal(value.count, 2);
});

test('NF-2: an array of objects under an allow-scan entry is deep-scanned (shape + known-entity), not passed through raw', () => {
  const p = new Pseudonymizer();
  // Seed a known entity so the known-entity dictionary half of allow-scan has something to hit.
  p.pseudonymize('DBPRIMARY03', 'HOST');
  const result = scrubFieldValue(
    'package.name', // FIELD_POLICY_DEFAULTS: action 'allow-scan'
    [
      { name: 'custom-build-for-DBPRIMARY03' },
      { name: 'reaches-out-to-10.0.0.9' },
    ],
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    false,
  );
  assert.equal(result.keep, true);
  const value = result.value as Array<Record<string, string>>;
  assert.doesNotMatch(value[0].name, /DBPRIMARY03/i);
  assert.doesNotMatch(value[1].name, /10\.0\.0\.9/);
});

test('NF-2: a plain object under an allow-scan entry is deep-scanned, not passed through raw', () => {
  const p = new Pseudonymizer();
  const result = scrubFieldValue(
    'package.name',
    { primary: 'reaches-out-to-10.0.0.9', label: 'ok' },
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    false,
  );
  assert.equal(result.keep, true);
  const value = result.value as Record<string, string>;
  assert.doesNotMatch(value.primary, /10\.0\.0\.9/);
  assert.equal(value.label, 'ok');
});

test('NF-2 regression: a flat string array under an anonymize entry still recurses element-wise (P-2 behavior preserved)', () => {
  const p = new Pseudonymizer();
  const result = scrubFieldValue(
    WAZUH_FIELD.AGENT_IP,
    ['127.0.0.1', '10.0.0.5'],
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    false,
  );
  assert.equal(result.keep, true);
  const value = result.value as string[];
  assert.match(value[0], /^IP_\d+$/);
  assert.match(value[1], /^IP_\d+$/);
  assert.notEqual(value[0], value[1]);
});

test('NF-2 regression: a scalar string under an anonymize entry is unchanged', () => {
  const p = new Pseudonymizer();
  const result = scrubFieldValue(
    WAZUH_FIELD.AGENT_IP,
    '127.0.0.1',
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    false,
  );
  assert.equal(result.keep, true);
  assert.match(result.value as string, /^IP_\d+$/);
});

test('NF-2 regression: a "never" field is still dropped regardless of container shape', () => {
  const p = new Pseudonymizer();
  const neverPolicy: FieldPolicyEntry[] = [
    { field: 'secret.blob', action: 'never' },
  ];
  const result = scrubFieldValue(
    'secret.blob',
    [{ any: 'shape' }, 'x', 1, null],
    neverPolicy,
    p,
    undefined,
    false,
  );
  assert.equal(result.keep, false);
  assert.equal(result.value, undefined);
});

test('F3: an unlisted field (no entry, not the escape hatch) with an object value is shape-scanned and KEPT, not dropped', () => {
  // An unlisted field's object value must not be dropped outright -- that would silently delete a
  // column that is present when privacy is off. It is shape-scanned (prescanAndMint over every
  // string leaf, the same allow-by-omission scan a scalar string gets) and KEPT, so the column
  // survives with its IP/FQDN leaves pseudonymized and everything else untouched.
  const p = new Pseudonymizer();
  const result = scrubFieldValue(
    'totally.unlisted.field',
    { nested: 'reaches out to 203.0.113.9 sometimes' },
    [],
    p,
    undefined,
    false, // isEscapeHatch: false -- allow-by-omission path, not the escape hatch
  );
  assert.equal(result.keep, true);
  const nested = (result.value as Record<string, unknown>).nested as string;
  assert.doesNotMatch(nested, /203\.0\.113\.9/);
  assert.match(nested, /IP_\d+/);
});

test('F3: an unlisted field with an object value carrying no scannable shape is kept byte-identical', () => {
  const p = new Pseudonymizer();
  const result = scrubFieldValue(
    'totally.unlisted.field',
    { nested: 'plain text, nothing to scan' },
    [],
    p,
    undefined,
    false,
  );
  assert.equal(result.keep, true);
  assert.deepEqual(result.value, { nested: 'plain text, nothing to scan' });
});

test('NF-2 regression: an empty array under an anonymize entry is unchanged (still empty, still kept)', () => {
  const p = new Pseudonymizer();
  const result = scrubFieldValue(
    WAZUH_FIELD.AGENT_IP,
    [],
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    false,
  );
  assert.equal(result.keep, true);
  assert.deepEqual(result.value, []);
});

test('NF-2 regression: numbers/booleans under an anonymize entry are unchanged', () => {
  const p = new Pseudonymizer();
  assert.equal(
    scrubFieldValue(
      WAZUH_FIELD.AGENT_IP,
      42,
      FIELD_POLICY_DEFAULTS,
      p,
      undefined,
      false,
    ).value,
    42,
  );
  assert.equal(
    scrubFieldValue(
      WAZUH_FIELD.AGENT_IP,
      true,
      FIELD_POLICY_DEFAULTS,
      p,
      undefined,
      false,
    ).value,
    true,
  );
});

test('NF-2: an explicit "allow" entry still passes a container through completely unscanned (curated passthrough preserved)', () => {
  const p = new Pseudonymizer();
  const result = scrubFieldValue(
    WAZUH_FIELD.RULE_MITRE_TECHNIQUE_ID, // FIELD_POLICY_DEFAULTS: action 'allow'
    ['T1059.001', 'T1548.002.001'],
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    false,
  );
  assert.equal(result.keep, true);
  assert.deepEqual(result.value, ['T1059.001', 'T1548.002.001']);
});

test('NF-2/F3: an escape-hatch unlisted container is still dropped outright (fail-closed default unchanged)', () => {
  // F3 only added a scan-shape path for the NON-escape-hatch (typed-tool allow-by-omission) case.
  // The escape hatch's own fail-closed default -- any finding field can be surfaced through
  // search_wazuh_data, so an unlisted one is never trusted as safe-by-omission -- must still drop
  // an unlisted container outright, exactly as NF-2 left it.
  const p = new Pseudonymizer();
  const result = scrubFieldValue(
    'escape.hatch.object',
    { a: 1 },
    [],
    p,
    undefined,
    true, // isEscapeHatch: true
  );
  assert.equal(result.keep, false);
});

test('F3: an unlisted, non-escape-hatch container is scan-shaped and kept, not dropped as a raw container', () => {
  // Companion to the escape-hatch case above: on a typed tool (isEscapeHatch: false), the SAME
  // unlisted-field/container-value combination is no longer dropped -- it survives, shape-scanned
  // (see the F3 tests above for the full scan-shape behavior).
  const p = new Pseudonymizer();
  const cases: Array<[string, unknown]> = [
    ['unlisted.object', { a: 1 }],
    ['unlisted.array', [{ a: 1 }]],
  ];
  for (const [field, value] of cases) {
    const result = scrubFieldValue(field, value, [], p, undefined, false);
    assert.equal(result.keep, true, `expected ${field} to be kept`);
    assert.ok(
      Array.isArray(result.value) || typeof result.value === 'object',
      `expected ${field} to still be a container`,
    );
  }
});

// --- F3 end-to-end: the REAL unlisted container fields this defect actually affected -----------
// document.mitre.technique.id (get-rules.ts) and document.enrichments (get-threat-intel-
// components.ts) are both `KNOWN_SAFE_STRUCTURAL_FIELDS`-certified digest sampleColumns on
// NON-deriveColumns tools -- i.e. allow-by-omission, no explicit policy entry -- so before this
// fix a Sigma rule's array of MITRE technique ids (or an enrichment record's array of enrichment
// objects) was silently DELETED from the digest under privacy ON while still present under
// privacy OFF (privacy OFF never calls applyFieldPolicy at all).

test('F3: document.mitre.technique.id (an array, allow-by-omission) survives privacy ON with its leaves shape-scanned', () => {
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'get_rules',
    samples: [
      {
        'document.mitre.technique.id': ['T1059.001', 'T1548.002.001'],
      },
    ],
  });
  const out = applyFieldPolicy(
    digest,
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    'get_rules',
    false, // isEscapeHatch: false -- get_rules is a typed, non-deriveColumns tool
  );
  // privacy ON: the column survives (not dropped) -- same column key present as privacy OFF.
  assert.ok('document.mitre.technique.id' in out.samples[0]);
  // Values are unaffected by the shape scan: MITRE ids have no IP/FQDN shape.
  assert.deepEqual(out.samples[0]['document.mitre.technique.id'], [
    'T1059.001',
    'T1548.002.001',
  ]);
});

test('F3: document.enrichments (an array of objects, allow-by-omission) survives privacy ON, string leaves shape-scanned', () => {
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'get_threat_intel_components',
    samples: [
      {
        'document.enrichments': [
          { type: 'ip', value: 'reaches out to 203.0.113.9' },
        ],
      },
    ],
  });
  const out = applyFieldPolicy(
    digest,
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    'get_threat_intel_components',
    false,
  );
  const enrichments = out.samples[0]['document.enrichments'] as Array<
    Record<string, unknown>
  >;
  // privacy ON: the column (and its row) survives -- not dropped.
  assert.equal(enrichments.length, 1);
  assert.equal(enrichments[0].type, 'ip');
  // The embedded IP inside a string leaf is still shape-scanned.
  assert.doesNotMatch(enrichments[0].value as string, /203\.0\.113\.9/);
  assert.match(enrichments[0].value as string, /IP_\d+/);
});

test('F3: an escape-hatch (search_wazuh_data) unlisted container field is still dropped, not scan-shaped', () => {
  // Confirms the escape hatch's fail-closed default is untouched by F3 -- only the typed-tool
  // allow-by-omission path (isEscapeHatch: false) gained the scan-shape behavior above.
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'search_wazuh_data',
    samples: [{ 'some.unlisted.container.field': ['a', 'b'] }],
  });
  const out = applyFieldPolicy(
    digest,
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    'search_wazuh_data',
    true, // isEscapeHatch: true
  );
  assert.equal('some.unlisted.container.field' in out.samples[0], false);
});

test('applyFieldPolicy: search_wazuh_data keeps CTI status fields (.wazuh-cti-consumers) readable', () => {
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'search_wazuh_data',
    samples: [
      {
        name: 'public-ruleset-5',
        context: 'beta3-t1-ruleset-5',
        status: 'ready',
        local_offset: 663,
        remote_offset: 663,
      },
    ],
  });
  const out = applyFieldPolicy(
    digest,
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    'search_wazuh_data',
    true,
  );
  assert.equal(out.samples[0].name, 'public-ruleset-5');
  assert.equal(out.samples[0].status, 'ready');
  assert.equal(out.samples[0].local_offset, 663);
  assert.equal(out.samples[0].remote_offset, 663);
});

test('applyFieldPolicy: search_wazuh_data keeps threatintel enrichment/vulnerability indicator fields readable (third-party content, not customer data)', () => {
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'search_wazuh_data',
    samples: [
      {
        'document.name': 'codespring.purecode.in.net',
        'document.type': 'url_domain',
        'document.provider': 'threat-fox',
        'hash.sha256':
          '43213038f6dd23be380e9ee07e339e33b27a1da94ebd6e35af3258d2f1374951',
      },
    ],
  });
  const out = applyFieldPolicy(
    digest,
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    'search_wazuh_data',
    true,
  );
  assert.equal(out.samples[0]['document.name'], 'codespring.purecode.in.net');
  assert.equal(out.samples[0]['document.type'], 'url_domain');
  assert.equal(out.samples[0]['document.provider'], 'threat-fox');
  assert.equal(
    out.samples[0]['hash.sha256'],
    '43213038f6dd23be380e9ee07e339e33b27a1da94ebd6e35af3258d2f1374951',
  );
});

test('applyFieldPolicy: search_wazuh_data still anonymizes an unlisted field on a newly-opened family (fail-closed default holds)', () => {
  // The mechanism-limit note in privacy.ts explains why some fields on the newly-opened families
  // (e.g. a CVE record's free-text rejectedReasons) are deliberately NOT given an 'allow' entry.
  // This pins that the fail-closed default actually still applies to them -- not a bug, the
  // intended outcome for a field the reviewer could not confidently classify as safe.
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'search_wazuh_data',
    samples: [
      {
        'document.containers.cna.rejectedReasons':
          'REJECT: duplicate of CVE-2024-32111',
      },
    ],
  });
  const out = applyFieldPolicy(
    digest,
    FIELD_POLICY_DEFAULTS,
    p,
    undefined,
    'search_wazuh_data',
    true,
  );
  assert.match(
    out.samples[0]['document.containers.cna.rejectedReasons'] as string,
    /^VAL_\d+$/,
  );
});

// --- #8974: usernames quoted inside an `allow` prose field (rule.title & co) --------------------
// The reported leak: with privacy mode ON, `wazuh.rule.title` reached the provider as
// "Successful user authentication - vagrant". `rule.title` is explicit 'allow' (unscanned by
// design), and the shape scan that runs over it downstream only matches IP/FQDN shapes -- a bare,
// dotless username has no shape. These tests pin the two halves of the fix (the prose fields'
// identifier-only dictionary scan, and the same-digest username pre-mint that makes sample key
// order irrelevant) plus the false-positive guards that keep ordinary words out of it.

test('applyFieldPolicy: a bare username in rule.title is scrubbed when the same digest carries it in a user field', () => {
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'get_findings',
    samples: [
      {
        // Deliberately BEFORE the user field: the title used to be scrubbed while `vagrant` was
        // still unknown to the pseudonymizer, which is exactly what `premintProseScanIdentifiers` fixes.
        [WAZUH_FIELD.RULE_TITLE]: 'Successful user authentication - vagrant',
        'source.user.name': 'vagrant',
      },
    ],
  });
  const out = applyFieldPolicy(digest, FIELD_POLICY_DEFAULTS, p);
  const title = out.samples[0][WAZUH_FIELD.RULE_TITLE] as string;
  assert.doesNotMatch(title, /vagrant/i);
  const token = out.samples[0]['source.user.name'] as string;
  assert.match(token, /^USER_\d+$/);
  // Same pseudonym in both places -- the title reuses the mint, never a second one.
  assert.equal(title, `Successful user authentication - ${token}`);
  assert.equal(
    p.reverseText(title),
    'Successful user authentication - vagrant',
  );
});

test('applyFieldPolicy: the username pre-mint also works when the user field comes FIRST in the sample', () => {
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'get_findings',
    samples: [
      {
        'source.user.name': 'auditbot',
        [WAZUH_FIELD.RULE_TITLE]: 'Failed authentication attempt - auditbot',
      },
    ],
  });
  const out = applyFieldPolicy(digest, FIELD_POLICY_DEFAULTS, p);
  const title = out.samples[0][WAZUH_FIELD.RULE_TITLE] as string;
  assert.doesNotMatch(title, /auditbot/i);
  assert.match(title, /^Failed authentication attempt - USER_\d+$/);
});

test('applyFieldPolicy: a username minted in an EARLIER turn is scrubbed from rule.title with no user field present', () => {
  // The conversation-scoped case: the pseudonymizer is constructed per request but SEEDED from the
  // client-held map, so a username minted last turn is still in the dictionary this turn -- which is
  // the reported scenario, where the finding itself carries no `source.user.name`.
  const p = new Pseudonymizer([{ value: 'vagrant', pseudonym: 'USER_1' }]);
  const digest = baseDigest({
    tool: 'get_findings',
    samples: [
      { [WAZUH_FIELD.RULE_TITLE]: 'Successful user authentication - vagrant' },
    ],
  });
  const out = applyFieldPolicy(digest, FIELD_POLICY_DEFAULTS, p);
  assert.equal(
    out.samples[0][WAZUH_FIELD.RULE_TITLE],
    'Successful user authentication - USER_1',
  );
});

test('applyFieldPolicy: a never-seen username in rule.title is the documented remaining residual (unchanged)', () => {
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'get_findings',
    samples: [
      { [WAZUH_FIELD.RULE_TITLE]: 'Successful user authentication - vagrant' },
    ],
  });
  const out = applyFieldPolicy(digest, FIELD_POLICY_DEFAULTS, p);
  assert.equal(
    out.samples[0][WAZUH_FIELD.RULE_TITLE],
    'Successful user authentication - vagrant',
  );
});

test('applyFieldPolicy: a common-word username is NOT scrubbed out of prose (stop-list guard)', () => {
  // "root" is a plausible real account AND an ordinary English word; masking it would corrupt far
  // more titles than it protects (the F1 failure mode on IDENTIFIER_STOP_WORDS). The user FIELD is
  // still pseudonymized -- only the prose scan declines it.
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'get_findings',
    samples: [
      {
        [WAZUH_FIELD.RULE_TITLE]: 'Possible root cause: privilege escalation',
        'source.user.name': 'root',
      },
    ],
  });
  const out = applyFieldPolicy(digest, FIELD_POLICY_DEFAULTS, p);
  assert.equal(
    out.samples[0][WAZUH_FIELD.RULE_TITLE],
    'Possible root cause: privilege escalation',
  );
  assert.match(out.samples[0]['source.user.name'] as string, /^USER_\d+$/);
});

test('applyFieldPolicy: the prose scan matches whole tokens only, never a substring of a longer word', () => {
  const p = new Pseudonymizer([{ value: 'vagrant', pseudonym: 'USER_1' }]);
  const digest = baseDigest({
    tool: 'get_findings',
    samples: [
      { [WAZUH_FIELD.RULE_TITLE]: 'Rule fired for vagrantbox provisioning' },
    ],
  });
  const out = applyFieldPolicy(digest, FIELD_POLICY_DEFAULTS, p);
  assert.equal(
    out.samples[0][WAZUH_FIELD.RULE_TITLE],
    'Rule fired for vagrantbox provisioning',
  );
});

test('applyFieldPolicy: a non-prose explicit "allow" field is still completely unscanned', () => {
  // The prose scan is scoped to IDENTIFIER_BEARING_FREE_TEXT_FIELDS -- a curated closed-vocabulary
  // 'allow' field (here rule.category) keeps its byte-identical passthrough even with its own value
  // sitting in the dictionary.
  const p = new Pseudonymizer([
    { value: 'authentication', pseudonym: 'USER_1' },
  ]);
  const digest = baseDigest({
    tool: 'get_findings',
    samples: [{ [WAZUH_FIELD.RULE_CATEGORY]: 'authentication' }],
  });
  const out = applyFieldPolicy(digest, FIELD_POLICY_DEFAULTS, p);
  assert.equal(out.samples[0][WAZUH_FIELD.RULE_CATEGORY], 'authentication');
});

test('applyFieldPolicy: document.metadata.description gets the prose scan while document.name keeps an FQDN-shaped indicator readable', () => {
  const p = new Pseudonymizer([{ value: 'dbprod07', pseudonym: 'HOST_1' }]);
  const digest = baseDigest({
    tool: 'get_rules',
    samples: [
      {
        'document.metadata.description':
          'Detects failed logins on dbprod07 hosts',
        // 'document.name' is a prose member too, but deliberately gets NO shape scan added, so a
        // third-party threat-intel indicator name stays verbatim.
        'document.name': 'evil-indicator.example.com',
      },
    ],
  });
  const out = applyFieldPolicy(digest, FIELD_POLICY_DEFAULTS, p);
  assert.equal(
    out.samples[0]['document.metadata.description'],
    'Detects failed logins on HOST_1 hosts',
  );
  assert.equal(out.samples[0]['document.name'], 'evil-indicator.example.com');
});

test('FIELD_POLICY_DEFAULTS: every IDENTIFIER_BEARING_FREE_TEXT_FIELDS member has an explicit "allow" entry', () => {
  // The prose scan is an ADDITION to `allow`, so a member that ever moved to anonymize/never (or
  // lost its entry) would make this set misleading rather than wrong -- pin the pairing.
  for (const field of IDENTIFIER_BEARING_FREE_TEXT_FIELDS) {
    const entry = FIELD_POLICY_DEFAULTS.find(item => item.field === field);
    assert.ok(entry, `no FIELD_POLICY_DEFAULTS entry for ${field}`);
    assert.equal(entry?.action, 'allow', `${field} is no longer 'allow'`);
  }
});

test('applyFieldPolicy: EVERY prose-set member actually receives the dictionary scan', () => {
  // Behavioural counterpart to the pairing test above: iterating the set only proves the entries
  // exist. This drives each member through applyFieldPolicy with a known identifier in the
  // dictionary, so dropping a member from the set fails here instead of silently reducing coverage.
  for (const field of IDENTIFIER_BEARING_FREE_TEXT_FIELDS) {
    const p = new Pseudonymizer([{ value: 'dbprod07', pseudonym: 'HOST_1' }]);
    const out = applyFieldPolicy(
      baseDigest({ samples: [{ [field]: 'raised for dbprod07 overnight' }] }),
      FIELD_POLICY_DEFAULTS,
      p,
    );
    assert.equal(
      out.samples[0][field],
      'raised for HOST_1 overnight',
      `${field} did not get the prose dictionary scan`,
    );
  }
});

test('applyFieldPolicy: the prose set covers each field family the delta review named', () => {
  // Pins membership itself, so a member cannot be quietly removed: rule/Sigma titles, rule
  // documentation, custom rule/decoder names, detector monitor names, stored query bodies, and the
  // CTI consumer endpoint/context (private-mirror hostnames).
  for (const field of [
    WAZUH_FIELD.RULE_TITLE,
    'document.metadata.description',
    'document.name',
    'rule.metadata.title',
    'monitor_name',
    'queries.name',
    'queries.query',
    'rule.queries.value',
    'resource',
    'context',
  ]) {
    assert.ok(
      IDENTIFIER_BEARING_FREE_TEXT_FIELDS.has(field),
      `${field} is no longer a prose-scanned field`,
    );
  }
});

test('scrubFieldValue: a prose field with no policy entry at all still gets the dictionary scan', () => {
  // Defence in depth for a stored/edited policy that no longer carries the field's own entry: the
  // allow-by-omission branch composes the dictionary scan on top of its shape scan, for these
  // fields only.
  const p = new Pseudonymizer([{ value: 'dbprod07', pseudonym: 'HOST_1' }]);
  const result = scrubFieldValue(
    WAZUH_FIELD.RULE_TITLE,
    'Brute force against dbprod07',
    [],
    p,
    undefined,
    false,
  );
  assert.equal(result.keep, true);
  assert.equal(result.value, 'Brute force against HOST_1');
});

// --- #8974 delta review: curated HOST pre-mint, admin-action interaction, stop-list widening ------

test('applyFieldPolicy: a hostname from a CURATED host field is scrubbed from rule.title in the same digest', () => {
  // Item 1 of the delta review. The load-bearing case is the PERSISTED digest: whatever text is
  // baked in here is replayed on every resumed turn with an empty client map, so an unscrubbed
  // hostname would leak repeatedly. Title deliberately precedes the host field in key order.
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'get_findings',
    samples: [
      {
        [WAZUH_FIELD.RULE_TITLE]: 'Brute force against dbprod07',
        [WAZUH_FIELD.AGENT_NAME]: 'dbprod07',
      },
    ],
  });
  const out = applyFieldPolicy(digest, FIELD_POLICY_DEFAULTS, p);
  const token = out.samples[0][WAZUH_FIELD.AGENT_NAME] as string;
  assert.match(token, /^HOST_\d+$/);
  assert.equal(
    out.samples[0][WAZUH_FIELD.RULE_TITLE],
    `Brute force against ${token}`,
  );
});

test('applyFieldPolicy: host.hostname is pre-minted for the prose scan too', () => {
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'get_agent_inventory',
    samples: [
      {
        [WAZUH_FIELD.RULE_TITLE]: 'Configuration drift on srv-app-04',
        'host.hostname': 'srv-app-04',
      },
    ],
  });
  const out = applyFieldPolicy(digest, FIELD_POLICY_DEFAULTS, p);
  const token = out.samples[0]['host.hostname'] as string;
  assert.equal(
    out.samples[0][WAZUH_FIELD.RULE_TITLE],
    `Configuration drift on ${token}`,
  );
});

// --- #1524: the aggregation half of the prose pre-mint ----------------------------------------
//
// Reported: with privacy ON, `wazuh.rule.title` reached the provider as
// "Secret or credential accessed from vault - AI-QA-AGENT-WIN$" — the estate's real NetBIOS
// hostname, in a BUCKET digest whose rows carry `{key, doc_count, wazuh.rule.title, ...}` and whose
// agent names live under the agg `key` / in `breakdown`. Neither position was pre-minted, so the
// dictionary was empty when the title was scanned.

test('applyFieldPolicy: #1524 an agent name in the agg bucket key scrubs the rule title too', () => {
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'get_top_agents',
    samples: [
      {
        key: 'AI-QA-AGENT-WIN',
        doc_count: 10,
        [WAZUH_FIELD.RULE_TITLE]:
          'Secret or credential accessed from vault - AI-QA-AGENT-WIN$',
      },
    ],
    columns: ['key', 'doc_count', WAZUH_FIELD.RULE_TITLE],
  });
  const out = applyFieldPolicy(digest, FIELD_POLICY_DEFAULTS, p, {
    by_agent: scalarSpec(WAZUH_FIELD.AGENT_NAME),
  });
  const token = out.samples[0].key as string;
  assert.match(token, /^HOST_\d+$/);
  // Cross-field pseudonym CONSISTENCY: the title carries the same token the key does, not a second
  // mint — and the real hostname is gone from both.
  assert.equal(
    out.samples[0][WAZUH_FIELD.RULE_TITLE],
    `Secret or credential accessed from vault - ${token}$`,
  );
  assert.doesNotMatch(JSON.stringify(out), /AI-QA-AGENT-WIN/i);
});

test('applyFieldPolicy: #1524 an agent name carried only by BREAKDOWN scrubs the rule title', () => {
  // The name never appears as a sample value at all — it is one key over, in the bucket list of the
  // same response payload. Before the pre-mint walked `breakdown`, the samples loop scrubbed the
  // title while the name was still unknown.
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'get_top_agents',
    samples: [
      {
        doc_count: 10,
        [WAZUH_FIELD.RULE_TITLE]:
          'Successful user authentication - AI-QA-AGENT-WIN',
      },
    ],
    columns: ['doc_count', WAZUH_FIELD.RULE_TITLE],
    breakdown: [{ key: 'AI-QA-AGENT-WIN', count: 10, agg: 'by_agent' }],
  });
  const out = applyFieldPolicy(digest, FIELD_POLICY_DEFAULTS, p, {
    by_agent: scalarSpec(WAZUH_FIELD.AGENT_NAME),
  });
  const token = out.breakdown?.[0].key as unknown as string;
  assert.match(token, /^HOST_\d+$/);
  assert.equal(
    out.samples[0][WAZUH_FIELD.RULE_TITLE],
    `Successful user authentication - ${token}`,
  );
  assert.doesNotMatch(JSON.stringify(out), /AI-QA-AGENT-WIN/i);
});

test('applyFieldPolicy: #1524 a hostname NEVER carried by the payload is still left verbatim', () => {
  // The by-construction false-positive guard, stated as a limitation: this is KNOWN-ROSTER
  // scrubbing. Nothing is guessed from prose, so a bare name the payload never carries as a value
  // (and no earlier turn minted) is untouched — and, the point of the guard, an ordinary word in a
  // title can never be replaced either.
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'get_top_agents',
    samples: [
      {
        key: 'AI-QA-AGENT-WIN',
        doc_count: 10,
        [WAZUH_FIELD.RULE_TITLE]:
          'Secret or credential accessed from vault on some-other-host',
      },
    ],
    columns: ['key', 'doc_count', WAZUH_FIELD.RULE_TITLE],
  });
  const out = applyFieldPolicy(digest, FIELD_POLICY_DEFAULTS, p, {
    by_agent: scalarSpec(WAZUH_FIELD.AGENT_NAME),
  });
  assert.equal(
    out.samples[0][WAZUH_FIELD.RULE_TITLE],
    'Secret or credential accessed from vault on some-other-host',
  );
  assert.match(out.samples[0].key as string, /^HOST_\d+$/);
});

test('applyFieldPolicy: a HOST-kind field OUTSIDE the curated pre-mint list is not pre-minted', () => {
  // The narrowing that keeps `inferPseudonymKind`'s `.name` -> HOST convention (process.name,
  // package.name, service.name -- values like "top"/"git") from widening the dictionary and
  // churning HOST counter numbering. `service.name` is anonymized by its own entry either way; it
  // is only the PROSE scan that does not see it when the title is scrubbed first.
  const policy: FieldPolicyEntry[] = [
    { field: WAZUH_FIELD.RULE_TITLE, action: 'allow' },
    { field: 'service.name', action: 'anonymize', kind: 'HOST' },
  ];
  const p = new Pseudonymizer();
  const digest = baseDigest({
    samples: [
      {
        [WAZUH_FIELD.RULE_TITLE]: 'Service nagios3 stopped unexpectedly',
        'service.name': 'nagios3',
      },
    ],
  });
  const out = applyFieldPolicy(digest, policy, p);
  assert.equal(
    out.samples[0][WAZUH_FIELD.RULE_TITLE],
    'Service nagios3 stopped unexpectedly',
  );
  assert.match(out.samples[0]['service.name'] as string, /^HOST_\d+$/);
});

test('FIELD_POLICY_DEFAULTS: every curated pre-mint host field has an explicit anonymize/HOST entry', () => {
  // The pre-mint must never invent a mint the samples loop was not already going to make -- so each
  // curated field has to be a REVIEWED hostname field, not just a plausible name.
  for (const field of PREMINT_HOST_FIELDS) {
    const entry = FIELD_POLICY_DEFAULTS.find(item => item.field === field);
    assert.ok(entry, `no FIELD_POLICY_DEFAULTS entry for ${field}`);
    assert.equal(entry?.action, 'anonymize', `${field} is not 'anonymize'`);
    assert.equal(entry?.kind, 'HOST', `${field} is not kind HOST`);
  }
});

test('applyFieldPolicy: an admin "never" entry on a prose field still drops it entirely', () => {
  // The prose scan sits behind every stricter branch, so it can never resurrect a dropped field.
  const policy: FieldPolicyEntry[] = [
    { field: WAZUH_FIELD.RULE_TITLE, action: 'never' },
  ];
  const p = new Pseudonymizer();
  const digest = baseDigest({
    samples: [{ [WAZUH_FIELD.RULE_TITLE]: 'Successful login - vagrant' }],
  });
  const out = applyFieldPolicy(digest, policy, p);
  assert.ok(!(WAZUH_FIELD.RULE_TITLE in out.samples[0]));
});

test('applyFieldPolicy: an admin "anonymize" entry on a prose field still fully pseudonymizes it', () => {
  const policy: FieldPolicyEntry[] = [
    { field: WAZUH_FIELD.RULE_TITLE, action: 'anonymize' },
  ];
  const p = new Pseudonymizer();
  const digest = baseDigest({
    samples: [{ [WAZUH_FIELD.RULE_TITLE]: 'Successful login - vagrant' }],
  });
  const out = applyFieldPolicy(digest, policy, p);
  assert.match(out.samples[0][WAZUH_FIELD.RULE_TITLE] as string, /^VAL_\d+$/);
});

test('applyFieldPolicy: an admin "allow-scan" entry on a prose field gets the FULL dictionary, not identifiersOnly', () => {
  // Branch ordering check: `allow-scan` is resolved before the prose branch, so an admin who picks
  // it gets the stronger (full-dictionary) scan, including VAL-kind entries the prose scan skips.
  const policy: FieldPolicyEntry[] = [
    { field: WAZUH_FIELD.RULE_TITLE, action: 'allow-scan' },
  ];
  const p = new Pseudonymizer([
    { value: 'authentication', pseudonym: 'VAL_1' },
  ]);
  const digest = baseDigest({
    samples: [{ [WAZUH_FIELD.RULE_TITLE]: 'Successful authentication' }],
  });
  const out = applyFieldPolicy(digest, policy, p);
  assert.equal(out.samples[0][WAZUH_FIELD.RULE_TITLE], 'Successful VAL_1');
});

test('applyFieldPolicy: a prose field resolved through a TOOL-SCOPED entry keeps tool-scoped semantics', () => {
  // A tool-scoped entry wins over the bare one (resolveFieldEntry), and the prose branch resolves
  // through that same lookup -- so `never` on get_rules/wazuh.rule.title drops the field there while
  // the bare 'allow' entry still governs any other tool.
  const policy: FieldPolicyEntry[] = [
    { field: `get_rules/${WAZUH_FIELD.RULE_TITLE}`, action: 'never' },
    { field: WAZUH_FIELD.RULE_TITLE, action: 'allow' },
  ];
  const p = new Pseudonymizer([{ value: 'vagrant', pseudonym: 'USER_1' }]);
  const digest = baseDigest({
    samples: [{ [WAZUH_FIELD.RULE_TITLE]: 'Successful login - vagrant' }],
  });

  const scoped = applyFieldPolicy(
    digest,
    policy,
    p,
    undefined,
    'get_rules',
    false,
  );
  assert.ok(!(WAZUH_FIELD.RULE_TITLE in scoped.samples[0]));

  const other = applyFieldPolicy(
    digest,
    policy,
    p,
    undefined,
    'get_findings',
    false,
  );
  assert.equal(
    other.samples[0][WAZUH_FIELD.RULE_TITLE],
    'Successful login - USER_1',
  );
});

test('applyFieldPolicy: a NON-prose digest is byte-identical, pseudonym counter numbers included', () => {
  // The pre-mint is gated on the digest carrying a prose field. This pins that (a) a digest without
  // one is unaffected, and (b) adding a prose field does not perturb THESE fields' tokens.
  //
  // (b) is deliberately a claim about this sample only, not a universal property. Pre-minting DOES
  // reorder mint calls, so a digest whose key order puts a NON-premintable fresh mint of some kind K
  // before a premintable one of the same kind K would see that kind's counter numbering shift. Every
  // field in this sample is either premintable (the two user fields, host.hostname) or of a kind no
  // premintable field shares (source.ip -> IP), and counters are per-kind, so nothing can move here.
  // A genuinely universal guarantee would need the pre-mint to not mint at all, which is not what it
  // is for.
  const sample = {
    'source.user.name': 'jsmith',
    'destination.user.name': 'ahmed',
    'host.hostname': 'srv-app-04',
    'source.ip': '10.0.2.15',
  };

  const withoutProse = applyFieldPolicy(
    baseDigest({ samples: [{ ...sample }] }),
    FIELD_POLICY_DEFAULTS,
    new Pseudonymizer(),
  );
  assert.deepEqual(withoutProse.samples[0], {
    'source.user.name': 'USER_1',
    'destination.user.name': 'USER_2',
    'host.hostname': 'HOST_1',
    'source.ip': 'IP_1',
  });

  const withProse = applyFieldPolicy(
    baseDigest({
      samples: [{ ...sample, [WAZUH_FIELD.RULE_TITLE]: 'Nothing to scrub' }],
    }),
    FIELD_POLICY_DEFAULTS,
    new Pseudonymizer(),
  );
  for (const key of Object.keys(sample)) {
    assert.equal(
      withProse.samples[0][key],
      withoutProse.samples[0][key],
      `${key} token changed when a prose field was present`,
    );
  }
});

test('applyFieldPolicy: a common SERVICE-ACCOUNT name is not scrubbed out of prose, but its own field still is', () => {
  // Item 4 of the delta review. "postgres" is a real account on every PostgreSQL host AND the name
  // of the software, so it appears in rule titles constantly while identifying nothing specific to
  // this customer. The stop list applies at SCAN time only -- the account's own field is unaffected.
  const p = new Pseudonymizer();
  const digest = baseDigest({
    tool: 'get_findings',
    samples: [
      {
        [WAZUH_FIELD.RULE_TITLE]:
          'PostgreSQL authentication failure - postgres',
        'source.user.name': 'postgres',
      },
    ],
  });
  const out = applyFieldPolicy(digest, FIELD_POLICY_DEFAULTS, p);
  assert.equal(
    out.samples[0][WAZUH_FIELD.RULE_TITLE],
    'PostgreSQL authentication failure - postgres',
  );
  assert.match(out.samples[0]['source.user.name'] as string, /^USER_\d+$/);
});

test('scrubKnownEntities: each newly stop-listed service account is left alone in prose', () => {
  for (const account of [
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
  ]) {
    const p = new Pseudonymizer();
    p.pseudonymize(account, 'USER');
    const text = `service ${account} restarted`;
    assert.equal(
      scrubKnownEntities(text, p, { identifiersOnly: true }),
      text,
      `${account} was masked in prose`,
    );
  }
});

test('scrubKnownEntities: a genuine identifier is still masked after the stop-list widening', () => {
  // Guard against the widened list swallowing real values: these must still be caught.
  for (const value of ['dbprod07', 'jsmith', 'srv-app-04', 'auditbot']) {
    const p = new Pseudonymizer();
    const token = p.pseudonymize(value, 'USER');
    assert.equal(
      scrubKnownEntities(`login by ${value} failed`, p, {
        identifiersOnly: true,
      }),
      `login by ${token} failed`,
      `${value} was NOT masked`,
    );
  }
});
