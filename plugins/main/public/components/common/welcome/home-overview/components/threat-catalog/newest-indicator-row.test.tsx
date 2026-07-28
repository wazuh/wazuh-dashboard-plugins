import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { NewestIndicatorRow } from './newest-indicator-row';

describe('NewestIndicatorRow', () => {
  it('renders nothing when there is no newest indicator (empty catalog)', () => {
    const { container } = render(<NewestIndicatorRow />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the feed name and the days-ago label', () => {
    const lastSeen = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    render(
      <NewestIndicatorRow
        newestIndicator={{ feedName: 'threat-fox', lastSeen }}
      />,
    );
    expect(screen.getByText('Newest indicator')).toBeInTheDocument();
    expect(screen.getByText('Feed: threat-fox')).toBeInTheDocument();
    expect(screen.getByText('1 day ago')).toBeInTheDocument();
  });

  it('pluralizes for more than one day', () => {
    const lastSeen = new Date(
      Date.now() - 25 * 24 * 60 * 60 * 1000,
    ).toISOString();
    render(<NewestIndicatorRow newestIndicator={{ lastSeen }} />);
    expect(screen.getByText('25 days ago')).toBeInTheDocument();
  });

  it('omits the feed sub-label when feedName is absent', () => {
    render(
      <NewestIndicatorRow
        newestIndicator={{ lastSeen: new Date().toISOString() }}
      />,
    );
    expect(screen.queryByText(/^Feed:/)).not.toBeInTheDocument();
  });
});
