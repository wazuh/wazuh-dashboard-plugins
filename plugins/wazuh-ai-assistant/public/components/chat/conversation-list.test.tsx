import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConversationList } from './conversation-list';
import { ConversationSummary } from '../../../common/types';

function conversation(
  overrides: Partial<ConversationSummary> = {},
): ConversationSummary {
  return {
    id: 'c1',
    title: 'How many critical alerts today?',
    updatedAt: '2024-01-01T09:55:00.000Z',
    ...overrides,
  };
}

function noop() {}

describe('ConversationList', () => {
  it('shows the empty-state message when there are no conversations', () => {
    render(
      <ConversationList
        conversations={[]}
        isLoading={false}
        activeConversationId={null}
        onSelect={noop}
        onNewConversation={noop}
        onDelete={noop}
      />,
    );

    expect(screen.getByText('No saved conversations yet.')).toBeInTheDocument();
  });

  it('renders one row per conversation, with its title and a relative updated-at time', () => {
    jest.spyOn(Date, 'now').mockReturnValue(
      Date.parse('2024-01-01T10:00:00.000Z'), // exactly 5 minutes after updatedAt
    );

    render(
      <ConversationList
        conversations={[conversation()]}
        isLoading={false}
        activeConversationId={null}
        onSelect={noop}
        onNewConversation={noop}
        onDelete={noop}
      />,
    );

    expect(
      screen.getByText('How many critical alerts today?'),
    ).toBeInTheDocument();
    // Compact stamp (design: `17h`, `Mon`) — the rail spends this on every row, and the long
    // form was eating the width the title needs.
    expect(screen.getByText('5m')).toBeInTheDocument();

    jest.restoreAllMocks();
  });

  it('shows a loading spinner only while isLoading is true', () => {
    const { container: loadingContainer } = render(
      <ConversationList
        conversations={[]}
        isLoading
        activeConversationId={null}
        onSelect={noop}
        onNewConversation={noop}
        onDelete={noop}
      />,
    );
    expect(loadingContainer.querySelector('.euiLoadingSpinner')).not.toBeNull();

    const { container: idleContainer } = render(
      <ConversationList
        conversations={[]}
        isLoading={false}
        activeConversationId={null}
        onSelect={noop}
        onNewConversation={noop}
        onDelete={noop}
      />,
    );
    expect(idleContainer.querySelector('.euiLoadingSpinner')).toBeNull();
  });

  it('calls onNewConversation when "New conversation" is clicked', () => {
    const onNewConversation = jest.fn();
    render(
      <ConversationList
        conversations={[]}
        isLoading={false}
        activeConversationId={null}
        onSelect={noop}
        onNewConversation={onNewConversation}
        onDelete={noop}
      />,
    );

    fireEvent.click(screen.getByText('New conversation'));
    expect(onNewConversation).toHaveBeenCalledTimes(1);
  });

  it('calls onSelect with the conversation id when a row is clicked', () => {
    const onSelect = jest.fn();
    render(
      <ConversationList
        conversations={[conversation({ id: 'c42' })]}
        isLoading={false}
        activeConversationId={null}
        onSelect={onSelect}
        onNewConversation={noop}
        onDelete={noop}
      />,
    );

    const row = screen
      .getByText('How many critical alerts today?')
      .closest('[role="button"]') as HTMLElement;
    fireEvent.click(row);
    expect(onSelect).toHaveBeenCalledWith('c42');
  });

  it('calls onSelect on Enter/Space when a row has keyboard focus', () => {
    const onSelect = jest.fn();
    render(
      <ConversationList
        conversations={[conversation({ id: 'c42' })]}
        isLoading={false}
        activeConversationId={null}
        onSelect={onSelect}
        onNewConversation={noop}
        onDelete={noop}
      />,
    );

    const row = screen
      .getByText('How many critical alerts today?')
      .closest('[role="button"]') as HTMLElement;
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('c42');

    fireEvent.keyDown(row, { key: ' ' });
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('renders the active conversation title bold, unlike the others', () => {
    render(
      <ConversationList
        conversations={[
          conversation({ id: 'active', title: 'Active one' }),
          conversation({ id: 'other', title: 'Other one' }),
        ]}
        isLoading={false}
        activeConversationId='active'
        onSelect={noop}
        onNewConversation={noop}
        onDelete={noop}
      />,
    );

    expect(screen.getByText('Active one').style.fontWeight).toBe('600');
    expect(screen.getByText('Other one').style.fontWeight).toBe('');
  });

  describe('search filters the rail (client-side, over the conversations already loaded)', () => {
    it('shows only conversations whose title matches the search term, case-insensitively', () => {
      render(
        <ConversationList
          conversations={[
            conversation({ id: 'c1', title: 'Critical findings today' }),
            conversation({ id: 'c2', title: 'Disconnected agents' }),
          ]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );

      fireEvent.change(screen.getByPlaceholderText('Search conversations'), {
        target: { value: 'critical' },
      });

      expect(screen.getByText('Critical findings today')).toBeInTheDocument();
      expect(screen.queryByText('Disconnected agents')).toBeNull();
    });

    it('shows a distinct "no matches" message, not the "no conversations at all" one, when a search matches nothing', () => {
      render(
        <ConversationList
          conversations={[conversation({ title: 'Critical findings today' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );

      fireEvent.change(screen.getByPlaceholderText('Search conversations'), {
        target: { value: 'nothing matches this' },
      });

      expect(
        screen.getByText('No conversations match your search.'),
      ).toBeInTheDocument();
      expect(screen.queryByText('No saved conversations yet.')).toBeNull();
    });

    it('restores every conversation once the search term is cleared', () => {
      render(
        <ConversationList
          conversations={[
            conversation({ id: 'c1', title: 'Critical findings today' }),
            conversation({ id: 'c2', title: 'Disconnected agents' }),
          ]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );

      const searchField = screen.getByPlaceholderText('Search conversations');
      fireEvent.change(searchField, { target: { value: 'critical' } });
      expect(screen.queryByText('Disconnected agents')).toBeNull();

      fireEvent.change(searchField, { target: { value: '' } });
      expect(screen.getByText('Disconnected agents')).toBeInTheDocument();
    });
  });

  describe('date grouping (TODAY / YESTERDAY boundary)', () => {
    // Pinned "now": 2024-01-02, 10:00 UTC. `jest.spyOn(Date, 'now')` is what conversation-list.tsx
    // reads via `new Date(Date.now())` for its bucketing "now" — see that call site's own comment
    // for why a bare `new Date()` would NOT be reliably mockable here. Bucketing is by LOCAL
    // calendar day (see `startOfLocalDay`), so this suite assumes a test runner clock at or near
    // UTC — true of this repo's documented Docker dev/test container (docker/osd-dev) — and every
    // instant below is chosen mid-day UTC specifically to stay clear of a local-midnight boundary
    // for any realistic runner timezone.
    const NOW_ISO = '2024-01-02T10:00:00.000Z';

    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(Date.parse(NOW_ISO));
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('buckets a conversation updated earlier the SAME calendar day under "Today"', () => {
      render(
        <ConversationList
          conversations={[
            conversation({
              id: 'c1',
              title: 'Same-day one',
              updatedAt: '2024-01-02T01:00:00.000Z',
            }),
          ]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );

      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.queryByText('Yesterday')).toBeNull();
    });

    it('buckets a conversation updated moments before local midnight under "Yesterday", not "Today", even though under 24h separates them', () => {
      render(
        <ConversationList
          conversations={[
            conversation({
              id: 'c1',
              title: 'Late last night',
              // 23:50 the calendar day before NOW_ISO — under 10 hours before "now", but a
              // different CALENDAR day, which is what must decide the bucket.
              updatedAt: '2024-01-01T23:50:00.000Z',
            }),
          ]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );

      expect(screen.getByText('Yesterday')).toBeInTheDocument();
      expect(screen.queryByText('Today')).toBeNull();
    });

    it('splits Today and Yesterday conversations into two separate, correctly-labelled groups', () => {
      render(
        <ConversationList
          conversations={[
            conversation({
              id: 'c1',
              title: 'From today',
              updatedAt: '2024-01-02T09:00:00.000Z',
            }),
            conversation({
              id: 'c2',
              title: 'From yesterday',
              updatedAt: '2024-01-01T09:00:00.000Z',
            }),
          ]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );

      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Yesterday')).toBeInTheDocument();
      expect(screen.getByText('From today')).toBeInTheDocument();
      expect(screen.getByText('From yesterday')).toBeInTheDocument();
    });

    it('buckets a conversation from 8+ days ago under a formatted date, not a weekday name', () => {
      render(
        <ConversationList
          conversations={[
            conversation({
              id: 'c1',
              title: 'From last month',
              updatedAt: '2023-12-01T09:00:00.000Z',
            }),
          ]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );

      expect(screen.getByText('From last month')).toBeInTheDocument();
      expect(screen.queryByText('Today')).toBeNull();
      expect(screen.queryByText('Yesterday')).toBeNull();
      // Formatted month/day, not a bare weekday name like "Friday" — the >= 7-day-old branch.
      expect(screen.getByText(/Dec 1/)).toBeInTheDocument();
    });
  });

  describe('displayMode', () => {
    it('defaults to the full expanded rail when displayMode is omitted', () => {
      render(
        <ConversationList
          conversations={[]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );
      expect(
        screen.getByPlaceholderText('Search conversations'),
      ).toBeInTheDocument();
    });

    it('renders a 48px icon-only strip in "collapsed" mode, with no search field or rows', () => {
      render(
        <ConversationList
          conversations={[conversation({ title: 'Should not render' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          displayMode='collapsed'
        />,
      );

      expect(screen.queryByPlaceholderText('Search conversations')).toBeNull();
      expect(screen.queryByText('Should not render')).toBeNull();
      expect(
        screen.getByRole('button', { name: 'New conversation' }),
      ).toBeInTheDocument();
    });

    it("calls onExpand when the collapsed strip's search or expand icon is clicked", () => {
      const onExpand = jest.fn();
      render(
        <ConversationList
          conversations={[]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          displayMode='collapsed'
          onExpand={onExpand}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Search conversations' }),
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'Expand conversation list' }),
      );
      expect(onExpand).toHaveBeenCalledTimes(2);
    });

    it('calls onCollapse when the pinned "Collapse" control is clicked in expanded mode', () => {
      const onCollapse = jest.fn();
      render(
        <ConversationList
          conversations={[]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          displayMode='expanded'
          onCollapse={onCollapse}
        />,
      );

      fireEvent.click(screen.getByText('Collapse'));
      expect(onCollapse).toHaveBeenCalledTimes(1);
    });

    it('renders the same full list content in "flyout" mode as in "expanded", without mounting its own EuiFlyout', () => {
      const { container } = render(
        <ConversationList
          conversations={[conversation({ title: 'Flyout conversation' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
          displayMode='flyout'
        />,
      );

      expect(
        screen.getByPlaceholderText('Search conversations'),
      ).toBeInTheDocument();
      expect(screen.getByText('Flyout conversation')).toBeInTheDocument();
      expect(container.querySelector('.euiFlyout')).toBeNull();
      // The pinned "Collapse" control is an 'expanded'-only affordance — the wrapping page shell
      // owns closing a flyout (its own X button/overlay click), not this component.
      expect(screen.queryByText('Collapse')).toBeNull();
    });
  });

  describe('delete button visibility (WCAG 1.4.11)', () => {
    it('is invisible at rest (opacity 0, never a low-contrast in-between value)', () => {
      render(
        <ConversationList
          conversations={[conversation()]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );

      const deleteButton = screen.getByRole('button', {
        name: 'Delete conversation',
      });
      expect(
        (deleteButton.closest('[style]') as HTMLElement).style.opacity,
      ).toBe('0');
    });

    it('becomes visible on keyboard focus, not just mouse hover', () => {
      render(
        <ConversationList
          conversations={[conversation()]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );

      const deleteButton = screen.getByRole('button', {
        name: 'Delete conversation',
      });
      fireEvent.focus(deleteButton);
      expect(
        (deleteButton.closest('[style]') as HTMLElement).style.opacity,
      ).toBe('1');

      fireEvent.blur(deleteButton);
      expect(
        (deleteButton.closest('[style]') as HTMLElement).style.opacity,
      ).toBe('0');
    });
  });

  describe('delete flow', () => {
    it('clicking the trash icon opens a confirm modal without triggering onSelect', () => {
      const onSelect = jest.fn();
      render(
        <ConversationList
          conversations={[conversation({ title: 'Delete me' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={onSelect}
          onNewConversation={noop}
          onDelete={noop}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Delete conversation' }),
      );

      expect(onSelect).not.toHaveBeenCalled();
      expect(
        screen.getByText(
          'This will permanently delete the conversation "Delete me". This action cannot be undone.',
        ),
      ).toBeInTheDocument();
    });

    it('Cancel closes the modal without calling onDelete', () => {
      const onDelete = jest.fn();
      render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Delete me' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={onDelete}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Delete conversation' }),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onDelete).not.toHaveBeenCalled();
      expect(screen.queryByText(/permanently delete/)).toBeNull();
    });

    it('confirming the modal calls onDelete with the conversation id and closes the modal', () => {
      const onDelete = jest.fn();
      render(
        <ConversationList
          conversations={[conversation({ id: 'c1', title: 'Delete me' })]}
          isLoading={false}
          activeConversationId={null}
          onSelect={noop}
          onNewConversation={noop}
          onDelete={onDelete}
        />,
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Delete conversation' }),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      expect(onDelete).toHaveBeenCalledWith('c1');
      expect(screen.queryByText(/permanently delete/)).toBeNull();
    });
  });
});
