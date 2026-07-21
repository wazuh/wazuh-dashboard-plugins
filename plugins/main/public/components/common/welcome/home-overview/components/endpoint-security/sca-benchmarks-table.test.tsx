import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
jest.mock('../../../utils/helpers', () => ({
  decimalFormat: () => ({
    convert: (value: number) => `${Math.round(value * 100)}%`,
  }),
}));
import { ScaBenchmarksTable } from './sca-benchmarks-table';

describe('ScaBenchmarksTable', () => {
  it('shows the plain empty message (normalized with the other tables) when there are no benchmarks', () => {
    render(<ScaBenchmarksTable items={[]} />);
    expect(
      screen.getAllByText('No SCA benchmarks found').length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText('No items found')).not.toBeInTheDocument();
  });
});
