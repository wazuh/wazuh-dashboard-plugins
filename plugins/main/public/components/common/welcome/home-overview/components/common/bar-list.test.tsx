import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { BarList } from './bar-list';
import { HOME_OVERVIEW_COLOR } from '../../lib/theme-colors';

const items = [
  { key: 'Initial Access', count: 36231 },
  { key: 'Discovery', count: 3899 },
];

describe('BarList', () => {
  it('calls onSelect with the item when a row is clicked', () => {
    const onSelect = jest.fn();
    render(<BarList items={items} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Initial Access'));
    expect(onSelect).toHaveBeenCalledWith(items[0]);
  });

  it('renders row labels as links when getHref is provided', () => {
    render(<BarList items={items} getHref={item => `#/mitre/${item.key}`} />);
    const link = screen.getByText('Discovery').closest('a');
    expect(link).toHaveAttribute('href', '#/mitre/Discovery');
  });

  it('renders the empty message instead of a blank list when items is empty', () => {
    const { container } = render(
      <BarList
        items={[]}
        emptyMessage='No tactics observed'
        data-test-subj='bar-list'
      />,
    );
    expect(screen.getByText('No tactics observed')).toBeInTheDocument();
    expect(container.querySelector('.euiProgress')).not.toBeInTheDocument();
  });

  it('renders the title caption above the list when provided', () => {
    render(<BarList items={items} title='Top 5 modified files' />);
    expect(screen.getByText('Top 5 modified files')).toBeInTheDocument();
  });

  it('defaults the bar color to a theme-aware CSS custom property, not a frozen hex', () => {
    const { container } = render(<BarList items={items} />);
    const progress = container.querySelector('progress');
    expect(progress).toHaveStyle({ color: HOME_OVERVIEW_COLOR.info });
  });
});
