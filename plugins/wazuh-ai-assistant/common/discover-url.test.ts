import assert from 'node:assert/strict';
import {
  risonEncode,
  extractTimeRange,
  buildDiscoverUrl,
  hasExplicitTimeRange,
  rangeBoundsFromDsl,
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

// --- rangeFromClause: the gt/lt/from/to bound spellings (issue #8920 item 9's time-range half) --
// Previously only gte/lte were read; a model-authored range in any of the other three legal
// OpenSearch spellings silently fell back to the 24h default instead of the real window.

test('extractTimeRange: exclusive gt/lt bounds are read like gte/lte', () => {
  const dsl = { range: { timestamp: { gt: 'now-2h', lt: 'now' } } };
  assert.deepEqual(extractTimeRange(dsl), { from: 'now-2h', to: 'now' });
});

test('extractTimeRange: legacy from/to bounds are read like gte/lte', () => {
  const dsl = { range: { timestamp: { from: 'now-30d', to: 'now-1d' } } };
  assert.deepEqual(extractTimeRange(dsl), { from: 'now-30d', to: 'now-1d' });
});

test('extractTimeRange: only gt present falls back to the default "to" (same as gte-only)', () => {
  const dsl = { range: { timestamp: { gt: 'now-1h' } } };
  assert.deepEqual(extractTimeRange(dsl), { from: 'now-1h', to: 'now' });
});

// --- findTimeRangeClause: single-clause-object bool.filter/bool.must, and one bool level deeper -
// (issue #8920 item 9's time-range half). Both single-object clauses and a nested bool are legal
// DSL shapes that the previous array-only, one-level walk in extractTimeRange never read.

test('findTimeRangeClause: bool.filter as a SINGLE clause object (not an array) is still read', () => {
  const dsl = {
    bool: {
      filter: { range: { '@timestamp': { gte: 'now-2h', lte: 'now' } } },
    },
  };
  assert.deepEqual(extractTimeRange(dsl), { from: 'now-2h', to: 'now' });
});

test('findTimeRangeClause: bool.must as a SINGLE clause object (not an array) is still read', () => {
  const dsl = {
    bool: {
      must: {
        range: { 'state.modified_at': { gte: 'now-90d', lte: 'now' } },
      },
    },
  };
  assert.deepEqual(extractTimeRange(dsl), { from: 'now-90d', to: 'now' });
});

test('findTimeRangeClause: recurses one bool level deeper (a nested bool inside bool.filter)', () => {
  const dsl = {
    bool: {
      filter: [
        {
          bool: {
            filter: [{ range: { timestamp: { gte: 'now-3d', lte: 'now' } } }],
          },
        },
      ],
    },
  };
  assert.deepEqual(extractTimeRange(dsl), { from: 'now-3d', to: 'now' });
});

// --- hasExplicitTimeRange: no direct unit test existed at all before this pass. Exported for
// suggest-discover-query.ts's window-defaulted disclosure (issue #8920 item 9) -- getting this
// wrong (e.g. always true) would silently drop that disclosure.

test("hasExplicitTimeRange: true when extractTimeRange would find the model's own window", () => {
  const dsl = {
    bool: {
      filter: [{ range: { timestamp: { gte: 'now-7d', lte: 'now' } } }],
    },
  };
  assert.equal(hasExplicitTimeRange(dsl), true);
});

test('hasExplicitTimeRange: false when no readable range clause is present', () => {
  assert.equal(hasExplicitTimeRange({ match_all: {} }), false);
});

test('hasExplicitTimeRange: false for undefined dsl', () => {
  assert.equal(hasExplicitTimeRange(undefined), false);
});

// Issue #9008 rework: `rangeBoundsFromDsl` is the ONE function server (executor.ts's provenance
// facts) and client (tool-call-label.ts's popover) both read a DSL's time window through, and it
// must never substitute a default the DSL did not actually state.
test('rangeBoundsFromDsl: reads the gte/lte pair when an explicit range clause is present', () => {
  const dsl = { range: { '@timestamp': { gte: 'now-7d', lte: 'now' } } };
  assert.deepEqual(rangeBoundsFromDsl(dsl), { gte: 'now-7d', lte: 'now' });
});

test('rangeBoundsFromDsl: undefined (never the 24h default) when no range clause is present', () => {
  assert.equal(rangeBoundsFromDsl({ match_all: {} }), undefined);
});

test('rangeBoundsFromDsl: undefined for undefined dsl', () => {
  assert.equal(rangeBoundsFromDsl(undefined), undefined);
});

// Issue #9008 review, major 5: `extractTimeRange` (the Discover LINK's own reader) fills a
// missing bound from `DEFAULT_TIME_RANGE` so the link always has an openable window -- a
// legitimate default for that caller. `rangeBoundsFromDsl` feeds `TableSpec.provenance`, a FACT
// record, and must NOT inherit that default: an escape-hatch query with only an `lte` bound (no
// `gte` at all) must report NO range at all, never a fabricated `gte`.
test('rangeBoundsFromDsl: undefined for a one-sided clause (lte only, no gte)', () => {
  const dsl = { range: { '@timestamp': { lte: 'now' } } };
  assert.equal(rangeBoundsFromDsl(dsl), undefined);
});

test('rangeBoundsFromDsl: undefined for a one-sided clause (gte only, no lte)', () => {
  const dsl = { range: { '@timestamp': { gte: 'now-90d' } } };
  assert.equal(rangeBoundsFromDsl(dsl), undefined);
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
