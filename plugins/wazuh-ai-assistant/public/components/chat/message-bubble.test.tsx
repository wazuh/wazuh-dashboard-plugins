import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageBubble, UiChatMessage } from './message-bubble';
import { TableSpec } from '../../../common/types';

const AI_AVATAR_URL = '/base-path/plugins/wazuhAiAssistant/assets/wazuh.svg';
const noopResolveDiscoverUrl = () => Promise.resolve(null);

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
        aiAvatarUrl={AI_AVATAR_URL}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
      />,
    );

    expect(screen.getByText('How many alerts?')).toBeInTheDocument();
    expect(container.querySelector('[title="You"]')).not.toBeNull();
    // The user bubble never renders the aria-live wrapper (that's assistant-only).
    expect(container.querySelector('[aria-live="polite"]')).toBeNull();
  });

  it('renders a finished (non-streaming) assistant message as real Markdown', () => {
    const { container } = render(
      <MessageBubble
        message={baseMessage({
          role: 'assistant',
          content: 'This is **bold** text',
          isStreaming: false,
        })}
        aiAvatarUrl={AI_AVATAR_URL}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
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
        aiAvatarUrl={AI_AVATAR_URL}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
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
        aiAvatarUrl={AI_AVATAR_URL}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
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
        aiAvatarUrl={AI_AVATAR_URL}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
      />,
    );

    expect(screen.queryByText('Querying Wazuh...')).toBeNull();
    expect(screen.getByText('First token')).toBeInTheDocument();
  });

  it('shows a loading spinner next to the avatar only while isStreaming is true', () => {
    const { container: streamingContainer } = render(
      <MessageBubble
        message={baseMessage({
          role: 'assistant',
          content: 'partial',
          isStreaming: true,
        })}
        aiAvatarUrl={AI_AVATAR_URL}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
      />,
    );
    expect(
      streamingContainer.querySelector('.euiLoadingSpinner'),
    ).not.toBeNull();

    const { container: doneContainer } = render(
      <MessageBubble
        message={baseMessage({
          role: 'assistant',
          content: 'finished',
          isStreaming: false,
        })}
        aiAvatarUrl={AI_AVATAR_URL}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
      />,
    );
    expect(doneContainer.querySelector('.euiLoadingSpinner')).toBeNull();
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
        aiAvatarUrl={AI_AVATAR_URL}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
      />,
    );

    expect(screen.getByText('Results (2 rows)')).toBeInTheDocument();
  });

  it('does not render a table section when message.table is absent', () => {
    const { container } = render(
      <MessageBubble
        message={baseMessage({ role: 'assistant', content: 'no table here' })}
        aiAvatarUrl={AI_AVATAR_URL}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
      />,
    );

    expect(container.querySelector('.euiAccordion')).toBeNull();
  });
});
