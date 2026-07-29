import assert from 'node:assert/strict';
import {
  Pseudonymizer,
  StreamDepseudonymizer,
  inferPseudonymKind,
  applyFieldPolicy,
  extractAggFields,
  prescanAndMint,
  prescanAndMintToolContent,
  FieldPolicyEntry,
} from './privacy';
import { Digest } from './digest';

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

// --- prescanAndMintToolContent (JSON-aware digest pre-scan) -----------------------------------

test('prescanAndMintToolContent: never pseudonymizes dotted ECS field-name KEYS', () => {
  const p = new Pseudonymizer();
  const digest = JSON.stringify({
    tool: 'get_alerts_by_time',
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

test('applyFieldPolicy: a "*"-suffixed entry matches the prefix field itself and any subfield', () => {
  const policy: FieldPolicyEntry[] = [
    { field: 'wazuh.rule.compliance.*', action: 'allow' },
  ];
  const p = new Pseudonymizer();
  const digest = baseDigest({
    samples: [
      {
        'wazuh.rule.compliance.pci_dss': ['10.6'],
        'wazuh.rule.compliance.hipaa': ['164.308.a.1.ii.D'],
        'wazuh.rule.compliance': 'top-level-value',
      },
    ],
  });
  const out = applyFieldPolicy(digest, policy, p, undefined, undefined, true);
  // isEscapeHatch: true (fail-closed) would anonymize anything NOT matched by the wildcard —
  // these three all stay untouched only if the wildcard entry actually matched each of them.
  assert.deepEqual(out.samples[0]['wazuh.rule.compliance.pci_dss'], ['10.6']);
  assert.deepEqual(out.samples[0]['wazuh.rule.compliance.hipaa'], [
    '164.308.a.1.ii.D',
  ]);
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
  const aggFields = { by_agent: 'agent.name', by_rule: 'rule.id' };
  const out = applyFieldPolicy(digest, policy, p, aggFields);
  assert.ok(out.breakdown);
  const byAgent = out.breakdown!.find(b => b.agg === 'by_agent')!;
  const byRule = out.breakdown!.find(b => b.agg === 'by_rule')!;
  assert.match(byAgent.key, /^HOST_\d+$/);
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
  const aggFields = { by_ip: 'data.srcip', by_rule: 'rule.id' };
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
  assert.equal(fields!.by_rule, 'rule.id');
  assert.equal(fields!.by_ip_count, 'data.srcip');
  assert.equal(fields!.by_sig, 'rule.description');
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
