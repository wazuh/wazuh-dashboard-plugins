import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ScaBenchmarksTable } from './sca-benchmarks-table';

describe('ScaBenchmarksTable', () => {
  it('shows a specific empty prompt instead of the OUI default when there are no benchmarks', () => {
    render(<ScaBenchmarksTable items={[]} />);
    expect(screen.getAllByText('No SCA benchmarks found').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Check your agents. SCA configuration/).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText('No items found')).not.toBeInTheDocument();
  });
});
