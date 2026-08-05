import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { SeverityDistributionBar } from './severity-distribution-bar';

describe('SeverityDistributionBar', () => {
  it('renders one legend entry per band present in counts', () => {
    render(
      <SeverityDistributionBar
        counts={{ critical: 18, high: 361, medium: 705, low: 129 }}
        testSubjPrefix='vulnerability-severity'
      />,
    );
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('361')).toBeInTheDocument();
    // Bands absent from counts (e.g. Informational/Pending) aren't rendered.
    expect(screen.queryByText('Informational')).not.toBeInTheDocument();
  });

  it('links each band through onSelect when provided', () => {
    render(
      <SeverityDistributionBar
        counts={{ critical: 18, high: 0 }}
        onSelect={band => `#/discover?band=${band}`}
      />,
    );
    const link = screen.getByText('Critical').closest('a');
    expect(link).toHaveAttribute('href', '#/discover?band=critical');
  });

  it('renders the empty message when no bands are present', () => {
    render(
      <SeverityDistributionBar counts={{}} emptyMessage='No data available' />,
    );
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });
});
