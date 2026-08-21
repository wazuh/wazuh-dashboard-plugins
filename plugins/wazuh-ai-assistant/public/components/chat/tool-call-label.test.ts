import { describeToolCall, describeToolCallProvenance } from './tool-call-label';
import { TableSpec, ToolCall } from '../../../common/types';

const call = (overrides: Partial<ToolCall> = {}): ToolCall => ({
  id: 'call-1',
  name: 'get_critical_findings',
  arguments: {},
  ...overrides,
});

const table = (index: string): TableSpec =>
  ({
    columns: [],
    rows: [],
    discover: { index, dsl: {} },
  } as unknown as TableSpec);

describe('describeToolCall', () => {
  it('names the query, not the index, so two calls on one index stay distinguishable', () => {
    const spec = table('wazuh-findings-v5*');
    const first = describeToolCall(
      call({
        name: 'get_findings_by_time',
        arguments: { time_range_gte: 'now-24h' },
      }),
      spec,
    );
    const second = describeToolCall(
      call({
        name: 'get_critical_findings',
        arguments: { time_range_gte: 'now-24h' },
      }),
      spec,
    );

    expect(first.short).toBe('Findings by time · 24h');
    expect(second.short).toBe('Critical findings · 24h');
    expect(first.short).not.toBe(second.short);
  });

  it('falls back to the server default window when the call omits one', () => {
    expect(describeToolCall(call(), undefined).short).toBe(
      'Critical findings · 90d',
    );
  });

  it('drops the window from the chip when the bounds are not date-math shorthand', () => {
    const label = describeToolCall(
      call({ arguments: { time_range_gte: '2026-07-01T00:00:00Z' } }),
      undefined,
    );
    expect(label.short).toBe('Critical findings');
  });

  it('keeps the verbatim tool name, index and bounds for the tooltip', () => {
    const label = describeToolCall(
      call({ arguments: { time_range_gte: 'now-24h' } }),
      table('wazuh-findings-v5*'),
    );
    expect(label.full).toBe(
      'get_critical_findings · wazuh-findings-v5* · now-24h → now',
    );
  });

  it('humanizes an unprefixed tool name rather than dropping it', () => {
    expect(
      describeToolCall(call({ name: 'agents_summary' }), undefined).short,
    ).toBe('Agents summary · 90d');
  });
});

// Issue #9008 (G2/G3): index + resolved absolute time range for the evidence popover, and the
// single requested-vs-effective clamp badge ("90d · requested 2y").
describe('describeToolCallProvenance', () => {
  const NOW_MS = Date.parse('2026-08-21T00:00:00.000Z');
  const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

  it('reports the requested window verbatim, with no clamp, when the table carries no dsl', () => {
    const provenance = describeToolCallProvenance(
      call({ arguments: { time_range_gte: 'now-90d' } }),
      undefined,
      NOW_MS,
    );

    expect(provenance.isClamped).toBe(false);
    expect(provenance.windowBadgeLabel).toBe('90d');
    expect(provenance.index).toBeUndefined();
    expect(provenance.resolvedRangeLabel).toBeDefined();
  });

  it('reports the index and a human absolute resolved range from the table\'s discover dsl', () => {
    // Below the 90-day cap, `clampRangeClause` (guardrails.ts) leaves the clause untouched, so an
    // unclamped executed dsl still carries the SAME date-math strings the call requested.
    const table: TableSpec = {
      columns: [],
      rows: [],
      discover: {
        index: 'wazuh-findings-v5*',
        dsl: { range: { '@timestamp': { gte: 'now-90d', lte: 'now' } } },
      },
    };

    const provenance = describeToolCallProvenance(
      call({ arguments: { time_range_gte: 'now-90d' } }),
      table,
      NOW_MS,
    );

    expect(provenance.index).toBe('wazuh-findings-v5*');
    expect(provenance.isClamped).toBe(false);
    expect(provenance.windowBadgeLabel).toBe('90d');
    expect(provenance.resolvedRangeLabel).toEqual(expect.stringContaining('–'));
  });

  it('merges a clamped lookback into ONE badge stating both windows, not two separate labels', () => {
    // The model asked for 2 years; the server's 90-day lookback guardrail
    // (guardrails.ts's clampLookbackWindow) narrowed the EXECUTED query to exactly 90 days ending
    // "now" — echoed back as absolute ISO bounds in the table's own discover dsl.
    const clampedGteIso = new Date(NOW_MS - NINETY_DAYS_MS).toISOString();
    const clampedLteIso = new Date(NOW_MS).toISOString();
    const table: TableSpec = {
      columns: [],
      rows: [],
      discover: {
        index: 'wazuh-findings-v5*',
        dsl: {
          range: { '@timestamp': { gte: clampedGteIso, lte: clampedLteIso } },
        },
      },
    };

    const provenance = describeToolCallProvenance(
      call({
        name: 'get_findings_by_time',
        arguments: { time_range_gte: 'now-2y', time_range_lte: 'now' },
      }),
      table,
      NOW_MS,
    );

    expect(provenance.isClamped).toBe(true);
    expect(provenance.windowBadgeLabel).toBe('90d · requested 2y');
    expect(provenance.requested).toEqual({ gte: 'now-2y', lte: 'now' });
    expect(provenance.effective).toEqual({
      gte: clampedGteIso,
      lte: clampedLteIso,
    });
  });

  it('falls back to the raw bound strings when a duration cannot be resolved', () => {
    const provenance = describeToolCallProvenance(
      call({ arguments: { time_range_gte: 'not-a-real-bound' } }),
      undefined,
      NOW_MS,
    );

    expect(provenance.windowBadgeLabel).toBe('not-a-real-bound → now');
  });
});
