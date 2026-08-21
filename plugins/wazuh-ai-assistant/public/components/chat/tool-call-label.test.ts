import { describeProvenance, describeToolCall } from './tool-call-label';
import { TableSpec, ToolCall } from '../../../common/types';

const call = (overrides: Partial<ToolCall> = {}): ToolCall => ({
  id: 'call-1',
  name: 'get_critical_findings',
  arguments: {},
  ...overrides,
});

const NOW_MS = Date.parse('2026-08-21T00:00:00.000Z');
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

type Provenance = TableSpec['provenance'];

describe('describeToolCall', () => {
  // Issue #9008 blocker 1 (rework): the client must never invent a "requested" window from a
  // call's own arguments — a call with no matching provenance (the ~18 catalog tools that carry
  // no time-range concept at all, e.g. get_agents) renders its name ALONE, no window guessed.
  it('renders the name alone, with no window, when no provenance is supplied', () => {
    const label = describeToolCall(
      call({ name: 'get_agents', arguments: {} }),
      undefined,
    );
    expect(label.short).toBe('Agents');
    expect(label.full).toBe('get_agents');
  });

  it('renders the name alone when provenance is known but the DSL had no time-range clause', () => {
    const provenance: Provenance = { index: 'wazuh-states-*', clamped: false };
    const label = describeToolCall(call({ name: 'get_agents' }), provenance);
    expect(label.short).toBe('Agents');
    // The tooltip still names the index — that IS a fact the server reported — but carries no
    // window text, since the server reported none.
    expect(label.full).toBe('get_agents · wazuh-states-*');
  });

  it('shows the effective window once provenance reports one, unclamped', () => {
    const provenance: Provenance = {
      index: 'wazuh-findings-v5*',
      effectiveRange: { gte: 'now-7d', lte: 'now' },
      clamped: false,
    };
    const label = describeToolCall(
      call({ name: 'search_findings_by_agent' }),
      provenance,
    );
    expect(label.short).toBe('Findings by agent · 7d');
  });

  // Issue #9008 review, major 4: the dual-window text must be visible on the CHIP itself, not
  // only inside the popover — a reader must not have to open it to see which call was clamped.
  it('shows the dual-window text on the chip itself once provenance reports a clamp', () => {
    const provenance: Provenance = {
      index: 'wazuh-findings-v5*',
      requestedRange: { gte: 'now-720d', lte: 'now' },
      effectiveRange: {
        gte: new Date(NOW_MS - NINETY_DAYS_MS).toISOString(),
        lte: new Date(NOW_MS).toISOString(),
      },
      clamped: true,
    };
    const label = describeToolCall(
      call({ name: 'get_findings_by_time' }),
      provenance,
    );
    expect(label.short).toBe('Findings by time · 90d · requested 720d');
  });

  // Issue #9008 review, major 3: the OLD implementation truncated the whole composed string at a
  // fixed length, which cut a clamp badge mid-numeral ("requested 7…" for "requested 720d") once
  // the tool name was long enough. The fix truncates only the name segment; the window text is
  // always appended afterward, in full — this fixture's full label is 50 characters, comfortably
  // past where the old 48-char cap would have bitten.
  it('never truncates the window text, even for a long tool name plus a clamp badge', () => {
    const provenance: Provenance = {
      index: 'wazuh-findings-v5*',
      requestedRange: { gte: 'now-720d', lte: 'now' },
      effectiveRange: {
        gte: new Date(NOW_MS - NINETY_DAYS_MS).toISOString(),
        lte: new Date(NOW_MS).toISOString(),
      },
      clamped: true,
    };
    const label = describeToolCall(
      call({ name: 'search_findings_by_multiple_agents' }),
      provenance,
    );
    expect(label.short).toBe(
      'Findings by multiple agents · 90d · requested 720d',
    );
    expect(label.short).toContain('720d');
    expect(label.short).not.toContain('…');
  });

  it('never claims a clamp the server did not report, even if requestedRange is present', () => {
    // `clamped: false` — some future/edge server response could in principle carry a
    // requestedRange alongside an unclamped effectiveRange; the client must trust `clamped`
    // alone, never infer a clamp from the two ranges merely differing.
    const provenance: Provenance = {
      requestedRange: { gte: 'now-7d', lte: 'now' },
      effectiveRange: { gte: 'now-7d', lte: 'now' },
      clamped: false,
    };
    const label = describeToolCall(call(), provenance);
    expect(label.short).toBe('Critical findings · 7d');
    expect(label.short).not.toContain('requested');
  });

  it('humanizes an unprefixed tool name rather than dropping it', () => {
    const label = describeToolCall(call({ name: 'agents_summary' }), undefined);
    expect(label.short).toBe('Agents summary');
  });

  it('names the query, not the index, so two calls on one index stay distinguishable', () => {
    const provenance: Provenance = {
      index: 'wazuh-findings-v5*',
      effectiveRange: { gte: 'now-24h', lte: 'now' },
      clamped: false,
    };
    const first = describeToolCall(
      call({ id: 'call-1', name: 'get_findings_by_time' }),
      provenance,
    );
    const second = describeToolCall(
      call({ id: 'call-2', name: 'get_critical_findings' }),
      provenance,
    );
    expect(first.short).toBe('Findings by time · 24h');
    expect(second.short).toBe('Critical findings · 24h');
    expect(first.short).not.toBe(second.short);
  });
});

