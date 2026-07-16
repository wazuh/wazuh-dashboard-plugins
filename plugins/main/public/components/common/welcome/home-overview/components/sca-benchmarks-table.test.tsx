import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ScaBenchmarksTable } from './sca-benchmarks-table';

describe('ScaBenchmarksTable', () => {
  it('renders a row per benchmark with passed/failed/score columns', () => {
    render(
      <ScaBenchmarksTable
        items={[
          {
            name: 'CIS Ubuntu Linux 24.04 LTS v1.0.0',
            passed: 200,
            failed: 79,
            score: 71.68,
          },
        ]}
      />,
    );
    expect(screen.getAllByText('Top 5 benchmarks').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText('CIS Ubuntu Linux 24.04 LTS v1.0.0').length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText('200').length).toBeGreaterThan(0);
    expect(screen.getAllByText('79').length).toBeGreaterThan(0);
    expect(screen.getAllByText('71.68%').length).toBeGreaterThan(0);
  });

  it('shows a specific empty prompt instead of the OUI default when there are no benchmarks', () => {
    render(<ScaBenchmarksTable items={[]} />);
    expect(screen.getAllByText('No SCA benchmarks found').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Check your agents. SCA configuration/).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText('No items found')).not.toBeInTheDocument();
  });
});
