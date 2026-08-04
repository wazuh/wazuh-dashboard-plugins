import { describeToolCall } from './tool-call-label';
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
      call({ name: 'get_findings_by_time', arguments: { time_range_gte: 'now-24h' } }),
      spec,
    );
    const second = describeToolCall(
      call({ name: 'get_critical_findings', arguments: { time_range_gte: 'now-24h' } }),
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
    expect(describeToolCall(call({ name: 'agents_summary' }), undefined).short).toBe(
      'Agents summary · 90d',
    );
  });
});
