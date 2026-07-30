import assert from 'node:assert/strict';
import {
  risonEncode,
  extractTimeRange,
  buildDiscoverUrl,
} from './discover-url';

test('risonEncode: plain string is single-quoted', () => {
  assert.equal(risonEncode('wazuh-findings-v5*'), "'wazuh-findings-v5*'");
});

test("risonEncode: internal single quote escaped as !'", () => {
  assert.equal(risonEncode("O'Brien"), "'O!'Brien'");
});

test("risonEncode: bang escaped as !! (before the quote pass, so a literal !' cannot appear)", () => {
  assert.equal(risonEncode('a!b'), "'a!!b'");
  assert.equal(risonEncode("a!'b"), "'a!!!'b'");
});

test('risonEncode: booleans and null use the !t/!f/!n tokens', () => {
  assert.equal(risonEncode(true), '!t');
  assert.equal(risonEncode(false), '!f');
  assert.equal(risonEncode(null), '!n');
});

test('risonEncode: numbers are emitted bare', () => {
  assert.equal(risonEncode(0), '0');
  assert.equal(risonEncode(24), '24');
});

test('risonEncode: nested object uses bare keys and (k:v,...) shape', () => {
  const out = risonEncode({ gte: 'now-24h', lte: 'now' });
  assert.equal(out, "(gte:'now-24h',lte:'now')");
});

test('risonEncode: array of primitives uses !(...) shape', () => {
  assert.equal(risonEncode([1, 'a', true]), "!(1,'a',!t)");
});

test('risonEncode: full nested query DSL clause', () => {
  const dsl = {
    bool: {
      filter: [{ range: { timestamp: { gte: 'now-24h', lte: 'now' } } }],
      must: [{ match: { 'wazuh.rule.level': 'medium' } }],
    },
  };
  const out = risonEncode(dsl);
  assert.equal(
    out,
    "(bool:(filter:!((range:(timestamp:(gte:'now-24h',lte:'now')))),must:!((match:('wazuh.rule.level':'medium')))))",
  );
});

test('extractTimeRange: finds a range clause inside bool.filter', () => {
  const dsl = {
    bool: {
      filter: [{ range: { timestamp: { gte: 'now-15m', lte: 'now' } } }],
    },
  };
  assert.deepEqual(extractTimeRange(dsl), { from: 'now-15m', to: 'now' });
});

test('extractTimeRange: finds a range clause inside bool.must', () => {
  const dsl = {
    bool: {
      must: [
        {
          range: {
            '@timestamp': {
              gte: '2026-07-01T00:00:00Z',
              lte: '2026-07-13T00:00:00Z',
            },
          },
        },
      ],
    },
  };
  assert.deepEqual(extractTimeRange(dsl), {
    from: '2026-07-01T00:00:00Z',
    to: '2026-07-13T00:00:00Z',
  });
});

test('extractTimeRange: finds a top-level range clause (no bool wrapper)', () => {
  const dsl = { range: { timestamp: { gte: 'now-7d', lte: 'now' } } };
  assert.deepEqual(extractTimeRange(dsl), { from: 'now-7d', to: 'now' });
});

test('extractTimeRange: only gte present falls back to the default "to"', () => {
  const dsl = { range: { timestamp: { gte: 'now-1h' } } };
  assert.deepEqual(extractTimeRange(dsl), { from: 'now-1h', to: 'now' });
});

test('extractTimeRange: absent range clause falls back to the default 24h window', () => {
  assert.deepEqual(extractTimeRange({ match_all: {} }), {
    from: 'now-24h',
    to: 'now',
  });
});

test('extractTimeRange: undefined dsl falls back to the default 24h window', () => {
  assert.deepEqual(extractTimeRange(undefined), { from: 'now-24h', to: 'now' });
});

test('buildDiscoverUrl: produces the expected rison-encoded, encodeURI-escaped hash', () => {
  const url = buildDiscoverUrl({
    discoverAppUrl: 'https://osd.example/app/data-explorer/discover',
    indexPatternId: 'abc-123',
    dsl: { match_all: {} },
    timeRange: { from: 'now-24h', to: 'now' },
  });

  assert.ok(
    url.startsWith('https://osd.example/app/data-explorer/discover#?_a='),
  );
  assert.ok(url.includes("metadata:(indexPattern:'abc-123',view:discover)"));
  assert.ok(url.includes('discover:(columns:!(_source),isDirty:!f,sort:!())'));
  assert.ok(url.includes('query:(match_all:())'));
  assert.ok(url.includes("index:'abc-123'"));
  assert.ok(url.includes("time:(from:'now-24h',to:'now')"));
  assert.ok(url.includes('refreshInterval:(pause:!t,value:0)'));
  // The alias literal contains a space; encodeURI (not encodeURIComponent) must escape only that,
  // leaving every bit of rison punctuation (', !, (, ), :, comma) untouched.
  assert.ok(url.includes('AI%20Assistant%20query'));
  assert.ok(
    !url.includes('%27'),
    'single quotes must survive encodeURI unescaped',
  );
});
