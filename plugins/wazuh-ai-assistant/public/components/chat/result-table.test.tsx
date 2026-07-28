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

  it('paginates: only the first DEFAULT_PAGE_SIZE (25) rows are in the DOM at once', () => {
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
    expect(screen.getByText('agent-24')).toBeInTheDocument();
    expect(screen.queryByText('agent-25')).toBeNull();
    expect(screen.queryByText('agent-29')).toBeNull();
  });

  describe('severity badge rendering', () => {
    it('maps a numeric rule.level to the legacy word thresholds (0-6 low, 7-11 medium, 12-14 high, 15+ critical)', () => {
      const rows = [
        { agent: 'a', level: 3 },
        { agent: 'b', level: 9 },
        { agent: 'c', level: 13 },
        { agent: 'd', level: 15 },
      ];
      render(
        <ResultTable
          spec={spec({
            columns: [
              { id: 'agent', label: 'Agent' },
              { id: 'level', label: 'Severity' },
            ],
            rows,
            severityColumn: 'level',
          })}
        />,
      );

      expect(screen.getByText('Low')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Critical')).toBeInTheDocument();
    });

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

    it('renders "informational" as its own visually distinct bucket, never the same badge color as "low"', () => {
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
      // "low" renders with EUI's 'hollow' color, which is the only color with no background-color
      // style (an outline-only badge via the ouiBadge--hollow class). Asserting that
      // "informational" does NOT get that same hollow treatment — and instead gets an actual
      // background color — is what proves the two severities are visually distinct, not just
      // textually distinct (the previous version of this test only checked the label).
      const informationalBadgeEl = informationalBadge.closest(
        '.euiBadge',
      ) as HTMLElement;
      expect(informationalBadgeEl.className).not.toMatch(/hollow/i);
      expect(informationalBadgeEl.style.backgroundColor).not.toBe('');
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
      expect(lowBadgeEl.className).toMatch(/hollow/i);
      expect(lowBadgeEl.style.backgroundColor).toBe('');
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
