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

  it('paginates: only the first DEFAULT_PAGE_SIZE (10) rows are in the DOM at once', () => {
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
    // 30 rows is well under the auto-expand threshold (200), so the accordion is open immediately
    // — no click needed to see the rows below.
    expect(screen.getByText('Results (30 rows)')).toBeInTheDocument();

    expect(screen.getByText('agent-0')).toBeInTheDocument();
    expect(screen.getByText('agent-9')).toBeInTheDocument();
    expect(screen.queryByText('agent-10')).toBeNull();
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

    it('does not enter the expanded state on its own for a tall transcript, only on a user page-size pick', () => {
      // Merely measuring a tall transcript must never, on its own, satisfy
      // `pageSize > DEFAULT_PAGE_SIZE` and silently switch the card to the 900px "expanded"
      // ceiling — only a reader EXPLICITLY picking a larger page size counts as opting in.
      const thirtyRows = Array.from({ length: 30 }, (_unused, i) => ({
        agent: `agent-${i}`,
      }));
      const { container } = render(
        <ResultTable
          spec={spec({
            columns: [{ id: 'agent', label: 'Agent' }],
            rows: thirtyRows,
          })}
          transcriptHeightPx={2000}
        />,
      );
      const card = container.querySelector('.wzResultsCard') as HTMLElement;
      expect(card.classList.contains('wzResultsCard--expanded')).toBe(false);
      expect(card.style.maxHeight).toBe('460px');

      // Picking 25 explicitly IS a user action, and only then does the card expand.
      fireEvent.click(screen.getByRole('button', { name: '25' }));
      expect(card.classList.contains('wzResultsCard--expanded')).toBe(true);
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

      // 30 rows at the default page size (10) is 3 pages.
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      expect(screen.getByText('agent-0')).toBeInTheDocument();
      expect(screen.queryByText('agent-10')).toBeNull();

      fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
      expect(screen.getByText('agent-10')).toBeInTheDocument();
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

      // 30 rows / 10 per page (default) = 3 pages, so 2 clicks reach the last one.
      for (let clickCount = 0; clickCount < 2; clickCount += 1) {
        fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
      }

      expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    });

    it('changing rows-per-page resets back to page 1', () => {
      render(<ResultTable spec={thirtyRowSpec()} />);

      fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: '5' }));
      expect(screen.getByText('Page 1 of 6')).toBeInTheDocument();
      expect(screen.getByText('agent-4')).toBeInTheDocument();
      expect(screen.queryByText('agent-5')).toBeNull();
    });

    // "Card grows" (iteration-4 item 3, F2): picking a page size ABOVE the 10-row default is what
    // used to be imperceptible — the card stayed height-capped, so 50 rows just added an internal
    // scrollbar. The approved fix lets the card itself grow past its default cap once the reader
    // has deliberately asked for more rows than the default shows.
    it('grows past the default cap once a larger page size is chosen, shrinks back at the default', () => {
      const { container } = render(<ResultTable spec={thirtyRowSpec()} />);
      const card = () =>
        container.querySelector('.wzResultsCard') as HTMLElement;

      expect(card().classList.contains('wzResultsCard--expanded')).toBe(false);

      fireEvent.click(screen.getByRole('button', { name: '25' }));
      expect(card().classList.contains('wzResultsCard--expanded')).toBe(true);

      fireEvent.click(screen.getByRole('button', { name: '10' }));
      expect(card().classList.contains('wzResultsCard--expanded')).toBe(false);
    });

    it('scrolls the card body back to the top on any page-size change', () => {
      const { container } = render(<ResultTable spec={thirtyRowSpec()} />);
      const body = container.querySelector('.wzResultsCardBody') as HTMLElement;
      body.scrollTop = 120;
      expect(body.scrollTop).toBe(120);

      fireEvent.click(screen.getByRole('button', { name: '5' }));

      expect(body.scrollTop).toBe(0);
    });

    // Re-pin hook (iteration-4 item 3, part A): the card grows downward when a larger page size is
    // picked, and it lives inside chat-page.tsx's scrolling transcript pane. That pane only re-pins
    // to its bottom on a `messages` change, so without this notification the freshly-grown
    // pagination footer slid behind the composer until the reader scrolled by hand. The callback
    // fires for a page-SIZE pick only — a plain next/previous-page click never grows the card, so it
    // must not trigger a re-pin.
    it('notifies the host on a rows-per-page change so the transcript can re-pin, but not on paging', () => {
      const onRowsPerPageChange = jest.fn();
      render(
        <ResultTable
          spec={thirtyRowSpec()}
          onRowsPerPageChange={onRowsPerPageChange}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
      expect(onRowsPerPageChange).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: '25' }));
      expect(onRowsPerPageChange).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: '5' }));
      expect(onRowsPerPageChange).toHaveBeenCalledTimes(2);
    });

    it('also scrolls the card body back to the top on a plain next/previous page click', () => {
      // The reset used to live only in the page-SIZE change handler, so a reader who scrolled
      // deep into page 1's rows and then clicked "Next page" (no size change at all) landed on
      // page 2 still scrolled to wherever page 1 left off.
      const { container } = render(<ResultTable spec={thirtyRowSpec()} />);
      const body = container.querySelector('.wzResultsCardBody') as HTMLElement;
      body.scrollTop = 120;
      expect(body.scrollTop).toBe(120);

      fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

      expect(body.scrollTop).toBe(0);
    });

    it('renders no pagination footer when every offered page size already fits the result', () => {
      // A one-row table used to get the full "Rows per page: 5 10 25 50" control plus
      // "Page 1 of 1" — four controls that cannot change anything on screen, since the CURRENT
      // page size (the 10-row default) already holds the whole result. Reported from the UI as
      // looking broken.
      const { container } = render(
        <ResultTable
          spec={spec({
            columns: [{ id: 'agent', label: 'Agent' }],
            rows: [{ agent: 'web-01' }],
          })}
        />,
      );
      expect(container.querySelector('.wzResultsCardFooter')).toBeNull();
      expect(screen.queryByText(/rows per page/i)).toBeNull();
      expect(screen.queryByText(/page 1 of 1/i)).toBeNull();
      // The table itself is unaffected — this hides a control that had nothing to control.
      expect(screen.getByText('web-01')).toBeInTheDocument();
    });

    // Issue #9009 (A4): the QA E2E review caught a factually wrong AI prose summary that resulted
    // from exactly this — a 6-10 row answer used to split onto a hidden page 2 under the old
    // 5-row default. With the default now 10, a 6-row result fits entirely on one page and the
    // pager (and every row) must be visible with NO pagination footer at all.
    it('shows every row with no pagination footer for a 6-row result (the A4 regression case)', () => {
      const sixRows = Array.from({ length: 6 }, (_unused, i) => ({
        agent: `agent-${i}`,
      }));
      const { container } = render(
        <ResultTable
          spec={spec({
            columns: [{ id: 'agent', label: 'Agent' }],
            rows: sixRows,
          })}
        />,
      );
      expect(container.querySelector('.wzResultsCardFooter')).toBeNull();
      for (let i = 0; i < 6; i += 1) {
        expect(screen.getByText(`agent-${i}`)).toBeInTheDocument();
      }
    });

    it('renders the footer as soon as the result exceeds the default page size', () => {
      // Eleven rows: one more than the 10-row default, so the result genuinely needs a second
      // page and the pager (with the page-size selector) must reappear.
      const elevenRows = Array.from({ length: 11 }, (_unused, i) => ({
        agent: `agent-${i}`,
      }));
      render(
        <ResultTable
          spec={spec({
            columns: [{ id: 'agent', label: 'Agent' }],
            rows: elevenRows,
          })}
        />,
      );
      expect(screen.getByText(/rows per page/i)).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });

    // Review, MAJOR-1: the naive `spec.rows.length > pageSize` check alone falls into a
    // trapdoor — a reader who explicitly picks a page size >= the row count would unmount the
    // WHOLE footer, including the size selector itself, with no way back short of a remount.
    it('keeps the footer (and its size selector) reachable after picking a page size >= the row count', () => {
      const twentyFiveRows = Array.from({ length: 25 }, (_unused, i) => ({
        agent: `agent-${i}`,
      }));
      const { container } = render(
        <ResultTable
          spec={spec({
            columns: [{ id: 'agent', label: 'Agent' }],
            rows: twentyFiveRows,
          })}
        />,
      );
      expect(container.querySelector('.wzResultsCardFooter')).not.toBeNull();

      // 25 rows at page size 25 is exactly one page — the trapdoor the naive check falls into.
      fireEvent.click(screen.getByRole('button', { name: '25' }));
      expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
      // The footer — and the size selector inside it — must still be there: this is the only way
      // back to a smaller size.
      expect(container.querySelector('.wzResultsCardFooter')).not.toBeNull();
      expect(screen.getByText(/rows per page/i)).toBeInTheDocument();

      // Picking a smaller size again restores real paging, proving the selector still works.
      fireEvent.click(screen.getByRole('button', { name: '10' }));
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      expect(container.querySelector('.wzResultsCardFooter')).not.toBeNull();
    });

    it('renders no pagination footer for an empty result set', () => {
      // Kept, with its premise narrowed: as of C4 (CEO item 6) the CHAT SURFACE never hands this
      // component a 0-row spec — message-bubble.tsx suppresses the whole card for one and shows a
      // quiet line instead (covered in message-bubble.test.tsx). This component is still the generic
      // spec renderer, though, so what it does when a call site hands it one directly stays pinned:
      // no footer, and — deliberately — no crash and no pagination arithmetic over zero rows
      // (`pageCount` floors at 1). Nothing here asserts that an empty CARD is a desirable end state.
      const { container } = render(<ResultTable spec={spec({ rows: [] })} />);
      expect(container.querySelector('.wzResultsCardFooter')).toBeNull();
      // The generic renderer still mounts its card — the suppression decision is the caller's,
      // one level up, where the turn's prose is known.
      expect(container.querySelector('.wzResultsCard')).not.toBeNull();
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
      expect(
        screen.getByText(/called with no parameters/i),
      ).toBeInTheDocument();
      expect(document.querySelector('.euiCodeBlock')).toBeNull();
    });

    it('renders no chip at all when provenanceChips is omitted', () => {
      const { container } = render(<ResultTable spec={spec()} />);
      expect(container.querySelector('.euiBadge[title]')).toBeNull();
    });

    // Issue #9008 (G2): the index and resolved time range were previously reachable only through
    // the chip's hover `title` — never inside the popover a touch/keyboard reader can actually
    // open. These assert the labelled lines render as real popover content.
    it('shows the index and resolved time range as labelled lines inside the popover', () => {
      render(
        <ResultTable
          spec={spec()}
          provenanceChips={[
            chip({
              index: 'wazuh-findings-v5-*',
              resolvedRangeLabel: 'Jul 26, 2026 – Oct 24, 2026',
              windowBadgeLabel: '90d',
            }),
          ]}
        />,
      );

      fireEvent.click(screen.getByText('Critical findings · 90d'));

      expect(
        screen.getByText('Index: wazuh-findings-v5-*'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Time range: Jul 26, 2026 – Oct 24, 2026'),
      ).toBeInTheDocument();
      expect(screen.getByText('90d')).toBeInTheDocument();
    });

    it('shows nothing extra when the chip carries no provenance detail (Manager API call)', () => {
      render(<ResultTable spec={spec()} provenanceChips={[chip()]} />);

      fireEvent.click(screen.getByText('Critical findings · 90d'));

      expect(screen.queryByText(/^Index:/)).toBeNull();
      expect(screen.queryByText(/^Time range:/)).toBeNull();
    });

    // Issue #9008 (G3): ONE badge stating both windows, replacing two separate near-identical
    // chips with no requested-vs-effective concept between them.
    it('shows one combined badge for a clamped lookback, not two separate labels', () => {
      render(
        <ResultTable
          spec={spec()}
          provenanceChips={[chip({ windowBadgeLabel: '90d · requested 720d' })]}
        />,
      );

      fireEvent.click(screen.getByText('Critical findings · 90d'));

      expect(screen.getByText('90d · requested 720d')).toBeInTheDocument();
    });

    // Issue #9008 (G1): the panel's own "hit escape to close" screen-reader announcement did not
    // hold in the live QA run — Escape left the panel open, dismissible only by re-clicking the
    // badge. This is a belt-and-braces handler on top of EUI's own popover keyboard handling.
    it('closes the popover on Escape', async () => {
      render(<ResultTable spec={spec()} provenanceChips={[chip()]} />);

      fireEvent.click(screen.getByText('Critical findings · 90d'));
      await waitFor(() =>
        expect(
          document.querySelector('.euiPopover__panel-isOpen'),
        ).not.toBeNull(),
      );

      fireEvent.keyDown(screen.getByText('get_critical_findings'), {
        key: 'Escape',
      });

      await waitFor(() =>
        expect(document.querySelector('.euiPopover__panel-isOpen')).toBeNull(),
      );
    });

    // Issue #9008 review, major 6: the QA-reported failure was Escape doing nothing while focus
    // was STILL on the badge (EUI only moves focus into the panel asynchronously) — this fires
    // the key on the badge itself, not on panel content, to cover exactly that window.
    it('closes the popover on Escape fired on the badge anchor itself', async () => {
      render(<ResultTable spec={spec()} provenanceChips={[chip()]} />);

      const badge = screen.getByText('Critical findings · 90d');
      fireEvent.click(badge);
      await waitFor(() =>
        expect(
          document.querySelector('.euiPopover__panel-isOpen'),
        ).not.toBeNull(),
      );

      fireEvent.keyDown(badge, { key: 'Escape' });

      await waitFor(() =>
        expect(document.querySelector('.euiPopover__panel-isOpen')).toBeNull(),
      );
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

    it('shapes every severity like the other status chips, keeping the platform fill', () => {
      // §3.5: the badge was EUI's default 2px-radius rectangle while every other state-carrying chip
      // in this plugin (the provider status chips) is a round 11px pill — two idioms for one job.
      // `.wzSeverityChip` (result-table.scss) adopts the SHAPE only; the fill stays the platform's
      // own UI_COLOR_STATUS hex, which is a cross-product agreement and, unlike an EUI role color,
      // has no darkened text twin to stay legible over a 12% wash.
      render(
        <ResultTable
          spec={spec({
            columns: [
              { id: 'agent', label: 'Agent' },
              { id: 'severity', label: 'Severity' },
            ],
            rows: [{ agent: 'a', severity: 'critical' }],
            severityColumn: 'severity',
          })}
        />,
      );

      const badge = screen.getByText('Critical').closest('.euiBadge');
      expect(badge).toHaveClass('wzSeverityChip');
      // Still a real fill, not a hollow outline — the guard the palette decision already carries.
      expect((badge as HTMLElement).style.backgroundColor).not.toBe('');
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

    // Issue #9009 (A3): the toggle used to keep the aria-label 'Expand row' after opening and
    // exposed no `aria-expanded` at all, so a screen-reader/keyboard user got no feedback that a
    // row had been opened. Both the attribute and the accessible name must flip with the state.
    it('flips aria-expanded and the accessible name when a row is expanded and collapsed', () => {
      render(
        <ResultTable
          spec={spec({
            columns: [{ id: 'agent', label: 'Agent' }],
            rows: [{ agent: 'web-01', extra: 'detail' }],
          })}
        />,
      );

      const expandButton = screen.getByRole('button', { name: 'Expand row' });
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(expandButton);
      expect(
        screen.getByRole('button', { name: 'Collapse row' }),
      ).toHaveAttribute('aria-expanded', 'true');

      fireEvent.click(screen.getByRole('button', { name: 'Collapse row' }));
      expect(
        screen.getByRole('button', { name: 'Expand row' }),
      ).toHaveAttribute('aria-expanded', 'false');
    });
  });

  // Issue #9009 (A1/A2): the table's accessible caption used to be EuiBasicTable's own default —
  // built from the CURRENT PAGE's items, since this component paginates by hand rather than
  // through EuiBasicTable's own `pagination` prop — so a screen-reader user was told "This table
  // contains 5 rows" on a 6-row result while the visible header read "Results (6 rows)". An
  // explicit `tableCaption` always states the total, with proper ICU pluralization, and adds the
  // page position only when the result actually spans more than one page.
  describe('accessible caption states the total, not the page slice (A1/A2)', () => {
    // EuiBasicTable renders its `tableCaption` inside an `EuiDelayRender` (to avoid a flash for a
    // caption that never becomes visible on screen), so the `<caption>` element is present but
    // EMPTY on the very first render and only gets its text a tick later — hence `findByText`
    // (async) rather than a synchronous `getByText` for every assertion in this block.
    it('uses a correctly-pluralized singular caption for one row, matching the visible header', async () => {
      render(
        <ResultTable
          spec={spec({
            columns: [{ id: 'agent', label: 'Agent' }],
            rows: [{ agent: 'web-01' }],
          })}
        />,
      );
      expect(screen.getByText('Results (1 row)')).toBeInTheDocument();
      expect(
        await screen.findByText('This table contains 1 row.'),
      ).toBeInTheDocument();
    });

    it('states the TOTAL (not the page slice) when the result fits on one page', async () => {
      const sixRows = Array.from({ length: 6 }, (_unused, i) => ({
        agent: `agent-${i}`,
      }));
      render(
        <ResultTable
          spec={spec({
            columns: [{ id: 'agent', label: 'Agent' }],
            rows: sixRows,
          })}
        />,
      );
      expect(screen.getByText('Results (6 rows)')).toBeInTheDocument();
      expect(
        await screen.findByText('This table contains 6 rows.'),
      ).toBeInTheDocument();
    });

    it('adds the total plus the current page position once the result actually paginates', async () => {
      const elevenRows = Array.from({ length: 11 }, (_unused, i) => ({
        agent: `agent-${i}`,
      }));
      render(
        <ResultTable
          spec={spec({
            columns: [{ id: 'agent', label: 'Agent' }],
            rows: elevenRows,
          })}
        />,
      );
      expect(
        await screen.findByText(
          'This table contains 11 rows. Showing rows 1-10, page 1 of 2.',
        ),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

      expect(
        await screen.findByText(
          'This table contains 11 rows. Showing rows 11-11, page 2 of 2.',
        ),
      ).toBeInTheDocument();
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
      // Issue #9008 (I5): `dsl: { query: {} }` carries no explicit time-range clause, so this is
      // the range-less fallback case — the label discloses the substituted last-24h window
      // rather than reading identically to a link that opened the answer's own resolved window
      // (see the next test for that case).
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
        await screen.findByRole('link', {
          name: 'Open in Discover (default range: 24h)',
        }),
      ).toHaveAttribute('href', 'https://example.test/discover');
    });

    it('keeps the plain label when the query carries its own explicit time range', async () => {
      render(
        <ResultTable
          spec={spec({
            discover: {
              index: 'wazuh-alerts-*',
              dsl: { range: { '@timestamp': { gte: 'now-90d', lte: 'now' } } },
            },
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
          'Results (1 row) (+2 more fields per row. Expand a row to see them.)',
        ),
      ).toBeInTheDocument();
    });

    it('adds no hidden-columns note when the spec has 6 or fewer columns', () => {
      render(<ResultTable spec={spec()} />);
      expect(screen.getByText('Results (1 row)')).toBeInTheDocument();
    });
  });

  describe('column widths (css-audit-full.md §3.4: the free-text column gets the room)', () => {
    /**
     * EuiBasicTable lays the table out with `table-layout: fixed`, so a column with no width shares
     * the remainder evenly with its peers — which the live audit measured as three identical 324px
     * slabs holding an agent name and a category each, beside a finding title wrapping onto three
     * lines. Columns whose every value is SHORT now declare a matching short width, leaving the
     * remainder to the one column that actually needs it. Data-driven, because this renderer is
     * generic: only the values can say how wide a column should be.
     *
     * jsdom computes no layout, so what is asserted is the declared `width` attribute EUI puts on
     * the `<col>`/`<th>` — i.e. that the renderer classified each column correctly.
     */
    const headerWidths = () =>
      screen
        .getAllByRole('columnheader')
        .map(header => (header as HTMLElement).style.width);

    it('gives short-value columns a fixed width and leaves the long one unset', () => {
      render(
        <ResultTable
          spec={spec({
            columns: [
              { id: 'agent', label: 'Agent' },
              { id: 'title', label: 'Title' },
            ],
            rows: [
              {
                agent: 'web-01',
                title:
                  'Multiple authentication failures followed by a successful login',
              },
            ],
          })}
        />,
      );

      const [agentWidth, titleWidth] = headerWidths();
      expect(agentWidth).toBe('140px');
      // Unset, so the fixed layout hands it everything the sized columns did not take.
      expect(titleWidth).toBe('');
    });

    it('treats a column as long as soon as ONE of its values is long', () => {
      // Same "the whole column or nothing" rule the timestamp detection uses: a column that is
      // mostly short but sometimes long must not be capped at a width its longest value overflows.
      render(
        <ResultTable
          spec={spec({
            columns: [{ id: 'note', label: 'Note' }],
            rows: [
              { note: 'short' },
              { note: 'a value comfortably past the twenty-character budget' },
            ],
          })}
        />,
      );

      expect(headerWidths()[0]).toBe('');
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

  /**
   * Issue #9009 (J1): at ~480px (the AI Assistant sidecar's reproduction width from the QA E2E
   * review) an untruncated cell wraps onto several lines and the table becomes unreadable. The
   * fix detects the CARD'S OWN measured width (not the viewport, since the same generic renderer
   * mounts both full-page and inside the narrow sidecar) and, below `NARROW_CONTAINER_WIDTH_PX`,
   * shows only the first `NARROW_MAX_VISIBLE_COLUMNS` columns with truncate-plus-tooltip cells and
   * no horizontal scroll. Same stub pattern chat-page.test.tsx already uses for its own
   * ResizeObserver-driven rail-width responsiveness: jsdom has no real ResizeObserver, so the
   * width has to be injected by hand.
   */
  describe('narrow container mode (J1)', () => {
    function stubContainerWidth(width: number) {
      class ResizeObserverStub {
        callback: () => void;
        constructor(callback: () => void) {
          this.callback = callback;
        }
        observe() {
          this.callback();
        }
        disconnect() {}
      }
      const original = (window as unknown as { ResizeObserver?: unknown })
        .ResizeObserver;
      (window as unknown as { ResizeObserver: unknown }).ResizeObserver =
        ResizeObserverStub;
      const widthSpy = jest
        .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
        .mockReturnValue(width);
      return () => {
        widthSpy.mockRestore();
        (window as unknown as { ResizeObserver: unknown }).ResizeObserver =
          original;
      };
    }

    function wideColumnSpec(): TableSpec {
      return {
        columns: [
          { id: 'agent', label: 'Agent' },
          { id: 'rule', label: 'Rule' },
          { id: 'category', label: 'Category' },
          { id: 'timestamp', label: 'Timestamp' },
        ],
        rows: [
          {
            agent: 'web-01',
            rule: 'Multiple authentication failures followed by a successful login',
            category: 'authentication',
            timestamp: '2026-07-26T05:58:38.000Z',
          },
        ],
      };
    }

    it('renders the full column set at ordinary widths (no ResizeObserver / not narrow)', () => {
      render(<ResultTable spec={wideColumnSpec()} />);
      const headerTexts = screen
        .getAllByRole('columnheader')
        .map(header => header.textContent ?? '');
      expect(headerTexts).toContain('Agent');
      expect(headerTexts).toContain('Rule');
      expect(headerTexts).toContain('Category');
      expect(headerTexts).toContain('Timestamp');
    });

    it('shows only the first NARROW_MAX_VISIBLE_COLUMNS (3) columns once the container measures narrow', () => {
      const restore = stubContainerWidth(480);
      try {
        render(<ResultTable spec={wideColumnSpec()} />);
        const headerTexts = screen
          .getAllByRole('columnheader')
          .map(header => header.textContent ?? '');
        expect(headerTexts).toContain('Agent');
        expect(headerTexts).toContain('Rule');
        expect(headerTexts).toContain('Category');
        // The 4th column is demoted, same "demoted, not deleted" contract as the full-width
        // MAX_VISIBLE_COLUMNS budget.
        expect(headerTexts).not.toContain('Timestamp');
      } finally {
        restore();
      }
    });

    it('keeps every column visible when the measured width is at or above the narrow threshold', () => {
      const restore = stubContainerWidth(900);
      try {
        render(<ResultTable spec={wideColumnSpec()} />);
        const headerTexts = screen
          .getAllByRole('columnheader')
          .map(header => header.textContent ?? '');
        expect(headerTexts).toContain('Timestamp');
      } finally {
        restore();
      }
    });

    it('truncates long cell text with a tooltip instead of wrapping, in narrow mode', () => {
      const restore = stubContainerWidth(480);
      try {
        render(<ResultTable spec={wideColumnSpec()} />);
        const cell = screen.getByText(
          'Multiple authentication failures followed by a successful login',
        );
        // Truncated with a tooltip (EuiToolTip), not wrapped: the value itself is unchanged and
        // still fully present in the DOM (queryable by its exact text), just visually clipped —
        // nothing is lost, only how it renders.
        expect(cell).toHaveClass('wzResultsCellTruncate');
      } finally {
        restore();
      }
    });

    it('does not truncate cell text at ordinary (non-narrow) widths', () => {
      render(<ResultTable spec={wideColumnSpec()} />);
      const cell = screen.getByText(
        'Multiple authentication failures followed by a successful login',
      );
      expect(cell).not.toHaveClass('wzResultsCellTruncate');
    });

    it('keeps every field reachable via the row expander even with columns demoted in narrow mode', () => {
      const restore = stubContainerWidth(480);
      try {
        render(<ResultTable spec={wideColumnSpec()} />);
        fireEvent.click(screen.getByRole('button', { name: 'Expand row' }));
        // The demoted 'timestamp' field is still in the row's full JSON, same "demoted, not
        // deleted" guarantee the full-width column budget already gives.
        expect(
          screen.getByText(/"timestamp": "2026-07-26T05:58:38\.000Z"/),
        ).toBeInTheDocument();
      } finally {
        restore();
      }
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
