import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { ActionList, ActionListItem } from './action-list';

const item = (key: string): ActionListItem => ({
  key,
  label: `Rule ${key}`,
  href: `#${key}`,
  dot: { color: 'red', label: 'Critical' },
  end: <span>{`${key} details`}</span>,
});

const bySubj = (container: HTMLElement, subj: string) =>
  container.querySelectorAll(`[data-test-subj="${subj}"]`);

const renderList = (items: ActionListItem[]) =>
  render(
    <ActionList
      title='Needs a response'
      titleTooltip='What the list holds'
      titleNote='· 2 more'
      action={<button>Create</button>}
      items={items}
      slots={3}
      emptyMessage='Nothing to do'
      data-test-subj='list'
    />,
  );

describe('ActionList', () => {
  it('renders the header, and each row with its link and details', () => {
    renderList([item('a'), item('b'), item('c')]);
    expect(screen.getByText('Needs a response')).toBeInTheDocument();
    expect(screen.getByText('· 2 more')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Rule a').closest('a')).toHaveAttribute(
      'href',
      '#a',
    );
    expect(screen.getByText('c details')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Critical')).toHaveLength(3);
    expect(screen.queryByText('No more items to display')).toBeNull();
  });

  it('shows no more rows than its slots', () => {
    const { container } = renderList([
      item('a'),
      item('b'),
      item('c'),
      item('d'),
    ]);
    expect(bySubj(container, 'list-row')).toHaveLength(3);
    expect(screen.queryByText('Rule d')).toBeNull();
  });

  it('keeps the height of the empty slots when half of them are empty', () => {
    renderList([item('a')]);
    expect(screen.getByText('No more items to display')).toBeInTheDocument();
  });

  it('adds no note when less than half of the slots are empty', () => {
    renderList([item('a'), item('b')]);
    expect(screen.queryByText('No more items to display')).toBeNull();
  });

  it('shows the empty state when there is nothing to act on', () => {
    const { container } = renderList([]);
    expect(bySubj(container, 'list-empty')[0]).toHaveTextContent(
      'Nothing to do',
    );
    expect(bySubj(container, 'list-row')).toHaveLength(0);
  });
});