describe('describeProvenance', () => {
  it('returns nothing at all when provenance is undefined', () => {
    expect(describeProvenance(undefined)).toEqual({});
  });

  // Issue #9008 blocker 1: a table whose provenance carries an index but no effectiveRange (the
  // DSL had no recognizable time-range clause) must show the index with NO range/badge invented.
  it('shows only the index when the server reported no effectiveRange', () => {
    const display = describeProvenance({
      index: 'wazuh-states-inventory-*',
      clamped: false,
    });
    expect(display).toEqual({ index: 'wazuh-states-inventory-*' });
    expect(display.resolvedRangeLabel).toBeUndefined();
    expect(display.windowBadgeLabel).toBeUndefined();
  });

  it('renders the date-math shorthand for an unclamped date-math effective window', () => {
    const display = describeProvenance({
      effectiveRange: { gte: 'now-90d', lte: 'now' },
      clamped: false,
      executedAt: NOW_MS,
    });
    expect(display.windowBadgeLabel).toBe('90d');
    expect(display.resolvedRangeLabel).toContain('–');
  });

  // Issue #9008 blocker 2 (review round 2): a date-math bound only means something relative to
  // WHEN the query ran. Resolving it against the render-time clock instead of the server-recorded
  // `executedAt` would show a restored conversation a window it never actually ran against — this
  // pins that by mocking `Date.now()` to a wildly different instant and asserting the resolved
  // range still reflects `executedAt`, never the mocked render clock.
  it('resolves date-math bounds against the recorded executedAt, never the render-time clock', () => {
    const executedAt = Date.parse('2026-01-15T00:00:00.000Z');
    const realDateNow = Date.now;
    Date.now = () => Date.parse('2031-06-01T00:00:00.000Z');
    try {
      const display = describeProvenance({
        effectiveRange: { gte: 'now-90d', lte: 'now' },
        clamped: false,
        executedAt,
      });
      expect(display.resolvedRangeLabel).toContain('2026');
      expect(display.resolvedRangeLabel).not.toContain('2031');
    } finally {
      Date.now = realDateNow;
    }
  });

  // The other half of blocker 2: an older persisted conversation carries no `executedAt` at all
  // (saved before this field existed). A date-math bound must stay UNRESOLVED then — never a
  // guess against whatever clock happens to be running at render time — while the shorthand
  // badge (which needs no "now" reference at all) still renders normally.
  it('does not resolve date-math to an absolute instant when executedAt is absent', () => {
    const display = describeProvenance({
      effectiveRange: { gte: 'now-90d', lte: 'now' },
      clamped: false,
    });
    expect(display.windowBadgeLabel).toBe('90d');
    expect(display.resolvedRangeLabel).toBeUndefined();
  });

  // Issue #9008 blocker 2: no `?? requested` fallback anywhere — a `requestedRange` present
  // without `clamped: true` must never leak into the badge.
  it('ignores requestedRange entirely when clamped is false', () => {
    const display = describeProvenance({
      requestedRange: { gte: 'now-720d', lte: 'now' },
      effectiveRange: { gte: 'now-90d', lte: 'now' },
      clamped: false,
    });
    expect(display.windowBadgeLabel).toBe('90d');
  });

  it('merges a clamped lookback into ONE badge stating both windows', () => {
    const clampedGteIso = new Date(NOW_MS - NINETY_DAYS_MS).toISOString();
    const clampedLteIso = new Date(NOW_MS).toISOString();
    const display = describeProvenance({
      index: 'wazuh-findings-v5*',
      requestedRange: { gte: 'now-720d', lte: 'now' },
      effectiveRange: { gte: clampedGteIso, lte: clampedLteIso },
      clamped: true,
    });
    expect(display.windowBadgeLabel).toBe('90d · requested 720d');
    expect(display.resolvedRangeLabel).toContain('–');
  });

  // Issue #9008 review, minor 6: a clamp whose requested and effective spans happen to render
  // identically (e.g. both round to "90d") has nothing further to disclose — the dual badge must
  // not degrade into "90d · requested 90d", which repeats itself without adding information.
  it('omits the requested half when it renders identically to the effective window', () => {
    const display = describeProvenance({
      requestedRange: { gte: 'now-90d', lte: 'now' },
      effectiveRange: { gte: 'now-90d', lte: 'now' },
      clamped: true,
    });
    expect(display.windowBadgeLabel).toBe('90d');
    expect(display.windowBadgeLabel).not.toContain('requested');
  });

  it('computes a span for two absolute ISO bounds instead of using date-math shorthand', () => {
    const display = describeProvenance({
      effectiveRange: {
        gte: '2026-01-01T00:00:00.000Z',
        lte: '2026-01-08T00:00:00.000Z',
      },
      clamped: false,
    });
    expect(display.windowBadgeLabel).toBe('7d');
  });

  it('falls back to the raw bound strings when a span cannot be resolved', () => {
    const display = describeProvenance({
      effectiveRange: { gte: 'not-a-real-bound', lte: 'now' },
      clamped: false,
    });
    expect(display.windowBadgeLabel).toBe('not-a-real-bound → now');
    // No absolute instant could be resolved for `gte` either, so no resolved range label.
    expect(display.resolvedRangeLabel).toBeUndefined();
  });
});
