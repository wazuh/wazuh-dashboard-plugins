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
    expect(screen.getByText('5 minutes ago')).toBeInTheDocument();

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
