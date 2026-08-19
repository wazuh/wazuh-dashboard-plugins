import assert from 'node:assert/strict';
import { lookupIndicatorTool } from './lookup-indicator';
import { lintDsl, checkIndexAllowlist } from '../guardrails';
import { IndexerRequest } from '../types';

function build(params: Record<string, unknown>): IndexerRequest {
  return lookupIndicatorTool.buildRequest(params) as IndexerRequest;
}

test('lookup_indicator: requires a non-empty indicator', () => {
  assert.throws(() => build({}), /indicator.*required/i);
  assert.throws(() => build({ indicator: '   ' }), /indicator.*required/i);
});

test('lookup_indicator: queries wazuh-threatintel-enrichments-a with an exact-or-prefix term on document.name', () => {
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
                    value: '124.70.213.43',
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

test('lookup_indicator: trims the indicator and clamps limit to [1, 50]', () => {
  assert.equal(
    (build({ indicator: '  evil.com  ' }).body.query as any).bool.filter[0]
      .bool.should[0].term['document.name'].value,
    'evil.com',
  );
  assert.equal(build({ indicator: 'x', limit: 9999 }).body.size, 50);
  assert.equal(build({ indicator: 'x', limit: 0 }).body.size, 1);
});

// CV-049 (coverage-validation-design.md): the flagship "is this hash/IP/URL malicious" battery
// item -- live-verified 2026-08-19 against wazuh-aio-5's real 257k-doc
// wazuh-threatintel-enrichments-a: a known connection-type record's document.name is
// "124.70.213.43:18386" (IP:port), a known hash_sha256 record's document.name is the bare hash
// value, and a known url_domain record's document.name is the bare domain -- this test asserts
// the DSL shape that reaches all three via the same should-clause, not that any specific value is
// present (live presence was confirmed by direct curl during development, not re-asserted here so
// this test does not depend on fixture data that can rotate).
test('CV-049: default body passes checkIndexAllowlist and lintDsl (no time range required, no leading wildcard)', () => {
  const request = build({ indicator: 'e9a5fd60da9f1f94f1cefa43fe6b7dd80a7368c7cdba13528445724320fc4948' });
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
