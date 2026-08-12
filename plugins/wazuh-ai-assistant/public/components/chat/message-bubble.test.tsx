import React from 'react';
import { render, screen } from '@testing-library/react';
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
  it('renders a user message as plain text, with the "You" avatar', () => {
    const { container } = render(
      <MessageBubble
        message={baseMessage({ role: 'user', content: 'How many alerts?' })}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

    expect(screen.getByText('How many alerts?')).toBeInTheDocument();
    expect(container.querySelector('[title="You"]')).not.toBeNull();
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
    const link = await screen.findByRole('link', { name: 'Open in Discover' });
    expect(link).toHaveAttribute(
      'href',
      'https://example.test/app/data-explorer/discover#?_a=...',
    );
  });

  // Layout contract §5 ("one measure, one gutter"): prose is held to a fixed reading measure;
  // only block content (a result table) is allowed to break out past it, up to $wzTableMaxWidth.
  describe('prose measure vs. table breakout (layout contract §5)', () => {
    it('caps a prose-only assistant answer to the 68ch reading measure', () => {
      render(
        <MessageBubble
          message={baseMessage({ role: 'assistant', content: 'Six today.' })}
          resolveDiscoverUrl={noopResolveDiscoverUrl}
          resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
        />,
      );

      const bubbleItem = screen
        .getByText('Six today.')
        .closest('.euiFlexItem') as HTMLElement;
      expect(bubbleItem.style.maxWidth).toBe('68ch');
    });

    it('lets a table-carrying answer break out past the prose measure, up to 1300px', () => {
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
        .getByText('Results (1 rows)')
        .closest('.euiFlexItem') as HTMLElement;
      expect(bubbleItem.style.maxWidth).toBe('min(100%, 1300px)');
      expect(bubbleItem.style.maxWidth).not.toBe('68ch');
    });
  });

  // Provenance moves UP into the result card's header once a table exists (layout contract §4):
  // the below-bubble chip disappears for that turn, and the card receives the same data instead.
  describe('provenance handoff to the result card header', () => {
    it('does not render a below-bubble chip for a turn whose tool call produced a table', () => {
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
            toolCalls: [
              { id: 't1', name: 'get_critical_findings', arguments: {} },
            ],
          })}
          resolveDiscoverUrl={noopResolveDiscoverUrl}
          resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
        />,
      );

      // The chip still exists — just inside the result card's header, not below the bubble.
      // Label includes the default 90-day window, same as describeToolCall (tool-call-label.ts)
      // has always produced for a call with no explicit time_range_gte/lte.
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

      expect(screen.getByText('Critical findings · 90d')).toBeInTheDocument();
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
