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
  FieldPolicyEntry,
  FIELD_POLICY_DEFAULTS,
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

test('inferPseudonymKind: #8889 no longer misclassifies "description" as an IP field', () => {
  // 'wazuh.rule.description'.includes('ip') is true ("descr-IP-tion") under raw substring
  // matching -- the bug this fix closes. A description field is generic free text (VAL), not IP.
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

test('extractAggFields: maps each top-level agg name to its terms/significant_terms/cardinality field', () => {
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
  assert.deepEqual(fields!.by_ip_count, scalarSpec('data.srcip'));
  assert.deepEqual(fields!.by_sig, scalarSpec('rule.description'));
});

test('extractAggFields: resolves multi_terms to a "multi" spec, positionally aligned', () => {
  const body = {
    aggs: {
      by_ip_and_agent: {
        multi_terms: {
          terms: [{ field: 'source.ip' }, { field: 'wazuh.agent.id' }],
          size: 20,
        },
      },
    },
  };
  const fields = extractAggFields(body);
  assert.ok(fields);
  assert.deepEqual(fields!.by_ip_and_agent, {
    kind: 'multi',
    fields: ['source.ip', 'wazuh.agent.id'],
  });
});

test('extractAggFields: resolves composite to a "composite" spec keyed by source name', () => {
  const body = {
    aggs: {
      by_ip_and_agent: {
        composite: {
          size: 20,
          sources: [
            { ip: { terms: { field: 'source.ip' } } },
            { agent: { terms: { field: 'wazuh.agent.id' } } },
          ],
        },
      },
    },
  };
  const fields = extractAggFields(body);
  assert.ok(fields);
  assert.deepEqual(fields!.by_ip_and_agent, {
    kind: 'composite',
    fields: { ip: 'source.ip', agent: 'wazuh.agent.id' },
  });
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
// HIGH severity finding: extractAggFields previously resolved only terms/significant_terms/
// cardinality; a multi_terms or composite aggregation's field was always "unresolvable", and the
// breakdown loop's `if (!field) { scrubbed.push(bucket); continue; }` passed every such bucket's
// RAW key through untouched, WITH PRIVACY ON — a multi_terms/composite pivot on source.ip leaked
// real IPs regardless of the field's own 'anonymize' policy entry. Fixed by teaching
// extractAggFields to resolve both shapes (see the extractAggFields tests above) and by
// `scrubAggKey` handling each bucket key structurally instead of only ever handling a bare string.

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
    breakdown: [
      { key: { ip: '198.51.100.10', agent: '007' }, count: 12 },
    ],
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
  const policy: FieldPolicyEntry[] = [
    { field: 'check.name', action: 'allow' },
  ];
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
  assert.equal(
    out.samples[0]['package.name'],
    `custom-build-for-${pseudonym}`,
  );
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
