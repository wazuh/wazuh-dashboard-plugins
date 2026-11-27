import path from 'path';
import fs from 'fs';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  AssistantMarkdown,
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
    // The "You" avatar is gone: its 32px plus the row gutter held the question's right edge 16px
    // in from the transcript's, so the bubble and the composer directly below it never shared the
    // surface's one alignment edge. It carried no information the bubble's own fill, border and
    // right alignment do not already carry — which is exactly how every mainstream chat client
    // renders a user turn.
    expect(container.querySelector('[title="You"]')).toBeNull();
    expect(container.querySelector('.euiAvatar')).toBeNull();
    // The bubble takes its radius from the shared container token, not an inline
    // `borderRadius: 14`.
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
    // The avatar is not an image: EuiAvatar's imageUrl renders as an inline background-image, and
    // nothing in the bubble points at the Wazuh mark.
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

  it('renders a Markdown image and a raw <img> tag as inert — no <img> element mounts, and legitimate formatting survives', () => {
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
    // A streaming turn shows exactly one loading affordance (the skeleton/status line inside the
    // bubble, covered by the tests above), never a second, avatar-mounted spinner running
    // alongside it for the same event.
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

  it('pairs the status label with a live spinner, inside the same aria-live region', () => {
    // The label changes at most three times over a turn that can run for tens of seconds, so on
    // its own it reads as a frozen line rather than work in progress. The spinner is the motion;
    // the label is what gets announced, so the spinner must be aria-hidden and the pair must sit
    // inside the streaming bubble's own live region.
    const { container } = render(
      <MessageBubble
        message={baseMessage({
          role: 'assistant',
          content: '',
          isStreaming: true,
          statusMessage: 'Querying get_agent_inventory…',
        })}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

    const statusLine = container.querySelector(
      '[data-test-subj="wzTurnStatusLine"]',
    );
    expect(statusLine).not.toBeNull();
    const spinner = statusLine?.querySelector('.euiLoadingSpinner');
    expect(spinner).not.toBeNull();
    expect(spinner?.getAttribute('aria-hidden')).toBe('true');
    expect(statusLine?.closest('[aria-live="polite"]')).not.toBeNull();
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
   * PatternFly's explicit "never render a header-only table" guidance: a FINAL table with zero
   * rows draws no card at all. The gate is here, in the renderer, rather than in chat-page.tsx's
   * flush path, because `message.table` is persisted — an older saved conversation can carry
   * 0-row specs a stream-time gate would never see, and would still draw the empty card on resume.
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
            // `provenance.toolCallId` matches the below call — the chip's window text is a
            // server-recorded FACT, not inferred from `arguments`.
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
      // Defaulting `arguments: {}` to a "90d" window would be inventing a window — no `provenance`
      // means no window is shown.
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

    // This raw view IS the popover's equivalent for a turn whose table is suppressed (0 rows) —
    // "which index did it read?" matters most exactly here, so it
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
                // `executedAt` required for the Time-range line to resolve at all -- without it a
                // date-math bound stays unresolved and that line is simply omitted, which is
                // exactly what a colocated test below covers instead.
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
      // Defaulting `arguments: {}` to a "90d" window would be inventing a window — no `provenance`
      // means no window is shown.
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

    it('renders a suppressed-table answer as prose, like any other prose-only turn', () => {
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

      const proseContainer = screen
        .getByText('Nothing matched.')
        .closest('.wzProse') as HTMLElement;
      expect(proseContainer).toHaveClass('wzProse');
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

  // Layout contract §5 ("one measure, one gutter"): the answer text and block content (a result
  // table) both fill the content column up to $wzContentMaxWidth — the same column the composer
  // uses — so the answer and its card share one width, never reaching past the composer's edge.
  describe('answer width vs. results card (layout contract §5)', () => {
    it('gives the user question the full row width, like the answer', () => {
      render(
        <MessageBubble
          message={baseMessage({ role: 'user', content: 'How many agents?' })}
          resolveDiscoverUrl={noopResolveDiscoverUrl}
          resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
        />,
      );

      const bubbleItem = screen
        .getByText('How many agents?')
        .closest('.euiFlexItem') as HTMLElement;
      expect(bubbleItem.style.maxWidth).toBe('100%');
      expect(bubbleItem.style.width).toBe('100%');
    });

    it('renders a prose-only assistant answer in the full-width prose container', () => {
      render(
        <MessageBubble
          message={baseMessage({ role: 'assistant', content: 'Six today.' })}
          resolveDiscoverUrl={noopResolveDiscoverUrl}
          resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
        />,
      );

      const proseContainer = screen
        .getByText('Six today.')
        .closest('.wzProse') as HTMLElement;
      expect(proseContainer).toHaveClass('wzProse');

      // The assistant column spans the whole row, so the answer text gets the same width as a
      // results card would.
      const bubbleItem = screen
        .getByText('Six today.')
        .closest('.euiFlexItem') as HTMLElement;
      expect(bubbleItem).not.toHaveClass('wzProse');
      expect(bubbleItem.style.maxWidth).toBe('100%');
    });

    it('does not cap the answer prose at a reading measure narrower than the results card', () => {
      // Reads the source directly because jest maps `.scss` to a style mock, so no rendered
      // assertion can ever observe a value that came from a stylesheet.
      const scssSource = fs.readFileSync(
        path.join(__dirname, 'chat-page.scss'),
        'utf8',
      );
      expect(scssSource).toMatch(/\.wzProse \{/);
      expect(scssSource).not.toMatch(/\.wzProse \{[^}]*max-width/);
      expect(scssSource).not.toMatch(/\$wzProseMeasure/);
    });

    it('keeps avatar, prose and meta on the same left edge in a table-carrying (--wide) row, bounded at the content column', () => {
      // The wide row ANCHORS its own inline-start edge at the normal row's
      // (`margin-inline-start: max(0px, (100% - $wzContentMaxWidth) / 2)`, the same offset a
      // normal row's `margin: 0 auto` produces) and takes any remaining room on the end side only
      // (`width: auto; margin-inline-end: 0`), so the avatar, prose and meta all keep their normal
      // x with no per-element correction. The cap is $wzContentMaxWidth — the SAME content column
      // the composer uses, bounding the table by the chat box — NOT a wider table-only
      // $wzTableMaxWidth, so the card's right edge lands on the composer's right edge instead of
      // overshooting it on wide windows. It reads the source directly because jest maps `.scss` to
      // a style mock, so no rendered assertion can observe a value that came from a stylesheet.
      const scssSource = fs.readFileSync(
        path.join(__dirname, 'chat-page.scss'),
        'utf8',
      );
      // The whole wide-row treatment lives on the row itself: an anchored inline-start plus a
      // right-only stretch, capped at the shared content measure (not a wider table-only token).
      expect(scssSource).toMatch(
        /&\.wzMessageRow--wide \{[\s\S]*?width: auto;[\s\S]*?max-width: \$wzContentMaxWidth;[\s\S]*?margin-inline-start: max\(0px, calc\(\(100% - #\{\$wzContentMaxWidth\}\) \/ 2\)\);[\s\S]*?margin-inline-end: 0;/,
      );
      // No rule caps the wide row at $wzTableMaxWidth — the token does not exist in
      // _redesign.scss. Matched as a DECLARATION, not a bare mention, so a comment merely naming
      // it elsewhere still passes.
      expect(scssSource).not.toMatch(/max-width:\s*\$wzTableMaxWidth/);
      // None of the avatar, card, or prose/meta carry a per-element left correction in the wide
      // row: the avatar does not break left, the card does not break out to the avatar's edge, and
      // prose/meta carry no wide-row margin.
      expect(scssSource).not.toMatch(/\.wzMessageRow--wide \.wzProse/);
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

    it('gives a table-carrying answer the full row width', () => {
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
      // The bubble fills whatever the ROW allows — the shared content column
      // ($wzContentMaxWidth). The row-level cap itself lives on `.wzMessageRow--wide` (chat-page.scss), applied one level up
      // and asserted in message-list.test.tsx; restating it inline here would be a second copy with
      // nothing keeping the two in step.
      expect(bubbleItem).not.toHaveClass('wzProse');
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
      // window text comes from `table.provenance` (a server-recorded fact), never from the call's
      // own (here empty) `arguments`.
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

    // A multi-call turn must attribute provenance ONLY to the call whose id matches
    // `table.provenance.toolCallId` — every other call's chip renders name-only.
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

describe('sanitizeAssistantMarkdown', () => {
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

  it('drops an image with a non-http(s) target whole instead of leaving "!label" behind', () => {
    expect(
      sanitizeAssistantMarkdown(
        'a ![x](data:image/png;base64,AA) b ![y](/p.png) c',
      ),
    ).toBe('a  b  c');
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

describe('MessageBubble — image safety', () => {
  const renderAnswer = (content: string) =>
    render(
      <MessageBubble
        message={baseMessage({ role: 'assistant', content })}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

  it('renders no <img> for any image form in a finished answer, keeping the prose around it', () => {
    const { container } = renderAnswer(
      [
        'one ![plain](http://evil.example/1) two',
        'three ![x\\]y](http://evil.example/2) four',
        'five ![x[y]z](http://evil.example/3) six',
        'seven ![full][ref] eight',
        'nine ![ref] ten',
        'eleven ![ref][] twelve',
        'a \\` ![bt](http://evil.example/5) `code`',
        'thirteen ![data](data:image/png;base64,AAAA) fourteen',
        'fifteen ![rel](/relative.png) sixteen',
        '[ref]: http://evil.example/4',
      ].join('\n\n'),
    );

    expect(container.querySelectorAll('img')).toHaveLength(0);
    const text = container.textContent ?? '';
    for (const word of [
      'one',
      'two',
      'four',
      'six',
      'eight',
      'ten',
      'twelve',
      'fourteen',
      'sixteen',
    ]) {
      expect(text).toContain(word);
    }
    // Dropped whole: no alt text, no stray "!" from an image the string sanitizer handled.
    for (const alt of ['plain', 'full', 'data', 'rel', '!']) {
      expect(text).not.toContain(alt);
    }
    expect(text).not.toContain('evil.example');
  });

  it('shows image syntax inside code samples verbatim', () => {
    const { container } = renderAnswer(
      'Inline `![a](http://x/1)` sample.\n\n```md\n![b](http://x/2)\n```\n\n~~~\n![c](http://x/3)\n~~~',
    );

    expect(container.querySelectorAll('img')).toHaveLength(0);
    const code = Array.from(container.querySelectorAll('code')).map(
      node => node.textContent,
    );
    expect(code.join('\n')).toContain('![a](http://x/1)');
    expect(code.join('\n')).toContain('![b](http://x/2)');
    expect(code.join('\n')).toContain('![c](http://x/3)');
  });

  it('renders no <img> in an expanded failure reason', () => {
    const { container } = render(
      <MessageBubble
        message={baseMessage({
          role: 'assistant',
          content: '',
          failureReason:
            'Provider responded with HTTP 500: boom ![e](http://evil.example/provider-error) ![r]\n\n[r]: http://evil.example/ref',
        })}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );
    fireEvent.click(screen.getByText('Show reason'));

    expect(
      screen.getByText('Provider responded with HTTP 500: boom', {
        exact: false,
      }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll('img')).toHaveLength(0);
  });

  it('error markdown drops images and still opens links in a new tab', () => {
    const { container } = render(
      <AssistantMarkdown variant='error'>
        {
          'Top up [here](https://billing.example/plan). ![x](http://evil.example/e)'
        }
      </AssistantMarkdown>,
    );

    expect(container.querySelectorAll('img')).toHaveLength(0);
    const link = screen.getByText('here').closest('a');
    expect(link?.getAttribute('href')).toBe('https://billing.example/plan');
    expect(link?.getAttribute('target')).toBe('_blank');
  });
});

describe('AssistantMarkdown — raw HTML and link targets', () => {
  const blockStarts = [
    '<script',
    '<pre',
    '<style',
    '<!--',
    '<?',
    '<!D',
    '<![CDATA[',
    '<div',
    '<p',
  ];
  const withLine = (line: string) =>
    `one\n\ntwo\n\n${line}\nthree\n\nfour\n\nfive\n`;
  const expectEveryLine = (container: HTMLElement) => {
    for (const word of ['one', 'two', 'three', 'four', 'five']) {
      expect(container.textContent).toContain(word);
    }
  };

  it.each(blockStarts)(
    'shows every line of an answer around a "%s" line, as text',
    line => {
      const { container } = render(
        <AssistantMarkdown>{withLine(line)}</AssistantMarkdown>,
      );

      expectEveryLine(container);
      expect(container.textContent).toContain(line);
      // Paragraphs only: no element was built from the line.
      expect(
        container.querySelectorAll('.euiMarkdownFormat > div > :not(p)'),
      ).toHaveLength(0);
    },
  );

  it.each(blockStarts)(
    'shows every line of error text around a "%s" line',
    line => {
      const { container } = render(
        <AssistantMarkdown variant='error'>{withLine(line)}</AssistantMarkdown>,
      );

      expectEveryLine(container);
    },
  );

  it('shows every line of a failure reason around a "<script" line', () => {
    const { container } = render(
      <MessageBubble
        message={baseMessage({
          role: 'assistant',
          content: '',
          failureReason: withLine('<script'),
        })}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );
    fireEvent.click(screen.getByText('Show reason'));

    expectEveryLine(container);
  });

  it('keeps later links working after a tag rebuilt by the link cleanup', () => {
    const { container } = render(
      <AssistantMarkdown>
        {
          'x <a[](x) href=https://c1.invalid/>c1 then [docs](https://example.com/d)'
        }
      </AssistantMarkdown>,
    );

    const link = screen.getByText('docs').closest('a');
    expect(link?.getAttribute('href')).toBe('https://example.com/d');
    expect(container.textContent).toContain('c1');
  });

  it.each([
    ['inline', '[c1](data:text/plain,c1)'],
    ['nested', '[c1][](x)(data:text/plain,c1)'],
    ['reference', '[c1][r]\n\n[r]: data:text/plain,c1'],
    ['nested relative path', '[c1][](x)(/app/home#m)'],
    ['reference javascript', '[c1][r]\n\n[r]: javascript:alert(1)'],
  ])('renders a non-http(s) %s link as its label only', (_form, markdown) => {
    for (const variant of ['answer', 'error'] as const) {
      const { container, unmount } = render(
        <AssistantMarkdown variant={variant}>{markdown}</AssistantMarkdown>,
      );

      expect(container.querySelector('a, button')).toBeNull();
      expect(container.textContent?.trim()).toBe('c1');
      unmount();
    }
  });

  it.each([
    ['inline', '[c1](https://example.com/p)'],
    ['reference', '[c1][r]\n\n[r]: https://example.com/p'],
  ])('keeps an http(s) %s link as an anchor', (_form, markdown) => {
    const answer = render(<AssistantMarkdown>{markdown}</AssistantMarkdown>);
    const answerLink = answer.container.querySelector('a');
    expect(answerLink?.getAttribute('href')).toBe('https://example.com/p');
    expect(answerLink?.getAttribute('target')).toBeNull();
    answer.unmount();

    const error = render(
      <AssistantMarkdown variant='error'>{markdown}</AssistantMarkdown>,
    );
    const errorLink = error.container.querySelector('a');
    expect(errorLink?.getAttribute('href')).toBe('https://example.com/p');
    expect(errorLink?.getAttribute('target')).toBe('_blank');
  });

  it.each([
    [
      'a later comparison',
      'one\n\n<script\nthree\n\nfour > 5\n\nfive',
      ['three', 'four > 5', 'five'],
    ],
    [
      'a later quote',
      'one\n\n<div\n\ntwo\n\n> quoted\n\nend',
      ['two', 'quoted', 'end'],
    ],
  ])(
    'keeps every line when an unclosed tag line is followed by %s',
    (_case, markdown, words) => {
      const { container } = render(
        <AssistantMarkdown>{markdown}</AssistantMarkdown>,
      );

      for (const word of words) {
        expect(container.textContent).toContain(word);
      }
    },
  );

  it('keeps a quote right under an unclosed tag line', () => {
    const { container } = render(
      <AssistantMarkdown>{'<script\n> quoted text'}</AssistantMarkdown>,
    );

    expect(container.querySelector('blockquote')?.textContent).toContain(
      'quoted text',
    );
  });

  it('shows a tag split over lines as text, with no element', () => {
    const { container } = render(
      <AssistantMarkdown>
        {'<img\n src=x onerror=alert(1)>\ntail'}
      </AssistantMarkdown>,
    );

    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('<img');
    expect(container.textContent).toContain('tail');
  });

  it('keeps a link title', () => {
    const { container } = render(
      <AssistantMarkdown>
        {'[a](https://example.com/p "Docs")'}
      </AssistantMarkdown>,
    );

    expect(container.querySelector('a')?.getAttribute('title')).toBe('Docs');
  });

  it('drops a closed HTML comment whole and keeps the lines around it', () => {
    const { container } = render(
      <AssistantMarkdown>
        {'one\n\n<!-- note -->\n\ntwo <!-- c --> three'}
      </AssistantMarkdown>,
    );

    expect(container.textContent).not.toContain('note');
    expect(container.textContent).not.toContain('<!--');
    expect(container.textContent).toContain('one');
    expect(container.textContent).toContain('two  three');
  });

  it('keeps the text after an unclosed comment when a later paragraph has an arrow', () => {
    const { container } = render(
      <AssistantMarkdown>
        {
          'Payload starts with <!-- and was cut off.\n\n**Actions**\n\n1. Block it.\n2. Flow: browser --> WAF --> backend.'
        }
      </AssistantMarkdown>,
    );

    expect(container.textContent).toContain(
      'Payload starts with <!-- and was cut off.',
    );
    expect(container.querySelector('strong')?.textContent).toBe('Actions');
    expect(container.querySelectorAll('li')).toHaveLength(2);
    expect(container.textContent).toContain('browser --> WAF --> backend.');
  });

  it('drops a comment that spans lines within one paragraph', () => {
    const { container } = render(
      <AssistantMarkdown>{'one <!-- a\nb --> two'}</AssistantMarkdown>,
    );

    expect(container.textContent).toBe('one  two');
  });

  it('keeps an HTML-looking line inside the paragraph above it', () => {
    const { container } = render(
      <AssistantMarkdown>{'line one\n<?x\nline two'}</AssistantMarkdown>,
    );

    expect(container.querySelectorAll('p')).toHaveLength(1);
    expect(container.textContent).toContain('line two');
  });

  it('shows comparisons in prose unchanged', () => {
    const { container } = render(
      <AssistantMarkdown>{'value < 5 and > 10'}</AssistantMarkdown>,
    );

    expect(container.textContent).toBe('value < 5 and > 10');
  });
});

/**
 * A failed turn keeps a permanent, per-turn record: the assistant placeholder is not deleted, and
 * the reason does not live only in a dismissible callout above the transcript that the next
 * question would clear. These pin that permanent record.
 */
describe('MessageBubble — failed turn honesty', () => {
  it('marks a failed turn permanently and keeps the reason collapsed until asked for', () => {
    render(
      <MessageBubble
        message={baseMessage({
          role: 'assistant',
          content: '',
          failureReason: 'provider stream failed: 502 upstream',
        })}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

    expect(screen.getByText('This turn failed')).toBeInTheDocument();
    // Collapsed: a provider error can be a paragraph of upstream JSON, and the transcript is not a
    // log viewer.
    expect(
      screen.queryByText('provider stream failed: 502 upstream'),
    ).toBeNull();

    const toggle = screen.getByText('Show reason');
    expect(toggle.closest('button')?.getAttribute('aria-expanded')).toBe(
      'false',
    );
    fireEvent.click(toggle);
    expect(
      screen.getByText('provider stream failed: 502 upstream'),
    ).toBeInTheDocument();
    expect(
      screen
        .getByText('Hide reason')
        .closest('button')
        ?.getAttribute('aria-expanded'),
    ).toBe('true');
  });

  it('offers the retry action on a failed turn, with the caller-supplied label', () => {
    const onRetry = jest.fn();
    render(
      <MessageBubble
        message={baseMessage({
          role: 'assistant',
          content: '',
          failureReason: 'boom',
        })}
        onRetry={onRetry}
        retryLabel='Ask again'
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

    fireEvent.click(screen.getByText('Ask again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('reports the failure reason rather than the generic interrupted notice when both flags are set', () => {
    // An error mid-stream also never reaches `done`, so chat-page.tsx can end up with both marks on
    // one message. The specific reason is strictly more useful than "Response interrupted".
    render(
      <MessageBubble
        message={baseMessage({
          role: 'assistant',
          content: 'partial',
          failureReason: 'rate limited',
          interrupted: true,
        })}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

    expect(screen.getByText('This turn failed')).toBeInTheDocument();
    expect(screen.queryByText('Response interrupted')).toBeNull();
  });

  it('shows no marker at all while the turn is still streaming', () => {
    render(
      <MessageBubble
        message={baseMessage({
          role: 'assistant',
          content: 'writing',
          failureReason: 'boom',
          isStreaming: true,
        })}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

    expect(screen.queryByText('This turn failed')).toBeNull();
  });

  it('renders a markdown link inside the expanded failure reason as a clickable, new-tab anchor', () => {
    const { container } = render(
      <MessageBubble
        message={baseMessage({
          role: 'assistant',
          content: '',
          failureReason:
            'Your organization is out of credits. [Add credits](https://example.com/billing) to continue.',
        })}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

    fireEvent.click(screen.getByText('Show reason'));
    // Regex, not an exact string: EuiLink appends its own "External link" icon aria-label and
    // "(opens in a new tab or window)" screen-reader text onto the accessible name whenever
    // target="_blank".
    const link = screen.getByRole('link', { name: /Add credits/ });
    expect(link).toHaveAttribute('href', 'https://example.com/billing');
    // Must open in a new tab, never navigate the dashboard tab itself away.
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(container.textContent).toContain(
      'Your organization is out of credits.',
    );
  });

  it('strips raw HTML from the expanded failure reason instead of rendering it live', () => {
    const { container } = render(
      <MessageBubble
        message={baseMessage({
          role: 'assistant',
          content: '',
          failureReason:
            'Upstream said: <img src=x onerror=alert(1)> and <script>alert(2)</script> too.',
        })}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

    fireEvent.click(screen.getByText('Show reason'));
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(container.innerHTML).not.toContain('onerror');
    expect(container.textContent).toContain('Upstream said:');
  });
});

/**
 * Provider provenance: a conversation can legitimately span several providers, and without a stamp
 * every answer presents as though one anonymous "AI" produced all of them.
 */
describe('MessageBubble — provider provenance', () => {
  it('names the provider and model that produced an assistant answer', () => {
    render(
      <MessageBubble
        message={baseMessage({
          role: 'assistant',
          content: 'Six today.',
          providerId: 'p1',
          providerName: 'Claude test',
          providerModel: 'claude-sonnet-4',
        })}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

    expect(
      screen.getByText('Claude test · claude-sonnet-4'),
    ).toBeInTheDocument();
  });

  it('falls back to the provider name alone when no model was stamped', () => {
    render(
      <MessageBubble
        message={baseMessage({
          role: 'assistant',
          content: 'Six today.',
          providerId: 'p1',
          providerName: 'Claude test',
        })}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

    expect(screen.getByText('Claude test')).toBeInTheDocument();
  });

  it('renders nothing for a turn saved before the stamp existed, and never on a user turn', () => {
    const { container: assistantContainer } = render(
      <MessageBubble
        message={baseMessage({ role: 'assistant', content: 'Six today.' })}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );
    expect(
      assistantContainer.querySelector(
        '[data-test-subj="wzMsgProviderProvenance"]',
      ),
    ).toBeNull();

    const { container: userContainer } = render(
      <MessageBubble
        message={baseMessage({
          role: 'user',
          content: 'How many?',
          providerName: 'Claude test',
        })}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );
    expect(
      userContainer.querySelector('[data-test-subj="wzMsgProviderProvenance"]'),
    ).toBeNull();
  });
});
