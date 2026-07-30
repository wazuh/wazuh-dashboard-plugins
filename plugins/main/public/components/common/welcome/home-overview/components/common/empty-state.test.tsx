import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('renders the given message', () => {
    render(<EmptyState message='No data found' data-test-subj='empty' />);
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('reserves the given minHeight so it stays visually balanced next to a populated sibling', () => {
    const { container } = render(
      <EmptyState
        message='No data found'
        minHeight={110}
        data-test-subj='empty'
      />,
    );
    const wrapper = container.querySelector(
      '[data-test-subj="empty"]',
    ) as HTMLElement;
    expect(wrapper.style.minHeight).toBe('110px');
  });
});
