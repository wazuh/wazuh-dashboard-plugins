import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageList } from './message-list';
import { UiChatMessage } from './message-bubble';
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

// Layout contract §5 ("one measure, one gutter"): each transcript row now centres itself
// independently via `.wzMessageRow`/`.wzMessageRow--wide` (chat-page.scss) instead of the whole
// list sharing `.wzContentMeasure`'s 1060px column. A table-bearing row still gets the `--wide`
// marker so it fills that content column to its right edge with the results card (bounded by the
// composer's own column, $wzContentMaxWidth — the owner's iteration-4 call), while a prose row
// caps its text at 68ch inside the same measure.
describe('MessageList — per-row measure (layout contract §5)', () => {
  it('gives a prose-only turn the shared (non-wide) row measure', () => {
    const { container } = render(
      <MessageList
        messages={[
          baseMessage({ id: 'm1', role: 'assistant', content: 'Six today.' }),
        ]}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

    const row = screen.getByText('Six today.').closest('.wzMessageRow');
    expect(row).not.toBeNull();
    expect(row).not.toHaveClass('wzMessageRow--wide');
    // Sanity: exactly one row rendered for one message.
    expect(container.querySelectorAll('.wzMessageRow')).toHaveLength(1);
  });

  it('marks a table-carrying turn with the wide-row class so its card fills the content column', () => {
    const table: TableSpec = {
      columns: [{ id: 'agent', label: 'Agent' }],
      rows: [{ agent: 'web-01' }],
    };
    render(
      <MessageList
        messages={[
          baseMessage({
            id: 'm1',
            role: 'assistant',
            content: 'Here are the results:',
            table,
          }),
        ]}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

    const row = screen.getByText('Results (1 rows)').closest('.wzMessageRow');
    expect(row).not.toBeNull();
    expect(row).toHaveClass('wzMessageRow--wide');
  });

  it('keeps each turn in its own row, not sharing one wide row across the whole conversation', () => {
    const table: TableSpec = {
      columns: [{ id: 'agent', label: 'Agent' }],
      rows: [{ agent: 'web-01' }],
    };
    render(
      <MessageList
        messages={[
          baseMessage({ id: 'm1', role: 'user', content: 'Any agents down?' }),
          baseMessage({
            id: 'm2',
            role: 'assistant',
            content: 'Here are the results:',
            table,
          }),
        ]}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

    const userRow = screen
      .getByText('Any agents down?')
      .closest('.wzMessageRow');
    const tableRow = screen
      .getByText('Results (1 rows)')
      .closest('.wzMessageRow');
    expect(userRow).not.toHaveClass('wzMessageRow--wide');
    expect(tableRow).toHaveClass('wzMessageRow--wide');
    expect(userRow).not.toBe(tableRow);
  });

  it('keeps the normal row measure for a zero-row table, matching its suppressed rendering', () => {
    const table: TableSpec = {
      columns: [{ id: 'agent', label: 'Agent' }],
      rows: [],
    };
    const { container } = render(
      <MessageList
        messages={[
          baseMessage({
            id: 'm1',
            role: 'assistant',
            content: 'No matching agents in that window.',
            table,
          }),
        ]}
        resolveDiscoverUrl={noopResolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={noopResolveSecurityAnalyticsUrl}
      />,
    );

    // The bubble suppresses the 0-row table (message-bubble.tsx renderedTable), so the row
    // must not take the wide-row marker around what is now prose-only content.
    const row = container.querySelector('.wzMessageRow');
    expect(row).not.toBeNull();
    expect(row).not.toHaveClass('wzMessageRow--wide');
  });
});
