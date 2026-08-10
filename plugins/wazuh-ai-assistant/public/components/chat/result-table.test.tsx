import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResultTable } from './result-table';
import { TableSpec } from '../../../common/types';

function spec(overrides: Partial<TableSpec> = {}): TableSpec {
  return {
    columns: [
      { id: 'agent', label: 'Agent' },
      { id: 'level', label: 'Severity' },
    ],
    rows: [{ agent: 'web-01', level: 12 }],
    ...overrides,
  };
}

describe('ResultTable', () => {
  it('shows a collapsed accordion for tables with more than 10 rows, mounting no table rows until opened', () => {
    const manyRows = Array.from({ length: 11 }, (_unused, i) => ({
      agent: `agent-${i}`,
    }));
    const { container } = render(
      <ResultTable
        spec={spec({
          columns: [{ id: 'agent', label: 'Agent' }],
          rows: manyRows,
        })}
      />,
    );

    expect(screen.getByText('Results (11 rows)')).toBeInTheDocument();
    // Lazy-mount: nothing beneath the (collapsed) accordion header yet.
    expect(container.querySelector('table')).toBeNull();
  });

  it('auto-expands (and mounts the table) for 10 rows or fewer', () => {
    const { container } = render(
      <ResultTable
        spec={spec({
          columns: [{ id: 'agent', label: 'Agent' }],
          rows: [{ agent: 'web-01' }],
        })}
      />,
    );

    expect(container.querySelector('table')).not.toBeNull();
    expect(screen.getByText('web-01')).toBeInTheDocument();
  });

  it('mounts the table once a previously-collapsed accordion (>10 rows) is opened', () => {
    const manyRows = Array.from({ length: 12 }, (_unused, i) => ({
      agent: `agent-${i}`,
    }));
    const { container } = render(
      <ResultTable
        spec={spec({
          columns: [{ id: 'agent', label: 'Agent' }],
          rows: manyRows,
        })}
      />,
    );

    expect(container.querySelector('table')).toBeNull();
    fireEvent.click(screen.getByText('Results (12 rows)'));
    expect(container.querySelector('table')).not.toBeNull();
    expect(screen.getByText('agent-0')).toBeInTheDocument();
  });

  it('paginates: only the first DEFAULT_PAGE_SIZE (5) rows are in the DOM at once', () => {
    const thirtyRows = Array.from({ length: 30 }, (_unused, i) => ({
      agent: `agent-${i}`,
    }));
    render(
      <ResultTable
        spec={spec({
          columns: [{ id: 'agent', label: 'Agent' }],
          rows: thirtyRows,
        })}
      />,
    );
    // 30 rows is over the auto-expand threshold (10), so the accordion starts collapsed.
    fireEvent.click(screen.getByText('Results (30 rows)'));

    expect(screen.getByText('agent-0')).toBeInTheDocument();
    expect(screen.getByText('agent-4')).toBeInTheDocument();
    expect(screen.queryByText('agent-5')).toBeNull();
    expect(screen.queryByText('agent-29')).toBeNull();
  });

  // The page size is what keeps the table a readable height now that the body has no inner
  // scroller, so "no max-height on the table body" is a behavior worth pinning: a scrollbar
  // reappearing here would put one scrolling box inside another.
  it('does not cap the table body height (no scroll-within-scroll)', () => {
    const { container } = render(
      <ResultTable
        spec={spec({
          columns: [{ id: 'agent', label: 'Agent' }],
          rows: Array.from({ length: 4 }, (_unused, i) => ({
            agent: `agent-${i}`,
          })),
        })}
      />,
    );

    const scrollBoxes = [...container.querySelectorAll('div')].filter(element =>
      (element.getAttribute('style') ?? '').includes('max-height'),
    );
    expect(scrollBoxes).toHaveLength(0);
  });

  describe('severity badge rendering', () => {
    it('renders an already-word severity value (Wazuh 5.0 findings) directly, case-insensitively', () => {
      render(
        <ResultTable
          spec={spec({
            columns: [
              { id: 'agent', label: 'Agent' },
              { id: 'severity', label: 'Severity' },
            ],
            rows: [{ agent: 'a', severity: 'CRITICAL' }],
            severityColumn: 'severity',
          })}
        />,
      );

      expect(screen.getByText('Critical')).toBeInTheDocument();
    });

    it('renders the "informational" severity (below low, not one of the 4 badge colors) with its own label', () => {
      render(
        <ResultTable
          spec={spec({
            columns: [
              { id: 'agent', label: 'Agent' },
              { id: 'severity', label: 'Severity' },
            ],
            rows: [{ agent: 'a', severity: 'informational' }],
            severityColumn: 'severity',
          })}
        />,
      );

      expect(screen.getByText('Informational')).toBeInTheDocument();
    });

    it('renders "informational" and "low" with distinct, non-hollow background colors matching the platform severity palette', () => {
      // Colors now mirror plugins/main's UI_COLOR_STATUS (see result-table.tsx's SEVERITY_BUCKETS
      // comment): low is UI_COLOR_STATUS.success ('#007871'), informational is
      // UI_COLOR_STATUS.disabled ('#646A77') — both are real background colors (neither renders
      // as EUI's outline-only 'hollow' badge any more), and they must never collide.
      const { unmount } = render(
        <ResultTable
          spec={spec({
            columns: [
              { id: 'agent', label: 'Agent' },
              { id: 'severity', label: 'Severity' },
            ],
            rows: [{ agent: 'a', severity: 'informational' }],
            severityColumn: 'severity',
          })}
        />,
      );
      const informationalBadge = screen.getByText('Informational');
      expect(informationalBadge).toBeInTheDocument();
      const informationalBadgeEl = informationalBadge.closest(
        '.euiBadge',
      ) as HTMLElement;
      expect(informationalBadgeEl.className).not.toMatch(/hollow/i);
      expect(informationalBadgeEl.style.backgroundColor).not.toBe('');
      const informationalColor = informationalBadgeEl.style.backgroundColor;
      unmount();

      render(
        <ResultTable
          spec={spec({
            columns: [
              { id: 'agent', label: 'Agent' },
              { id: 'severity', label: 'Severity' },
            ],
            rows: [{ agent: 'a', severity: 'low' }],
            severityColumn: 'severity',
          })}
        />,
      );
      const lowBadge = screen.getByText('Low');
      expect(lowBadge).toBeInTheDocument();
      const lowBadgeEl = lowBadge.closest('.euiBadge') as HTMLElement;
      expect(lowBadgeEl.className).not.toMatch(/hollow/i);
      expect(lowBadgeEl.style.backgroundColor).not.toBe('');
      expect(lowBadgeEl.style.backgroundColor).not.toBe(informationalColor);
    });

    it('falls back to the raw value for an unrecognized severity word', () => {
      render(
        <ResultTable
          spec={spec({
            columns: [
              { id: 'agent', label: 'Agent' },
              { id: 'severity', label: 'Severity' },
            ],
            rows: [{ agent: 'a', severity: 'weird-value' }],
            severityColumn: 'severity',
          })}
        />,
      );

      expect(screen.getByText('weird-value')).toBeInTheDocument();
    });
  });

  describe('row expansion', () => {
    it('toggles a row open to show its full JSON on expander click, and closed again on a second click', () => {
      render(
        <ResultTable
          spec={spec({
            columns: [{ id: 'agent', label: 'Agent' }],
            rows: [{ agent: 'web-01', extra: 'detail' }],
          })}
        />,
      );

      const expandButton = screen.getByRole('button', { name: 'Expand row' });
      fireEvent.click(expandButton);
      expect(screen.getByText(/"extra": "detail"/)).toBeInTheDocument();

      fireEvent.click(expandButton);
      expect(screen.queryByText(/"extra": "detail"/)).toBeNull();
    });
  });

  describe('"Open in Discover" affordance', () => {
    it('is not rendered when the spec carries no discover info, even with a resolver supplied', () => {
      render(
        <ResultTable
          spec={spec()}
          resolveDiscoverUrl={() =>
            Promise.resolve('https://example.test/discover')
          }
        />,
      );
      expect(
        screen.queryByRole('button', { name: 'Open in Discover' }),
      ).toBeNull();
    });

    it('is not rendered when no resolver is supplied, even with discover info present', () => {
      render(
        <ResultTable
          spec={spec({
            discover: { index: 'wazuh-alerts-*', dsl: { query: {} } },
          })}
        />,
      );
      expect(
        screen.queryByRole('button', { name: 'Open in Discover' }),
      ).toBeNull();
    });

    it('renders once the resolver resolves, when the spec has discover info', async () => {
      render(
        <ResultTable
          spec={spec({
            discover: { index: 'wazuh-alerts-*', dsl: { query: {} } },
          })}
          resolveDiscoverUrl={() =>
            Promise.resolve('https://example.test/discover')
          }
        />,
      );
      expect(
        await screen.findByRole('link', { name: 'Open in Discover' }),
      ).toHaveAttribute('href', 'https://example.test/discover');
    });
  });

  describe('column budget (issue #8921: no table may need a horizontal scrollbar)', () => {
    function eightColumnSpec(): TableSpec {
      return {
        columns: [
          { id: 'c1', label: 'One' },
          { id: 'c2', label: 'Two' },
          { id: 'c3', label: 'Three' },
          { id: 'c4', label: 'Four' },
          { id: 'c5', label: 'Five' },
          { id: 'c6', label: 'Six' },
          { id: 'c7', label: 'Seven' },
          { id: 'c8', label: 'Eight' },
        ],
        rows: [
          {
            c1: 'v1',
            c2: 'v2',
            c3: 'v3',
            c4: 'v4',
            c5: 'v5',
            c6: 'v6',
            c7: 'v7',
            c8: 'v8',
          },
        ],
      };
    }

    it('renders exactly the first 6 spec columns as visible table columns', () => {
      render(<ResultTable spec={eightColumnSpec()} />);
      for (const label of ['One', 'Two', 'Three', 'Four', 'Five', 'Six']) {
        expect(screen.getByText(label)).toBeInTheDocument();
      }
      // Columns 7+ are demoted from visibility, not deleted -- see the next test for where they
      // actually went.
      expect(screen.queryByText('Seven')).toBeNull();
      expect(screen.queryByText('Eight')).toBeNull();
    });

    it('keeps hidden columns 7+ reachable in the row expander JSON (demoted, not deleted)', () => {
      render(<ResultTable spec={eightColumnSpec()} />);
      fireEvent.click(screen.getByRole('button', { name: 'Expand row' }));
      expect(screen.getByText(/"c7": "v7"/)).toBeInTheDocument();
      expect(screen.getByText(/"c8": "v8"/)).toBeInTheDocument();
    });

    it('appends a "+N more fields" note to the accordion summary when columns are hidden', () => {
      render(<ResultTable spec={eightColumnSpec()} />);
      expect(
        screen.getByText(
          'Results (1 rows) (+2 more fields per row — expand a row to see them)',
        ),
      ).toBeInTheDocument();
    });

    it('adds no hidden-columns note when the spec has 6 or fewer columns', () => {
      render(<ResultTable spec={spec()} />);
      expect(screen.getByText('Results (1 rows)')).toBeInTheDocument();
    });
  });

  describe('absent-value placeholder (issue #8921: absent is rendered as absent)', () => {
    it('renders undefined/null/empty-string as a subdued "—" in a default (non-severity, non-timestamp) column', () => {
      render(
        <ResultTable
          spec={spec({
            columns: [
              { id: 'a', label: 'A' },
              { id: 'b', label: 'B' },
              { id: 'c', label: 'C' },
            ],
            rows: [{ a: undefined, b: null, c: '' }],
          })}
        />,
      );
      expect(screen.getAllByText('—')).toHaveLength(3);
    });

    it('renders an absent severity value as "—", not an empty badge', () => {
      render(
        <ResultTable
          spec={spec({
            columns: [
              { id: 'agent', label: 'Agent' },
              { id: 'severity', label: 'Severity' },
            ],
            rows: [{ agent: 'a', severity: undefined }],
            severityColumn: 'severity',
          })}
        />,
      );
      expect(screen.getByText('—')).toBeInTheDocument();
      expect(document.querySelector('.euiBadge')).toBeNull();
    });

    it('renders an absent value in an otherwise-timestamp column as "—"', () => {
      render(
        <ResultTable
          spec={spec({
            columns: [{ id: 'ts', label: 'Time' }],
            rows: [
              { ts: '2026-07-26T05:58:38.000Z' },
              { ts: undefined },
            ],
          })}
        />,
      );
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('does NOT render 0 or false as the absent placeholder', () => {
      render(
        <ResultTable
          spec={spec({
            columns: [
              { id: 'count', label: 'Count' },
              { id: 'flag', label: 'Flag' },
            ],
            rows: [{ count: 0, flag: false }],
          })}
        />,
      );
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.queryByText('—')).toBeNull();
    });
  });

  describe('render-error boundary', () => {
    it('degrades to an inline warning instead of crashing when a row cannot be serialized (e.g. a circular reference) once expanded', () => {
      const circular: Record<string, unknown> = { agent: 'web-01' };
      circular.self = circular;
      // Silence the expected React error-boundary console.error noise for this one case.
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(
        <ResultTable
          spec={spec({
            columns: [{ id: 'agent', label: 'Agent' }],
            rows: [circular],
          })}
        />,
      );

      const expandButton = screen.getByRole('button', { name: 'Expand row' });
      fireEvent.click(expandButton);

      expect(
        screen.getByText('This result table could not be displayed.'),
      ).toBeInTheDocument();

      consoleError.mockRestore();
    });
  });
});
