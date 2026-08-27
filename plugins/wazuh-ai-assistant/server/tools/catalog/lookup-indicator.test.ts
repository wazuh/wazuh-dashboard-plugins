import assert from 'node:assert/strict';
import { lookupIndicatorTool } from './lookup-indicator';
import { lintDsl, checkIndexAllowlist } from '../guardrails';
import { IndexerRequest } from '../types';

function build(params: Record<string, unknown>): IndexerRequest {
  return lookupIndicatorTool.buildRequest(params) as IndexerRequest;
}

// Narrows the query DSL's `bool.filter[0].bool.should` clause list without an `any` cast --
// every test below only ever needs this one shape out of the broader DSL union.
function boolFilterShould(query: unknown): Array<Record<string, unknown>> {
  return (
    query as {
      bool: {
        filter: Array<{ bool: { should: Array<Record<string, unknown>> } }>;
      };
    }
  ).bool.filter[0].bool.should;
}

test('lookup_indicator: requires a non-empty indicator', () => {
  assert.throws(() => build({}), /indicator.*required/i);
  assert.throws(() => build({ indicator: '   ' }), /indicator.*required/i);
});

test('lookup_indicator: a bare IP queries wazuh-threatintel-enrichments-a with an exact term PLUS an anchored "ip:" prefix', () => {
  const request = build({ indicator: '124.70.213.43' });
  assert.equal(request.index, 'wazuh-threatintel-enrichments-a');
  assert.deepEqual(request.body.query, {
    bool: {
      filter: [
        {
          bool: {
            minimum_should_match: 1,
            should: [
              {
                term: {
                  'document.name': {
                    value: '124.70.213.43',
                    case_insensitive: true,
                  },
                },
              },
              {
                prefix: {
                  'document.name': {
                    value: '124.70.213.43:',
                    case_insensitive: true,
                  },
                },
              },
            ],
          },
        },
      ],
    },
  });
  assert.equal(request.body.size, 10);
});

test('lookup_indicator: a non-IP indicator (hash/url/domain) is exact-term only, no prefix arm', () => {
  const request = build({ indicator: 'google.com' });
  assert.deepEqual(request.body.query, {
    bool: {
      filter: [
        {
          bool: {
            minimum_should_match: 1,
            should: [
              {
                term: {
                  'document.name': {
                    value: 'google.com',
                    case_insensitive: true,
                  },
                },
              },
            ],
          },
        },
      ],
    },
  });
});

// A-1: an unanchored prefix arm would match `prefix document.name = "124.70.213.4"` against all
// 55 "124.70.213.43:<port>" records -- a false known-malicious verdict for a distinct, benign IP.
// The anchored `${indicator}:` prefix makes that structurally impossible: "124.70.213.4:" is
// never a prefix of "124.70.213.43:<port>" (the character after "124.70.213.4" in the real
// record is "3", not ":").
test("A-1 regression: 124.70.213.4 must NOT match 124.70.213.43's connection records", () => {
  const request = build({ indicator: '124.70.213.4' });
  const shouldClauses = boolFilterShould(request.body.query);
  const prefixClause = shouldClauses.find(clause => 'prefix' in clause) as
    | { prefix: { 'document.name': { value: string } } }
    | undefined;
  assert.ok(
    prefixClause,
    'expected an anchored prefix clause for a bare IP indicator',
  );
  const prefixValue = prefixClause!.prefix['document.name'].value;
  assert.equal(prefixValue, '124.70.213.4:');
  // The DSL shape itself proves the false positive is impossible: a real "124.70.213.43:<port>"
  // document.name does not start with "124.70.213.4:" (it starts with "124.70.213.43:"), so no
  // amount of live data can make this prefix clause match that record.
  assert.equal('124.70.213.43:18386'.startsWith(prefixValue), false);
  assert.equal('124.70.213.4:80'.startsWith(prefixValue), true);
});

// A-1 regression, domain half: an unanchored prefix would match
// "google.com-x09-206-188-196-165.sslip.io" for input "google.com". A domain is never treated as
// a bare IP, so it gets no prefix clause at all -- exact-term-only, which cannot match a
// longer, unrelated hostname.
test('A-1 regression: google.com gets no prefix clause (would have matched *.sslip.io typosquats)', () => {
  const request = build({ indicator: 'google.com' });
  const shouldClauses = boolFilterShould(request.body.query);
  assert.equal(
    shouldClauses.some(clause => 'prefix' in clause),
    false,
  );
});

test('lookup_indicator: trims the indicator and clamps limit to [1, 50]', () => {
  assert.equal(
    (
      boolFilterShould(build({ indicator: '  evil.com  ' }).body.query)[0] as {
        term: { 'document.name': { value: string } };
      }
    ).term['document.name'].value,
    'evil.com',
  );
  assert.equal(build({ indicator: 'x', limit: 9999 }).body.size, 50);
  assert.equal(build({ indicator: 'x', limit: 0 }).body.size, 1);
});

// The flagship "is this hash/IP/URL malicious" battery
// item -- live-verified 2026-08-19 against wazuh-aio-5's real 257k-doc
// wazuh-threatintel-enrichments-a: a known connection-type record's document.name is
// "124.70.213.43:18386" (IP:port), a known hash_sha256 record's document.name is the bare hash
// value, and a known url_domain record's document.name is the bare domain -- this test asserts
// the DSL shape that reaches all three via the same should-clause, not that any specific value is
// present (live presence was confirmed by direct curl during development, not re-asserted here so
// this test does not depend on fixture data that can rotate).
test('default body passes checkIndexAllowlist and lintDsl (no time range required, no leading wildcard)', () => {
  const request = build({
    indicator:
      'e9a5fd60da9f1f94f1cefa43fe6b7dd80a7368c7cdba13528445724320fc4948',
  });
  assert.equal(checkIndexAllowlist(request.index).ok, true);
  const result = lintDsl(request.body, request.index);
  assert.equal(result.ok, true, result.ok ? '' : result.reason);
});

test('lookup_indicator: table/digest columns stay within the declared _source', () => {
  const source = new Set(build({ indicator: 'x' }).body._source as string[]);
  for (const column of lookupIndicatorTool.tableSpec.columns) {
    assert.ok(source.has(column.field), `${column.field} missing from _source`);
  }
  for (const field of lookupIndicatorTool.tableSpec.rowFields ?? []) {
    assert.ok(source.has(field), `${field} missing from _source`);
  }
  for (const field of lookupIndicatorTool.digest.sampleColumns) {
    assert.ok(source.has(field), `${field} missing from _source`);
  }
});
