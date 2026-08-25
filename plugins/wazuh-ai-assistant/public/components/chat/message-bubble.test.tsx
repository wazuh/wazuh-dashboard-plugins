import path from 'path';
import fs from 'fs';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  MessageBubble,
  sanitizeAssistantMarkdown,
  UiChatMessage,
} from './message-bubble';
import { TableSpec } from '../../../common/types';

const noopResolveDiscoverUrl = () => Promise.resolve(null);
const noopResolveSecurityAnalyticsUrl = () => null;

function baseMessage(overrides: Partial<UiChatMessage>): UiChatMessage {
  return {
    id: 'm1',
    role: 'user',
    content: '',
    createdAt: Date.parse('2024-01-01T10:00:00Z'),
    ...overrides,
  };
}

describe('MessageBubble', () => {
  it('renders a user message as plain text in a bubble, with no avatar beside it', () => {
    const { container } = render(
      <MessageBubble
        message={baseMessage({ role: 'user', content: 'How many alerts?' })}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

    expect(screen.getByText('How many alerts?')).toBeInTheDocument();
    // The "You" avatar is gone (css-audit-full.md §3.7): its 32px plus the row gutter held the
    // question's right edge 16px in from the transcript's, so the bubble and the composer directly
    // below it never shared the surface's one alignment edge. It carried no information the
    // bubble's own fill, border and right alignment do not already carry — which is exactly how
    // every mainstream chat client renders a user turn.
    expect(container.querySelector('[title="You"]')).toBeNull();
    expect(container.querySelector('.euiAvatar')).toBeNull();
    // The bubble itself is unchanged, and takes its radius from the shared container token rather
    // than the inline `borderRadius: 14` it used to carry (§6).
    const bubble = screen
      .getByText('How many alerts?')
      .closest('.euiPanel') as HTMLElement;
    expect(bubble).toHaveClass('wzUserBubble');
    expect(bubble.style.borderRadius).toBe('');
    // The user bubble never renders the aria-live wrapper (that's assistant-only).
    expect(container.querySelector('[aria-live="polite"]')).toBeNull();
  });

  it('renders the assistant avatar as "AI" initials, with no Wazuh image', () => {
    const { container } = render(
      <MessageBubble
        message={baseMessage({ role: 'assistant', content: 'Six today.' })}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

    const avatar = container.querySelector('[title="AI"]');
    expect(avatar).not.toBeNull();
    // initialsLength=2 — both letters, not EUI's default single "A".
    expect(avatar?.textContent).toBe('AI');
    // The avatar is no longer an image: EuiAvatar's imageUrl renders as an inline
    // background-image, and nothing in the bubble should point at the Wazuh mark any more.
    expect(container.innerHTML).not.toContain('background-image');
    expect(container.innerHTML).not.toContain('wazuh_mark');
  });

  it('renders a finished (non-streaming) assistant message as real Markdown', () => {
    const { container } = render(
      <MessageBubble
        message={baseMessage({
          role: 'assistant',
          content: 'This is **bold** text',
          isStreaming: false,
        })}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

    const strong = container.querySelector('strong');
    expect(strong).not.toBeNull();
    expect(strong?.textContent).toBe('bold');
    // The raw markdown markers themselves are gone from the rendered text.
    expect(container.textContent).not.toContain('**bold**');
  });

  it('#8890: renders a Markdown image and a raw <img> tag as inert — no <img> element mounts, and legitimate formatting survives', () => {
    const { container } = render(
      <MessageBubble
        message={baseMessage({
          role: 'assistant',
          content:
            'Findings summary with **bold** text. ![x](http://evil.example/x) ' +
            'Also: <img src=x onerror=alert(1)> End of answer.',
          isStreaming: false,
        })}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

    // No live <img> element was mounted — neither the Markdown image nor the raw HTML tag ever
    // reaches the DOM as an element that could trigger an outbound fetch.
    expect(container.querySelector('img')).toBeNull();
    // Neither the attacker-controlled URL nor the onerror payload appear anywhere in the
    // rendered output (stripped, not merely hidden).
    expect(container.innerHTML).not.toContain('evil.example');
    expect(container.innerHTML).not.toContain('onerror');
    // Legitimate formatting elsewhere in the same answer is unaffected.
    const strong = container.querySelector('strong');
    expect(strong?.textContent).toBe('bold');
    expect(container.textContent).toContain('Findings summary with');
    expect(container.textContent).toContain('End of answer.');
  });

  it('renders a streaming assistant message as plain text (no Markdown parsing) with an aria-live region', () => {
    const { container } = render(
      <MessageBubble
        message={baseMessage({
          role: 'assistant',
          content: 'This is **not** parsed yet',
          isStreaming: true,
        })}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

    // No <strong> — Markdown is not re-parsed on every delta while streaming.
    expect(container.querySelector('strong')).toBeNull();
    expect(screen.getByText('This is **not** parsed yet')).toBeInTheDocument();
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion?.getAttribute('aria-atomic')).toBe('false');
  });

  it('shows the transient statusMessage only before any real content has arrived', () => {
    render(
      <MessageBubble
        message={baseMessage({
          role: 'assistant',
          content: '',
          isStreaming: true,
          statusMessage: 'Querying Wazuh...',
        })}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

    expect(screen.getByText('Querying Wazuh...')).toBeInTheDocument();
  });

  it('hides the statusMessage once delta content has started arriving, even while still streaming', () => {
    render(
      <MessageBubble
        message={baseMessage({
          role: 'assistant',
          content: 'First token',
          isStreaming: true,
          statusMessage: 'Querying Wazuh...',
        })}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

    expect(screen.queryByText('Querying Wazuh...')).toBeNull();
    expect(screen.getByText('First token')).toBeInTheDocument();
  });

  it('never mounts a second, avatar-side loading spinner while streaming (one indicator only)', () => {
    // The avatar-mounted EuiLoadingSpinner that used to run alongside the in-bubble
    // EuiLoadingContent skeleton was removed — a streaming turn now shows exactly one loading
    // affordance (the skeleton/status line inside the bubble, covered by the tests above), never
    // two independent ones for the same event.
    const { container: streamingContainer } = render(
      <MessageBubble
        message={baseMessage({
          role: 'assistant',
          content: '',
          isStreaming: true,
        })}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );
    expect(streamingContainer.querySelector('.euiLoadingSpinner')).toBeNull();
    expect(
      streamingContainer.querySelector('.euiLoadingContent'),
    ).not.toBeNull();
  });

  it('renders a ResultTable underneath the bubble when message.table is present', () => {
    const table: TableSpec = {
      columns: [{ id: 'agent', label: 'Agent' }],
      rows: [{ agent: 'web-01' }, { agent: 'web-02' }],
    };

    render(
      <MessageBubble
        message={baseMessage({
          role: 'assistant',
          content: 'Here are the results:',
          table,
        })}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

    expect(screen.getByText('Results (2 rows)')).toBeInTheDocument();
  });

  /**
   * C4 (CEO item 6 / ux-research.md §E, and PatternFly's explicit "never render a header-only
   * table"): a FINAL table with zero rows draws no card at all. The gate is here, in the renderer,
   * rather than in chat-page.tsx's flush path, because `message.table` is persisted — a conversation
   * saved before this change carries 0-row specs a stream-time gate would never see, and would still
   * draw the empty card on resume.
   */
  describe('a zero-row table is never drawn as a card', () => {
    const EMPTY_TABLE: TableSpec = {
      columns: [{ id: 'agent', label: 'Agent' }],
      rows: [],
    };

    it('renders neither the card nor the fallback line when the answer says it in prose', () => {
      const { container } = render(
        <MessageBubble
          message={baseMessage({
            role: 'assistant',
            content: 'No agents matched that filter in the last 24 hours.',
            table: EMPTY_TABLE,
          })}
          resolveDiscoverUrl={noopResolveDiscoverUrl}
          resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
        />,
      );

      expect(
        screen.getByText('No agents matched that filter in the last 24 hours.'),
      ).toBeInTheDocument();
      expect(screen.queryByText('Results (0 rows)')).toBeNull();
      expect(container.querySelector('.wzResultsCard')).toBeNull();
      expect(container.querySelector('table')).toBeNull();
      // The prose already answered the question; a second, quieter answer under it would be noise.
      expect(screen.queryByText('The query returned no rows.')).toBeNull();
    });

    it('renders one quiet subdued line when the turn produced no prose at all', () => {
      // The guarantee case: the model stopped after the tool call (or Stop was pressed before it
      // narrated anything), so suppressing the card silently would leave the turn with no feedback.
      const { container } = render(
        <MessageBubble
          message={baseMessage({
            role: 'assistant',
            content: '',
            isStreaming: false,
            table: EMPTY_TABLE,
          })}
          resolveDiscoverUrl={noopResolveDiscoverUrl}
          resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
        />,
      );

      expect(
        screen.getByText('The query returned no rows.'),
      ).toBeInTheDocument();
      expect(screen.queryByText('Results (0 rows)')).toBeNull();
      expect(container.querySelector('.wzResultsCard')).toBeNull();
      // A sentence, not a box: no callout and no empty-prompt illustration for one turn's result.
      expect(container.querySelector('.euiCallOut')).toBeNull();
      expect(container.querySelector('.euiEmptyPrompt')).toBeNull();
    });

    it('leaves a turn whose table has rows completely unaffected', () => {
      render(
        <MessageBubble
          message={baseMessage({
            role: 'assistant',
            content: 'Here are the results:',
            table: {
              columns: [{ id: 'agent', label: 'Agent' }],
              rows: [{ agent: 'web-01' }],
            },
          })}
          resolveDiscoverUrl={noopResolveDiscoverUrl}
          resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
        />,
      );

      expect(screen.getByText('Results (1 row)')).toBeInTheDocument();
      expect(screen.getByText('web-01')).toBeInTheDocument();
      expect(screen.queryByText('The query returned no rows.')).toBeNull();
    });

    it('keeps the below-bubble provenance chip, since there is no card header to move it into', () => {
      render(
        <MessageBubble
          message={baseMessage({
            role: 'assistant',
            content: 'Nothing matched.',
            // `provenance.toolCallId` matches the below call — issue #9008 rework: the chip's
            // window text is a server-recorded FACT now, not inferred from `arguments`.
            table: {
              ...EMPTY_TABLE,
              provenance: {
                toolCallId: 't1',
                index: 'wazuh-agents-index-*',
                effectiveRange: { gte: 'now-90d', lte: 'now' },
                clamped: false,
              },
            },
            toolCalls: [{ id: 't1', name: 'get_top_agents', arguments: {} }],
          })}
          resolveDiscoverUrl={noopResolveDiscoverUrl}
          resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
        />,
      );

      // "What did it actually look for?" is the first question a reader asks of a zero-result
      // answer, and the suppressed card is where that chip would otherwise have lived.
      expect(screen.getByText('Top agents · 90d')).toBeInTheDocument();
    });

    it('shows the tool name alone (no invented window) when the server recorded no provenance', () => {
      // Issue #9008 blocker 1: `arguments: {}` used to make the OLD implementation default the
      // window to "90d" itself; the rework must never do that — no `provenance` means no window.
      render(
        <MessageBubble
          message={baseMessage({
            role: 'assistant',
            content: 'Nothing matched.',
            table: EMPTY_TABLE,
            toolCalls: [{ id: 't1', name: 'get_top_agents', arguments: {} }],
          })}
          resolveDiscoverUrl={noopResolveDiscoverUrl}
          resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
        />,
      );

      expect(screen.getByText('Top agents')).toBeInTheDocument();
      expect(screen.queryByText(/Top agents · /)).toBeNull();
    });

    // Issue #9008 review, minor 7: this raw view IS the popover's equivalent for a turn whose
    // table is suppressed (0 rows) — "which index did it read?" matters most exactly here, so it
    // must show the same Index/Time-range lines the rendered-table popover does (ProvenanceChip,
    // result-table.tsx), not just the tool name and raw arguments.
    it('shows the Index and Time-range lines in the suppressed-table raw view once opened', () => {
      render(
        <MessageBubble
          message={baseMessage({
            role: 'assistant',
            content: 'Nothing matched.',
            table: {
              ...EMPTY_TABLE,
              provenance: {
                toolCallId: 't1',
                index: 'wazuh-agents-index-*',
                effectiveRange: { gte: 'now-90d', lte: 'now' },
                clamped: false,
                // `executedAt` required for the Time-range line to resolve at all (issue #9008
                // blocker 2) -- without it a date-math bound stays unresolved and that line is
                // simply omitted, which is exactly what a colocated test below covers instead.
                executedAt: Date.now(),
              },
            },
            toolCalls: [{ id: 't1', name: 'get_top_agents', arguments: {} }],
          })}
          resolveDiscoverUrl={noopResolveDiscoverUrl}
          resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
        />,
      );

      // Closed by default -- neither line is on screen unbidden.
      expect(screen.queryByText(/^Index:/)).toBeNull();

      fireEvent.click(screen.getByText('Top agents · 90d'));

      expect(
        screen.getByText('Index: wazuh-agents-index-*'),
      ).toBeInTheDocument();
      expect(screen.getByText(/^Time range:/)).toBeInTheDocument();
    });

    it('shows the tool name alone (no invented window) when the server recorded no provenance', () => {
      // Issue #9008 blocker 1: `arguments: {}` used to make the OLD implementation default the
      // window to "90d" itself; the rework must never do that — no `provenance` means no window.
      render(
        <MessageBubble
          message={baseMessage({
            role: 'assistant',
            content: 'Nothing matched.',
            table: EMPTY_TABLE,
            toolCalls: [{ id: 't1', name: 'get_top_agents', arguments: {} }],
          })}
          resolveDiscoverUrl={noopResolveDiscoverUrl}
          resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
        />,
      );

      expect(screen.getByText('Top agents')).toBeInTheDocument();
      expect(screen.queryByText(/Top agents · /)).toBeNull();
    });

    it('holds a suppressed-table answer to the prose measure, like any other prose-only turn', () => {
      // The bubble opts OUT of the reading measure only to make room for a table (layout contract
      // §5). With no table drawn there is nothing to make room for, so the answer must not be left
      // running to the wide table measure.
      render(
        <MessageBubble
          message={baseMessage({
            role: 'assistant',
            content: 'Nothing matched.',
            table: EMPTY_TABLE,
          })}
          resolveDiscoverUrl={noopResolveDiscoverUrl}
          resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
        />,
      );

      // The measure lives on the inner prose container (iteration-4 audit item 10: the outer flex
      // item's own inline `maxWidth` always wins over a class there, so it no longer carries this
      // class at all — see the "prose measure vs. table breakout" tests below for that).
      const proseContainer = screen
        .getByText('Nothing matched.')
        .closest('.wzProseMeasure') as HTMLElement;
      expect(proseContainer).toHaveClass('wzProseMeasure');
    });
  });

  it('does not render a table section when message.table is absent', () => {
    const { container } = render(
      <MessageBubble
        message={baseMessage({ role: 'assistant', content: 'no table here' })}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

    expect(container.querySelector('.euiAccordion')).toBeNull();
  });

  // Graceful-failure handoff (server/tools/suggest-discover-query.ts / issue
  // 13-suggested-query-discover-handoff.md): a `suggested_query` stream event sets
  // message.suggestedQuery instead of message.table, rendered as a callout with the model's own
  // reason text plus an "Open in Discover" link.
  it('renders a callout with the reason text and an "Open in Discover" link when suggestedQuery is present', async () => {
    const resolveDiscoverUrl = () =>
      Promise.resolve(
        'https://example.test/app/data-explorer/discover#?_a=...',
      );

    render(
      <MessageBubble
        message={baseMessage({
          role: 'assistant',
          content: 'I could not check that directly.',
          suggestedQuery: {
            index: 'wazuh-findings-v5-*',
            dsl: { bool: { filter: [] } },
            reason: 'This index is outside what I can query directly.',
          },
        })}
        resolveDiscoverUrl={resolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

    expect(
      screen.getByText('This index is outside what I can query directly.'),
    ).toBeInTheDocument();
    // dsl `{ bool: { filter: [] } }` carries no explicit time-range clause and the synthetic spec
    // this callout builds records no provenance, so the suggested query has no time filter at all:
    // the link opens on all of history rather than narrowing to a last-24h default the suggestion
    // never asked for, and the label says so (discover-link.tsx).
    const link = await screen.findByRole('link', {
      name: 'Open in Discover (all time)',
    });
    expect(link).toHaveAttribute(
      'href',
      'https://example.test/app/data-explorer/discover#?_a=...',
    );
  });

  // Layout contract §5 ("one measure, one gutter"): prose is held to a fixed reading measure;
  // block content (a result table) fills the wider content column up to $wzContentMaxWidth — the
  // same column the composer uses — but is bounded by it, never reaching past the composer's edge.
  describe('prose measure vs. table breakout (layout contract §5)', () => {
    it('holds a prose-only assistant answer to the shared reading measure', () => {
      render(
        <MessageBubble
          message={baseMessage({ role: 'assistant', content: 'Six today.' })}
          resolveDiscoverUrl={noopResolveDiscoverUrl}
          resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
        />,
      );

      // The measure arrives by CLASS, on the INNER prose container — not as an inline `68ch`
      // restated inside message-bubble.tsx: the figure's single home is `$wzProseMeasure`, which
      // the next test pins to the stylesheet.
      const proseContainer = screen
        .getByText('Six today.')
        .closest('.wzProseMeasure') as HTMLElement;
      expect(proseContainer).toHaveClass('wzProseMeasure');

      // The OUTER flex item does NOT also carry the class (iteration-4 audit item 10): its own
      // inline `maxWidth` (below) always wins over a class on specificity, so the class used to sit
      // here doing nothing — dead weight for a table turn, misleading for a prose-only one.
      const bubbleItem = screen
        .getByText('Six today.')
        .closest('.euiFlexItem') as HTMLElement;
      expect(bubbleItem).not.toHaveClass('wzProseMeasure');
      expect(bubbleItem.style.maxWidth).not.toBe('68ch');
    });

    it('defines the prose measure once, in the stylesheet, from $wzProseMeasure', () => {
      // The test above proves the bubble opts INTO the measure; this proves the thing it opts into
      // is the shared token and not a second literal free to drift from it. It has to read the
      // source directly because jest maps `.scss` to a style mock, so no rendered assertion can
      // ever observe a value that came from a stylesheet.
      const scssSource = fs.readFileSync(
        path.join(__dirname, 'chat-page.scss'),
        'utf8',
      );
      expect(scssSource).toMatch(
        /\.wzProseMeasure\s*\{[^}]*max-width:\s*\$wzProseMeasure/,
      );
    });

    it('keeps avatar, prose and meta on the same left edge in a table-carrying (--wide) row, bounded at the content column', () => {
      // The drift this pins (css-audit-full.md §3.1 and the owner's live report that avatars sit
      // further left on table answers): the earlier per-element scheme centred the wider row 120px
      // further out and then tried to pull four separate edges back with per-element calc
      // corrections, which left the avatar and card short of the prose rail. The wide row now
      // instead ANCHORS its own inline-start edge at the normal row's (`margin-inline-start: max(0px,
      // (100% - $wzContentMaxWidth) / 2)`, the same offset a normal row's `margin: 0 auto` produces)
      // and takes any remaining room on the end side only (`width: auto; margin-inline-end: 0`), so
      // the avatar, prose and meta all keep their normal x with no per-element correction. The cap is
      // $wzContentMaxWidth — the SAME content column the composer uses (owner's iteration-4 call:
      // bound the table by the chat box) — NOT a wider table-only $wzTableMaxWidth, so the card's
      // right edge lands on the composer's right edge instead of overshooting it on wide windows. It
      // reads the source directly because jest maps `.scss` to a style mock, so no rendered assertion
      // can observe a value that came from a stylesheet.
      const scssSource = fs.readFileSync(
        path.join(__dirname, 'chat-page.scss'),
        'utf8',
      );
      // The whole wide-row treatment lives on the row itself: an anchored inline-start plus a
      // right-only stretch, capped at the shared content measure (not a wider table-only token).
      expect(scssSource).toMatch(
        /&\.wzMessageRow--wide \{[\s\S]*?width: auto;[\s\S]*?max-width: \$wzContentMaxWidth;[\s\S]*?margin-inline-start: max\(0px, calc\(\(100% - #\{\$wzContentMaxWidth\}\) \/ 2\)\);[\s\S]*?margin-inline-end: 0;/,
      );
      // The retired table-only breakout is gone: no rule caps the wide row at $wzTableMaxWidth any
      // more (the token itself is removed from _redesign.scss; only history-explaining comments here
      // still name it). Matched as a DECLARATION, not a bare mention, so those comments pass.
      expect(scssSource).not.toMatch(/max-width:\s*\$wzTableMaxWidth/);
      // The old per-element left corrections are gone: the avatar no longer breaks left, the card no
      // longer breaks out to the avatar's edge, and prose/meta no longer carry a wide-row margin.
      expect(scssSource).not.toMatch(/\.wzMessageRow--wide \.wzProseMeasure/);
      expect(scssSource).not.toMatch(/\.wzMessageRow--wide \.wzMsgAvatarItem/);
      expect(scssSource).not.toMatch(/\.wzMessageRow--wide \.wzMsgMetaRow/);
      expect(scssSource).not.toMatch(/\.wzMessageRow--wide \.wzResultsCard/);
    });

    it('renders inline code in an answer as a chip, not as a square 8px slab', () => {
      // §2.1/§2.2: EUI's markdown default gives inline code `border-radius: 0` and `padding: 0 8px`,
      // which around a short field name read as detached punctuation rather than as a value inside
      // the sentence — and its `em`-based size resolved to a fractional 12.6px. Scoped to
      // `:not(pre) > code` so a fenced block (EuiCodeBlock renders `pre > code`) keeps its own
      // styling.
      const scssSource = fs.readFileSync(
        path.join(__dirname, 'chat-page.scss'),
        'utf8',
      );
      // The re-audit found the first version of this rule shipped and changed nothing: EUI puts
      // the fill/padding/radius on the wrapping `span.euiCodeBlock`, not on `code`. The selector
      // list must therefore include the span, or the slab survives untouched.
      expect(scssSource).toMatch(
        /:not\(pre\) > code,\s*span\.euiCodeBlock \{[^}]*border-radius:\s*4px[^}]*padding:\s*0 4px[^}]*font-size:\s*12px/,
      );
    });

    it('lets a table-carrying answer break out past the prose measure', () => {
      const table: TableSpec = {
        columns: [{ id: 'agent', label: 'Agent' }],
        rows: [{ agent: 'web-01' }],
      };
      render(
        <MessageBubble
          message={baseMessage({
            role: 'assistant',
            content: 'Here are the results:',
            table,
          })}
          resolveDiscoverUrl={noopResolveDiscoverUrl}
          resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
        />,
      );

      const bubbleItem = screen
        .getByText('Results (1 row)')
        .closest('.euiFlexItem') as HTMLElement;
      // Breaking out means declining the 68ch prose measure and filling whatever the ROW allows —
      // which is now the shared content column ($wzContentMaxWidth), still wider than the prose. The
      // row-level cap itself lives on `.wzMessageRow--wide` (chat-page.scss), applied one level up
      // and asserted in message-list.test.tsx; restating it inline here would be a second copy with
      // nothing keeping the two in step.
      expect(bubbleItem).not.toHaveClass('wzProseMeasure');
      expect(bubbleItem.style.maxWidth).toBe('100%');
    });
  });

  // Provenance moves UP into the result card's header once a table exists (layout contract §4):
  // the below-bubble chip disappears for that turn, and the card receives the same data instead.
  describe('provenance handoff to the result card header', () => {
    it('does not render a below-bubble chip for a turn whose tool call produced a table', () => {
      const table: TableSpec = {
        columns: [{ id: 'agent', label: 'Agent' }],
        rows: [{ agent: 'web-01' }],
        provenance: {
          toolCallId: 't1',
          index: 'wazuh-findings-v5*',
          effectiveRange: { gte: 'now-90d', lte: 'now' },
          clamped: false,
        },
      };
      render(
        <MessageBubble
          message={baseMessage({
            role: 'assistant',
            content: 'Here are the results:',
            table,
            toolCalls: [
              { id: 't1', name: 'get_critical_findings', arguments: {} },
            ],
          })}
          resolveDiscoverUrl={noopResolveDiscoverUrl}
          resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
        />,
      );

      // The chip still exists — just inside the result card's header, not below the bubble. Its
      // window text comes from `table.provenance` (a server-recorded fact, issue #9008 rework),
      // never from the call's own (here empty) `arguments`.
      expect(screen.getByText('Critical findings · 90d')).toBeInTheDocument();
      // Only one instance: it was not ALSO left behind in the below-bubble meta row.
      expect(screen.getAllByText('Critical findings · 90d')).toHaveLength(1);
    });

    it('still renders the below-bubble chip for a turn whose tool call produced no table', () => {
      render(
        <MessageBubble
          message={baseMessage({
            role: 'assistant',
            content: 'Six alerts today.',
            toolCalls: [
              { id: 't1', name: 'get_critical_findings', arguments: {} },
            ],
          })}
          resolveDiscoverUrl={noopResolveDiscoverUrl}
          resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
        />,
      );

      // No table at all -> no provenance -> the chip names the call, nothing invented for it.
      expect(screen.getByText('Critical findings')).toBeInTheDocument();
    });

    // Issue #9008 blocker 3: a multi-call turn must attribute provenance ONLY to the call whose id
    // matches `table.provenance.toolCallId` — every other call's chip renders name-only.
    it('attributes provenance only to the producing call in a multi-call turn', () => {
      const table: TableSpec = {
        columns: [{ id: 'agent', label: 'Agent' }],
        rows: [{ agent: 'web-01' }],
        provenance: {
          toolCallId: 't2',
          index: 'wazuh-findings-v5*',
          effectiveRange: { gte: 'now-7d', lte: 'now' },
          clamped: false,
        },
      };
      render(
        <MessageBubble
          message={baseMessage({
            role: 'assistant',
            content: 'Here are the results:',
            table,
            toolCalls: [
              { id: 't1', name: 'get_agents', arguments: {} },
              { id: 't2', name: 'get_critical_findings', arguments: {} },
            ],
          })}
          resolveDiscoverUrl={noopResolveDiscoverUrl}
          resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
        />,
      );

      // t2 (the actual producer) shows the real window.
      expect(screen.getByText('Critical findings · 7d')).toBeInTheDocument();
      // t1 must NOT inherit t2's index/window — it renders name-only.
      expect(screen.getByText('Agents')).toBeInTheDocument();
      expect(screen.queryByText(/Agents · /)).toBeNull();
    });
  });

  it('does not render the suggested-query callout when message.suggestedQuery is absent', () => {
    render(
      <MessageBubble
        message={baseMessage({ role: 'assistant', content: 'a normal answer' })}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

    expect(screen.queryByRole('link', { name: 'Open in Discover' })).toBeNull();
  });
});

describe('sanitizeAssistantMarkdown (#8890)', () => {
  it('strips inline Markdown image syntax, including the URL', () => {
    const out = sanitizeAssistantMarkdown(
      'before ![alt](http://evil.example/x) after',
    );
    expect(out).not.toContain('![');
    expect(out).not.toContain('evil.example');
  });

  it('strips reference-style Markdown image syntax', () => {
    const out = sanitizeAssistantMarkdown('before ![alt][ref] after');
    expect(out).not.toContain('![');
  });

  it('strips raw HTML tags (open, close, self-closing)', () => {
    const out = sanitizeAssistantMarkdown(
      '<img src=x onerror=alert(1)> and <div>text</div> and <br/>',
    );
    expect(out).not.toContain('<img');
    expect(out).not.toContain('<div>');
    expect(out).not.toContain('</div>');
    expect(out).not.toContain('<br/>');
    expect(out).toContain('text');
  });

  it('leaves ordinary "<"/">" comparisons in prose untouched (not mistaken for a tag)', () => {
    const input = 'The threshold is value < 5 and > 10 in this case.';
    expect(sanitizeAssistantMarkdown(input)).toBe(input);
  });

  it('leaves normal Markdown (bold, lists, headings) untouched', () => {
    const input =
      '**bold** and _italic_ and a list:\n- one\n- two\n\n# Heading';
    expect(sanitizeAssistantMarkdown(input)).toBe(input);
  });

  it('leaves fenced code blocks completely untouched, even with <img>/![]() inside them', () => {
    const input =
      'Before.\n```html\n<img src=x onerror=alert(1)>\n![a](b)\n```\nAfter.';
    const out = sanitizeAssistantMarkdown(input);
    expect(out).toContain('<img src=x onerror=alert(1)>');
    expect(out).toContain('![a](b)');
  });

  it('leaves inline code spans completely untouched', () => {
    const input = 'Example: `<img src=x>` and `![a](b)` in code.';
    expect(sanitizeAssistantMarkdown(input)).toBe(input);
  });

  it('keeps an explicit http(s) link but drops a non-http(s) link target, keeping only its label', () => {
    const out = sanitizeAssistantMarkdown(
      'See [CVE page](https://nvd.nist.gov/x) or [click me](javascript:alert(1)) or [rel](/x).',
    );
    expect(out).toContain('[CVE page](https://nvd.nist.gov/x)');
    expect(out).not.toContain('javascript:');
    expect(out).not.toContain('[click me]');
    expect(out).toContain('click me');
    expect(out).not.toContain('[rel]');
    expect(out).toContain('rel');
  });
});
