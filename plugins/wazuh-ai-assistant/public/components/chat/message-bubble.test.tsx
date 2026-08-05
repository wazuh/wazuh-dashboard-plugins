import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageBubble, UiChatMessage } from './message-bubble';
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
      Promise.resolve('https://example.test/app/data-explorer/discover#?_a=...');

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
