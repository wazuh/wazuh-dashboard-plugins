import assert from 'node:assert/strict';
import {
  risonEncode,
  extractTimeRange,
  buildDiscoverUrl,
  describeTimeRangeCoverage,
  hasExplicitTimeRange,
  rangeBoundsFromDsl,
  resolveBoundMs,
  resolveDiscoverTimeRange,
  DEFAULT_TIME_RANGE,
  UNBOUNDED_TIME_RANGE,
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

// --- Issue #9008 review, finding 1: the ONE-SIDED clause, in both directions -------------------
// A missing UPPER bound fills from `DEFAULT_TIME_RANGE.to` ("up to now" — the test just above, and
// deliberately unchanged). A missing LOWER bound must NOT fill from `DEFAULT_TIME_RANGE.from`: an
// `lte`-only clause bounded at a PAST instant then produced `from: 'now-24h'` with an earlier `to`
// — a window whose start is after its end, which Discover shows zero rows for while the answer
// above the link showed rows. Reproduced live on the PR branch.

test('extractTimeRange: only lte present fills the LOWER bound unbounded, not from now-24h', () => {
  const dsl = {
    range: { '@timestamp': { lte: '2020-01-01T00:00:00.000Z' } },
  };
  assert.deepEqual(extractTimeRange(dsl), {
    from: UNBOUNDED_TIME_RANGE.from,
    to: '2020-01-01T00:00:00.000Z',
  });
  assert.notEqual(extractTimeRange(dsl).from, DEFAULT_TIME_RANGE.from);
});

test('extractTimeRange: an lte-only window is never inverted', () => {
  const range = extractTimeRange({
    bool: {
      filter: [{ range: { '@timestamp': { lt: '2020-01-01T00:00:00.000Z' } } }],
    },
  });
  assert.ok(
    Date.parse(range.from) < Date.parse(range.to),
    'the resolved window must not start after it ends',
  );
});

test('extractTimeRange: only the legacy "to" spelling fills the lower bound unbounded too', () => {
  const dsl = { range: { timestamp: { to: '2020-01-01T00:00:00.000Z' } } };
  assert.equal(extractTimeRange(dsl).from, UNBOUNDED_TIME_RANGE.from);
});

test('UNBOUNDED_TIME_RANGE: an absolute instant Discover can resolve, and not the 24h default', () => {
  assert.ok(!Number.isNaN(Date.parse(UNBOUNDED_TIME_RANGE.from)));
  assert.equal(UNBOUNDED_TIME_RANGE.to, 'now');
  assert.notEqual(UNBOUNDED_TIME_RANGE.from, DEFAULT_TIME_RANGE.from);
});

// --- describeTimeRangeCoverage: what the Discover link's label has to disclose -----------------
// `hasExplicitTimeRange` says only "did the query state a window at all", which is `true` for a
// one-sided clause — correctly, but that is exactly why the disclosure label never fired for one.

test('describeTimeRangeCoverage: both bounds stated -> nothing to disclose', () => {
  assert.deepEqual(
    describeTimeRangeCoverage({
      range: { '@timestamp': { gte: 'now-7d', lte: 'now' } },
    }),
    { coverage: 'stated' },
  );
});

test('describeTimeRangeCoverage: lte-only -> openStart, naming the bound it DID state', () => {
  assert.deepEqual(
    describeTimeRangeCoverage({
      range: { '@timestamp': { lte: '2020-01-01T00:00:00.000Z' } },
    }),
    { coverage: 'openStart', statedBound: '2020-01-01T00:00:00.000Z' },
  );
});

test('describeTimeRangeCoverage: gte-only -> openEnd, naming the bound it DID state', () => {
  assert.deepEqual(
    describeTimeRangeCoverage({ range: { timestamp: { gte: 'now-7d' } } }),
    { coverage: 'openEnd', statedBound: 'now-7d' },
  );
});

test('describeTimeRangeCoverage: no clause at all (or no dsl) -> defaulted', () => {
  assert.deepEqual(describeTimeRangeCoverage({ match_all: {} }), {
    coverage: 'defaulted',
  });
  assert.deepEqual(describeTimeRangeCoverage(undefined), {
    coverage: 'defaulted',
  });
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

// --- Issue #9008 review, finding 2: SEVERAL required range clauses ------------------------------
// A query can legitimately carry more than one `@timestamp` range clause under bool.filter/must
// (`clampLookbackWindow`'s own doc comment says so). Every returned row satisfied ALL of them, so
// the window the provenance popover states must be their INTERSECTION — the latest lower bound and
// the earliest upper bound. Returning whichever clause the walk reached first stated a window wider
// (or narrower) than what the query actually matched.

test('rangeBoundsFromDsl: two range clauses intersect (latest gte, earliest lte)', () => {
  const dsl = {
    bool: {
      filter: [
        {
          range: {
            '@timestamp': {
              gte: '2026-01-01T00:00:00.000Z',
              lte: '2026-03-01T00:00:00.000Z',
            },
          },
        },
        {
          range: {
            '@timestamp': {
              gte: '2026-02-01T00:00:00.000Z',
              lte: '2026-04-01T00:00:00.000Z',
            },
          },
        },
      ],
    },
  };
  assert.deepEqual(rangeBoundsFromDsl(dsl), {
    gte: '2026-02-01T00:00:00.000Z',
    lte: '2026-03-01T00:00:00.000Z',
  });
});

test('rangeBoundsFromDsl: the intersection is found whichever order the clauses appear in', () => {
  const wider = {
    range: {
      '@timestamp': {
        gte: '2026-01-01T00:00:00.000Z',
        lte: '2026-04-01T00:00:00.000Z',
      },
    },
  };
  const narrower = {
    range: {
      '@timestamp': {
        gte: '2026-02-01T00:00:00.000Z',
        lte: '2026-03-01T00:00:00.000Z',
      },
    },
  };
  const expected = {
    gte: '2026-02-01T00:00:00.000Z',
    lte: '2026-03-01T00:00:00.000Z',
  };
  assert.deepEqual(
    rangeBoundsFromDsl({ bool: { filter: [wider, narrower] } }),
    expected,
  );
  assert.deepEqual(
    rangeBoundsFromDsl({ bool: { filter: [narrower, wider] } }),
    expected,
  );
});

test('rangeBoundsFromDsl: date-math clauses intersect against the executedAt reference', () => {
  const nowMs = Date.parse('2026-03-01T00:00:00.000Z');
  const dsl = {
    bool: {
      must: [
        { range: { '@timestamp': { gte: 'now-90d', lte: 'now' } } },
        {
          range: {
            '@timestamp': {
              gte: '2026-02-01T00:00:00.000Z',
              lte: '2026-02-15T00:00:00.000Z',
            },
          },
        },
      ],
    },
  };
  // `now-90d` resolves to 2025-12-01 at that reference, so the ISO clause is the narrower one on
  // BOTH edges. The returned strings are the literal bounds the DSL carried, never resolved
  // instants.
  assert.deepEqual(rangeBoundsFromDsl(dsl, nowMs), {
    gte: '2026-02-01T00:00:00.000Z',
    lte: '2026-02-15T00:00:00.000Z',
  });
});

test('rangeBoundsFromDsl: an unorderable pair keeps the first clause rather than guessing', () => {
  // No `nowMs` reference, so `now-90d` cannot be compared with an absolute instant at all.
  // Narrowing the window on a guess would be worse than the previous first-clause-wins result.
  const dsl = {
    bool: {
      filter: [
        { range: { '@timestamp': { gte: 'now-90d', lte: 'now' } } },
        {
          range: {
            '@timestamp': {
              gte: '2026-02-01T00:00:00.000Z',
              lte: '2026-02-15T00:00:00.000Z',
            },
          },
        },
      ],
    },
  };
  assert.deepEqual(rangeBoundsFromDsl(dsl), { gte: 'now-90d', lte: 'now' });
});

test('rangeBoundsFromDsl: a one-sided clause contributes the bound it DID state', () => {
  // Every clause here sits in `bool.filter`, so the rows that came back satisfied all of them: the
  // lone `lte` really does cap the window, even though that clause states nothing about the lower
  // edge. Nothing is invented — the reported `gte` is the one the other clause stated.
  const dsl = {
    bool: {
      filter: [
        { range: { '@timestamp': { lte: '2026-02-15T00:00:00.000Z' } } },
        {
          range: {
            '@timestamp': {
              gte: '2026-02-01T00:00:00.000Z',
              lte: '2026-03-01T00:00:00.000Z',
            },
          },
        },
      ],
    },
  };
  assert.deepEqual(rangeBoundsFromDsl(dsl), {
    gte: '2026-02-01T00:00:00.000Z',
    lte: '2026-02-15T00:00:00.000Z',
  });
});

test('rangeBoundsFromDsl: two complementary one-sided clauses together bound both edges', () => {
  const dsl = {
    bool: {
      filter: [
        { range: { '@timestamp': { lte: '2026-01-01T00:00:00.000Z' } } },
        { range: { '@timestamp': { gte: '2025-01-01T00:00:00.000Z' } } },
      ],
    },
  };
  assert.deepEqual(rangeBoundsFromDsl(dsl), {
    gte: '2025-01-01T00:00:00.000Z',
    lte: '2026-01-01T00:00:00.000Z',
  });
});

test('rangeBoundsFromDsl: undefined when every clause leaves the SAME side open', () => {
  // Two `lte`s bound only the upper edge however many there are, so no lower bound was ever
  // stated and none is reported — the "never invent a bound" rule, unchanged.
  const dsl = {
    bool: {
      filter: [
        { range: { '@timestamp': { lte: '2026-01-01T00:00:00.000Z' } } },
        { range: { '@timestamp': { lte: '2025-06-01T00:00:00.000Z' } } },
      ],
    },
  };
  assert.equal(rangeBoundsFromDsl(dsl), undefined);
  // ...but the LINK still needs an openable window, and it takes the narrower of the two uppers.
  assert.deepEqual(extractTimeRange(dsl), {
    from: UNBOUNDED_TIME_RANGE.from,
    to: '2025-06-01T00:00:00.000Z',
  });
});

// --- Issue #9008 review, F2: clauses are partitioned BY FIELD before being intersected -----------
// A DSL bounding two different timestamp fields describes two independent axes. Taking the latest
// lower of one against the earliest upper of the other produces a window that exists in neither --
// routinely an INVERTED one, which would then be recorded as a provenance FACT. That would be a
// regression against the first-clause-wins behaviour this intersection replaced.

const TWO_FIELD_DSL = {
  bool: {
    filter: [
      {
        range: {
          '@timestamp': {
            gte: '2026-02-01T00:00:00.000Z',
            lte: '2026-03-01T00:00:00.000Z',
          },
        },
      },
      {
        range: {
          'state.modified_at': {
            gte: '2020-01-01T00:00:00.000Z',
            lte: '2020-06-01T00:00:00.000Z',
          },
        },
      },
    ],
  },
};

test('rangeBoundsFromDsl: two fields report the priority field OWN window, never a mix', () => {
  // '@timestamp' comes first in TIMESTAMP_FIELDS, so it wins; `state.modified_at`'s clause is
  // dropped exactly as first-clause-wins dropped it.
  assert.deepEqual(rangeBoundsFromDsl(TWO_FIELD_DSL), {
    gte: '2026-02-01T00:00:00.000Z',
    lte: '2026-03-01T00:00:00.000Z',
  });
});

test('rangeBoundsFromDsl: the cross-field INVERTED window is never produced', () => {
  const bounds = rangeBoundsFromDsl(TWO_FIELD_DSL);
  assert.ok(bounds);
  // The mix this guards against is max(lower of @timestamp) with min(upper of state.modified_at):
  // gte 2026-02-01 / lte 2020-06-01, a window whose start is nearly six years after its end.
  assert.notEqual(bounds!.lte, '2020-06-01T00:00:00.000Z');
  assert.ok(
    Date.parse(bounds!.gte) <= Date.parse(bounds!.lte),
    'a cross-field mix would report an inverted window as a recorded fact',
  );
});

test('rangeBoundsFromDsl: the priority field is intersected within ITSELF across clauses', () => {
  const dsl = {
    bool: {
      filter: [
        {
          range: {
            '@timestamp': {
              gte: '2026-01-01T00:00:00.000Z',
              lte: '2026-04-01T00:00:00.000Z',
            },
          },
        },
        {
          range: {
            'state.modified_at': {
              gte: '2020-01-01T00:00:00.000Z',
              lte: '2020-06-01T00:00:00.000Z',
            },
          },
        },
        {
          range: {
            '@timestamp': {
              gte: '2026-02-01T00:00:00.000Z',
              lte: '2026-03-01T00:00:00.000Z',
            },
          },
        },
      ],
    },
  };
  assert.deepEqual(rangeBoundsFromDsl(dsl), {
    gte: '2026-02-01T00:00:00.000Z',
    lte: '2026-03-01T00:00:00.000Z',
  });
});

test('rangeBoundsFromDsl: a lone non-priority field is still read', () => {
  // Field PRIORITY only decides between fields that are both present -- it never makes a DSL that
  // bounds only `state.modified_at` (the wazuh-states-* families) look range-less.
  const dsl = {
    range: {
      'state.modified_at': {
        gte: '2020-01-01T00:00:00.000Z',
        lte: '2020-06-01T00:00:00.000Z',
      },
    },
  };
  assert.deepEqual(rangeBoundsFromDsl(dsl), {
    gte: '2020-01-01T00:00:00.000Z',
    lte: '2020-06-01T00:00:00.000Z',
  });
});

// --- Issue #9008 review, F1: the link, its label and the provenance record are ONE resolution ----
// `extractTimeRange` (what the button OPENS), `describeTimeRangeCoverage` (what its label SAYS) and
// `rangeBoundsFromDsl` (what the popover STATES) used to take clauses[0] for the first two while
// the third intersected, so a two-clause DSL opened the wider window and stated the narrower one --
// the exact link-vs-popover disagreement this change exists to eliminate.

test('extractTimeRange and rangeBoundsFromDsl agree on a multi-clause DSL', () => {
  const dsl = {
    bool: {
      filter: [
        {
          range: {
            '@timestamp': {
              gte: '2026-01-01T00:00:00.000Z',
              lte: '2026-04-01T00:00:00.000Z',
            },
          },
        },
        {
          range: {
            '@timestamp': {
              gte: '2026-02-01T00:00:00.000Z',
              lte: '2026-03-01T00:00:00.000Z',
            },
          },
        },
      ],
    },
  };
  const linkWindow = extractTimeRange(dsl);
  const recorded = rangeBoundsFromDsl(dsl);
  assert.deepEqual(
    { gte: linkWindow.from, lte: linkWindow.to },
    recorded,
    'the window the link opens must be the window the popover states',
  );
  // ...and specifically the INTERSECTION, not the first clause the walk reached.
  assert.deepEqual(linkWindow, {
    from: '2026-02-01T00:00:00.000Z',
    to: '2026-03-01T00:00:00.000Z',
  });
});

test('extractTimeRange and rangeBoundsFromDsl agree on a two-FIELD DSL too', () => {
  const linkWindow = extractTimeRange(TWO_FIELD_DSL);
  assert.deepEqual(
    { gte: linkWindow.from, lte: linkWindow.to },
    rangeBoundsFromDsl(TWO_FIELD_DSL),
  );
});

test('describeTimeRangeCoverage reads the intersected result, not the first clause', () => {
  // The first clause the walk reaches is one-sided, but a later clause on the same field states the
  // lower bound -- so between them the query DID bound both edges and there is nothing to disclose.
  const dsl = {
    bool: {
      filter: [
        { range: { '@timestamp': { lte: '2026-03-01T00:00:00.000Z' } } },
        { range: { '@timestamp': { gte: '2026-02-01T00:00:00.000Z' } } },
      ],
    },
  };
  assert.deepEqual(describeTimeRangeCoverage(dsl), { coverage: 'stated' });
});

test('the shared nowMs reference orders the intersection identically for link and record', () => {
  const nowMs = Date.parse('2026-03-01T00:00:00.000Z');
  const dsl = {
    bool: {
      filter: [
        { range: { '@timestamp': { gte: 'now-90d', lte: 'now' } } },
        {
          range: {
            '@timestamp': {
              gte: '2026-02-01T00:00:00.000Z',
              lte: '2026-02-15T00:00:00.000Z',
            },
          },
        },
      ],
    },
  };
  const linkWindow = extractTimeRange(dsl, nowMs);
  assert.deepEqual(
    { gte: linkWindow.from, lte: linkWindow.to },
    rangeBoundsFromDsl(dsl, nowMs),
  );
  assert.deepEqual(linkWindow, {
    from: '2026-02-01T00:00:00.000Z',
    to: '2026-02-15T00:00:00.000Z',
  });
});

// --- resolveBoundMs: moved here from tool-call-label.ts (public/) so this module can order two
// bounds while intersecting, and so the popover and the link resolve a bound through ONE function.

test('resolveBoundMs: date-math resolves against the supplied reference, ISO ignores it', () => {
  const nowMs = Date.parse('2026-03-01T00:00:00.000Z');
  assert.equal(resolveBoundMs('now', nowMs), nowMs);
  assert.equal(
    resolveBoundMs('now-90d', nowMs),
    Date.parse('2025-12-01T00:00:00.000Z'),
  );
  assert.equal(
    resolveBoundMs('2026-02-01T00:00:00.000Z', undefined),
    Date.parse('2026-02-01T00:00:00.000Z'),
  );
});

test('resolveBoundMs: date-math with no reference stays unresolved, never guessed', () => {
  assert.equal(resolveBoundMs('now', undefined), undefined);
  assert.equal(resolveBoundMs('now-7d', undefined), undefined);
  assert.equal(resolveBoundMs('not-a-bound', 0), undefined);
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

// --- resolveDiscoverTimeRange: the window the "Open in Discover" link actually carries ---------

test('resolveDiscoverTimeRange: the server-recorded effective range wins over the dsl clause', () => {
  // The two normally agree (both are read off the executed body), so this asserts the PRECEDENCE:
  // if they ever disagree, the link must open the window the server recorded executing — the same
  // fact the evidence popover states — never one re-derived client-side.
  assert.deepEqual(
    resolveDiscoverTimeRange({
      dsl: { range: { '@timestamp': { gte: 'now-24h', lte: 'now' } } },
      effectiveRange: { gte: 'now-90d', lte: 'now' },
    }),
    { from: 'now-90d', to: 'now' },
  );
});

test('resolveDiscoverTimeRange: falls back to the dsl clause when no range was recorded', () => {
  assert.deepEqual(
    resolveDiscoverTimeRange({
      dsl: { bool: { filter: { range: { timestamp: { gte: 'now-7d' } } } } },
    }),
    { from: 'now-7d', to: 'now' },
  );
});

test('resolveDiscoverTimeRange: a time-unbounded query opens on all of history, not last-24h', () => {
  // The defect this closes: a query with no time filter matched the whole index, but the link
  // narrowed Discover to 24 hours, so Discover showed a smaller total than the answer above it.
  assert.deepEqual(
    resolveDiscoverTimeRange({ dsl: { match_all: {} } }),
    UNBOUNDED_TIME_RANGE,
  );
  assert.deepEqual(resolveDiscoverTimeRange({}), UNBOUNDED_TIME_RANGE);
  assert.notEqual(UNBOUNDED_TIME_RANGE.from, 'now-24h');
});

test('resolveDiscoverTimeRange: the unbounded lower bound is an instant Discover can resolve', () => {
  assert.ok(!Number.isNaN(Date.parse(UNBOUNDED_TIME_RANGE.from)));
  assert.equal(UNBOUNDED_TIME_RANGE.to, 'now');
});

test('resolveDiscoverTimeRange: a gte-only clause fills its missing UPPER bound with "now"', () => {
  // A clause that states only a lower bound really does mean "up to now", so that edge fills from
  // `DEFAULT_TIME_RANGE.to` and is deliberately unchanged.
  assert.deepEqual(
    resolveDiscoverTimeRange({
      dsl: { range: { '@timestamp': { gte: 'now-7d' } } },
    }),
    { from: 'now-7d', to: DEFAULT_TIME_RANGE.to },
  );
});

test('resolveDiscoverTimeRange: an lte-only clause fills its missing LOWER bound unbounded, never inverted', () => {
  // The bug: the missing lower bound used to fill from `DEFAULT_TIME_RANGE.from` ('now-24h'), so an
  // lte-only clause bounded at a PAST instant produced from > to -- a window Discover shows nothing
  // at all for. A missing lower bound means "from the beginning".
  const range = resolveDiscoverTimeRange({
    dsl: { range: { '@timestamp': { lte: '2026-01-01T00:00:00.000Z' } } },
  });
  assert.deepEqual(range, {
    from: UNBOUNDED_TIME_RANGE.from,
    to: '2026-01-01T00:00:00.000Z',
  });
  assert.ok(
    Date.parse(range.from) < Date.parse(range.to),
    'the resolved window must not be inverted',
  );
});

test('resolveDiscoverTimeRange: date-math is pinned to the instant the query ran, not the render clock', () => {
  // OSD resolves `now-90d` in _g against the BROWSER's clock at click time, so an unpinned bound
  // opened a window shifted by however long ago the conversation happened -- disagreeing with both
  // the evidence popover and the answer's own total.
  const executedAt = Date.parse('2026-03-01T00:00:00.000Z');
  const range = resolveDiscoverTimeRange({
    effectiveRange: { gte: 'now-90d', lte: 'now' },
    executedAt,
  });
  assert.equal(range.to, '2026-03-01T00:00:00.000Z');
  assert.equal(range.from, '2025-12-01T00:00:00.000Z');
  assert.equal(Date.parse(range.to) - Date.parse(range.from), 90 * 86_400_000);
});

test('resolveDiscoverTimeRange: without executedAt the literal date-math bound is kept', () => {
  // A conversation persisted before `executedAt` existed: the literal bound is still better than
  // an instant fabricated against the reader's clock.
  assert.deepEqual(
    resolveDiscoverTimeRange({
      effectiveRange: { gte: 'now-90d', lte: 'now' },
    }),
    { from: 'now-90d', to: 'now' },
  );
});

test('buildDiscoverUrl: carries the resolved window into _g time, not a fixed default', () => {
  const url = buildDiscoverUrl({
    discoverAppUrl: 'https://osd.example/app/data-explorer/discover',
    indexPatternId: 'abc-123',
    dsl: { match_all: {} },
    timeRange: resolveDiscoverTimeRange({
      effectiveRange: { gte: 'now-90d', lte: 'now' },
    }),
  });
  assert.ok(url.includes("time:(from:'now-90d',to:'now')"));
  assert.ok(!url.includes("from:'now-24h'"));
});
