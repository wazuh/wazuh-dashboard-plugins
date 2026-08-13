import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResultTable, ResultTableProvenanceChip } from './result-table';
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
  it('shows a collapsed accordion for a pathological row count, mounting no table rows until opened', () => {
    // Above AUTO_EXPAND_ROW_THRESHOLD. The ceiling moved from 10 to 200 once the card gained its
    // own height cap and internal scroll: length no longer costs the reader anything, and the
    // design's canonical Screen 2 is a 26-row table shown open.
    const manyRows = Array.from({ length: 201 }, (_unused, i) => ({
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

    expect(screen.getByText('Results (201 rows)')).toBeInTheDocument();
    // Lazy-mount: nothing beneath the (collapsed) accordion header yet.
    expect(container.querySelector('table')).toBeNull();
  });

  it('auto-expands (and mounts the table) at or below the threshold', () => {
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

  it('mounts the table once a previously-collapsed accordion is opened', () => {
    // 201 rows: above the threshold, so this mounts collapsed and the click below is what proves
    // the body is lazily mounted rather than merely hidden.
    const manyRows = Array.from({ length: 201 }, (_unused, i) => ({
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
    fireEvent.click(screen.getByText('Results (201 rows)'));
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

  // Layout contract §4: the card is a 3-row structure (header / scrolling body / pinned
  // pagination footer). The SCROLL lives on `.wzResultsCardBody` alone (via result-table.scss's
  // `wzScrollChild` mixin) and the header/footer are its SIBLINGS, not its descendants — so
  // neither can ever be scrolled out of view underneath the body. (The card's own height ceiling
  // is a different thing and does arrive inline, measured — see the describe block below.)
  it('keeps the header and pagination footer as siblings of the scrolling body, not nested inside it', () => {
    const thirtyRows = Array.from({ length: 30 }, (_unused, i) => ({
      agent: `agent-${i}`,
    }));
    const { container } = render(
      <ResultTable
        spec={spec({
          columns: [{ id: 'agent', label: 'Agent' }],
          rows: thirtyRows,
        })}
      />,
    );
    fireEvent.click(screen.getByText('Results (30 rows)'));

    const body = container.querySelector('.wzResultsCardBody');
    const header = container.querySelector('.wzResultsCardHeader');
    const footer = container.querySelector('.wzResultsCardFooter');
    expect(body).not.toBeNull();
    expect(header).not.toBeNull();
    expect(footer).not.toBeNull();
    expect(body?.contains(header as Node)).toBe(false);
    expect(body?.contains(footer as Node)).toBe(false);
  });

  // The card's height ceiling has to come from the TRANSCRIPT, not from the viewport. The
  // stylesheet's `min(460px, 52dvh)` reads `dvh` against the window, which ignores the app frame's
  // offset, the tab bar, and above all the composer row's own 30dvh of the same window: at the
  // spec's 1280x620 acceptance size that leaves a ~345px transcript while the card alone still
  // claims 322px, so the pinned footer lands below the transcript's fold — the very bug this card
  // exists to kill, one level down from where it was fixed.
  describe('height ceiling comes from the measured transcript, not the viewport', () => {
    it('caps the card well inside a mid-height transcript, leaving room for the prose above it', () => {
      const { container } = render(
        <ResultTable spec={spec()} transcriptHeightPx={500} />,
      );
      const card = container.querySelector('.wzResultsCard') as HTMLElement;
      // 500 - 140 reserved for the avatar row, the answer prose and the turn's spacing.
      expect(card.style.maxHeight).toBe('360px');
    });

    it('stops shrinking at a card that can still show header, rows and footer', () => {
      // 1280x620, the spec's tightest acceptance size: a ~345px transcript. The subtraction alone
      // would give 205px, but below the floor a shorter cap helps nobody — the transcript's own
      // full-pane scroll is the better answer than a card too short to use.
      const { container } = render(
        <ResultTable spec={spec()} transcriptHeightPx={345} />,
      );
      const card = container.querySelector('.wzResultsCard') as HTMLElement;
      expect(card.style.maxHeight).toBe('240px');
    });

    it('never exceeds the design ceiling however tall the transcript gets', () => {
      const { container } = render(
        <ResultTable spec={spec()} transcriptHeightPx={2000} />,
      );
      const card = container.querySelector('.wzResultsCard') as HTMLElement;
      expect(card.style.maxHeight).toBe('460px');
    });

    it('leaves the cap to the stylesheet when nothing has been measured', () => {
      // jsdom has no ResizeObserver, so `transcriptHeightPx` stays 0 in the app's own tests too —
      // an inline `0px` there would collapse the card to nothing.
      const { container } = render(<ResultTable spec={spec()} />);
      const card = container.querySelector('.wzResultsCard') as HTMLElement;
      expect(card.style.maxHeight).toBe('');
    });
  });

  // The BREAKING bug this whole card rewrite exists for: "page 2 of 6 unreachable without
  // resizing the window". Pinning the pagination footer as its own grid row (rather than letting
  // it flow after an unbounded table body) means it is always present and clickable regardless of
  // how tall the body's own content is.
  describe('pagination stays inside the card and reachable', () => {
    function thirtyRowSpec(): TableSpec {
      return spec({
        columns: [{ id: 'agent', label: 'Agent' }],
        rows: Array.from({ length: 30 }, (_unused, i) => ({
          agent: `agent-${i}`,
        })),
      });
    }

    it('shows a working "next page" control that reveals the next slice of rows', () => {
      render(<ResultTable spec={thirtyRowSpec()} />);

      expect(screen.getByText('Page 1 of 6')).toBeInTheDocument();
      expect(screen.getByText('agent-0')).toBeInTheDocument();
      expect(screen.queryByText('agent-5')).toBeNull();

      fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

      expect(screen.getByText('Page 2 of 6')).toBeInTheDocument();
      expect(screen.getByText('agent-5')).toBeInTheDocument();
      expect(screen.queryByText('agent-0')).toBeNull();
    });

    it('disables "previous page" on the first page and "next page" on the last page', () => {
      render(<ResultTable spec={thirtyRowSpec()} />);

      expect(
        screen.getByRole('button', { name: 'Previous page' }),
      ).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Next page' }),
      ).not.toBeDisabled();

      for (let clickCount = 0; clickCount < 5; clickCount += 1) {
        fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
      }

      expect(screen.getByText('Page 6 of 6')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    });

    it('changing rows-per-page resets back to page 1', () => {
      render(<ResultTable spec={thirtyRowSpec()} />);

      fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
      expect(screen.getByText('Page 2 of 6')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: '10' }));
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      expect(screen.getByText('agent-9')).toBeInTheDocument();
      expect(screen.queryByText('agent-10')).toBeNull();
    });

    it('renders no pagination footer for an empty result set', () => {
      const { container } = render(<ResultTable spec={spec({ rows: [] })} />);
      expect(container.querySelector('.wzResultsCardFooter')).toBeNull();
    });
  });

  describe('provenance chips (layout contract §4: "provenance moves UP here")', () => {
    function chip(
      overrides: Partial<ResultTableProvenanceChip> = {},
    ): ResultTableProvenanceChip {
      return {
        id: 't1',
        shortLabel: 'Critical findings · 90d',
        fullLabel:
          'get_critical_findings · wazuh-findings-v5-* · now-90d → now',
        toolName: 'get_critical_findings',
        argumentsJson: { index_pattern: 'wazuh-findings-v5-*' },
        ...overrides,
      };
    }

    it('renders a header chip for each supplied provenance entry', () => {
      render(<ResultTable spec={spec()} provenanceChips={[chip()]} />);
      expect(screen.getByText('Critical findings · 90d')).toBeInTheDocument();
    });

    it('opens a popover with the tool name and raw JSON arguments on click, closing on a second click', async () => {
      render(<ResultTable spec={spec()} provenanceChips={[chip()]} />);

      expect(
        screen.queryByText(/"index_pattern": "wazuh-findings-v5-\*"/),
      ).toBeNull();

      fireEvent.click(screen.getByText('Critical findings · 90d'));
      expect(
        screen.getByText(/"index_pattern": "wazuh-findings-v5-\*"/),
      ).toBeInTheDocument();
      // EUI stamps the open-state modifier once it has positioned the panel, which happens a tick
      // after the click rather than synchronously with it — hence waitFor rather than a bare read.
      await waitFor(() =>
        expect(
          document.querySelector('.euiPopover__panel-isOpen'),
        ).not.toBeNull(),
      );

      fireEvent.click(screen.getByText('Critical findings · 90d'));
      // EUI keeps a closed popover's panel MOUNTED (it fades out via CSS and is only hidden from
      // assistive tech), so the JSON node is still findable in jsdom after the second click. The
      // state that actually flips is the panel's `-isOpen` modifier, which is what this asserts —
      // querying for the text instead would pass while open and fail while closed for the wrong
      // reason. Verified against the bundled EUI build, whose stylesheet defines the class.
      await waitFor(() =>
        expect(document.querySelector('.euiPopover__panel-isOpen')).toBeNull(),
      );
    });

    it('says a parameterless call had no parameters, instead of showing a bare {}', async () => {
      // A tool called with no arguments is a real and common case: `get_agents` with no filter
      // means "every agent", and the model issues exactly that. Rendering it as `{}` looked like
      // the query had failed to be captured rather than like the query itself, and was reported
      // as a bug the first time it was seen in the UI.
      render(
        <ResultTable
          spec={spec()}
          provenanceChips={[
            chip({
              shortLabel: 'Agents · 90d',
              toolName: 'get_agents',
              argumentsJson: {},
            }),
          ]}
        />,
      );

      fireEvent.click(screen.getByText('Agents · 90d'));

      await waitFor(() =>
        expect(
          document.querySelector('.euiPopover__panel-isOpen'),
        ).not.toBeNull(),
      );
      expect(screen.getByText('get_agents')).toBeInTheDocument();
      expect(screen.getByText(/called with no parameters/i)).toBeInTheDocument();
      expect(document.querySelector('.euiCodeBlock')).toBeNull();
    });

    it('renders no chip at all when provenanceChips is omitted', () => {
      const { container } = render(<ResultTable spec={spec()} />);
      expect(container.querySelector('.euiBadge[title]')).toBeNull();
    });
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
      // Assert on the HEADER cells, not on text anywhere in the table: EUI renders every column
      // label twice -- once in the desktop `<th>` and once per row as a mobile header
      // (`euiTableRowCell__mobileHeader`) -- so `getByText(label)` throws "found multiple
      // elements". Header cells are also the honest expression of this invariant, which is about
      // how many columns the table SHOWS.
      const headerTexts = screen
        .getAllByRole('columnheader')
        .map(header => header.textContent ?? '');
      for (const label of ['One', 'Two', 'Three', 'Four', 'Five', 'Six']) {
        expect(headerTexts).toContain(label);
      }
      // Columns 7+ are demoted from visibility, not deleted -- see the next test for where they
      // actually went.
      expect(headerTexts).not.toContain('Seven');
      expect(headerTexts).not.toContain('Eight');
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
          'Results (1 rows) (+2 more fields per row. Expand a row to see them.)',
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
            rows: [{ ts: '2026-07-26T05:58:38.000Z' }, { ts: undefined }],
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
      // `false` must render a VISIBLE "No" — asserting only the absence of the placeholder would
      // pass on a blank cell too (React renders a boolean child as nothing), which is exactly the
      // regression replacing EUI's default formatter could introduce.
      expect(screen.getByText('No')).toBeInTheDocument();
      expect(screen.queryByText('—')).toBeNull();
    });

    it('renders booleans as Yes/No, never as blank cells', () => {
      render(
        <ResultTable
          spec={spec({
            columns: [{ id: 'document.enabled', label: 'Enabled' }],
            rows: [{ 'document.enabled': true }, { 'document.enabled': false }],
          })}
        />,
      );
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('renders array values comma-joined, never concatenated', () => {
      render(
        <ResultTable
          spec={spec({
            columns: [{ id: 'document.tags', label: 'Tags' }],
            rows: [{ 'document.tags': ['informational', 'wazuh-generic'] }],
          })}
        />,
      );
      expect(
        screen.getByText('informational, wazuh-generic'),
      ).toBeInTheDocument();
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
