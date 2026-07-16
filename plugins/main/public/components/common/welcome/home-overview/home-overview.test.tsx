import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Stub the section so the shell test doesn't pull the data-access seam.
jest.mock('./components/overview-section', () => ({
  OverviewSection: () => <div data-testid='overview-section' />,
}));

import { HomeOverview } from './home-overview';

describe('HomeOverview shell', () => {
  it('renders the header, a Refresh control, and the OVERVIEW section', () => {
    const { container } = render(<HomeOverview />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(
      container.querySelector('[data-test-subj="home-overview-refresh"]'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('overview-section')).toBeInTheDocument();
  });

  it('keeps rendering after Refresh is clicked (token bump does not throw)', () => {
    render(<HomeOverview />);
    fireEvent.click(screen.getByText('Refresh'));
    expect(screen.getByTestId('overview-section')).toBeInTheDocument();
  });
});
