import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
jest.mock('../../../utils/helpers', () => ({
  decimalFormat: () => ({
    convert: (value: number) => `${Math.round(value * 100)}%`,
  }),
}));
import { DualBarList } from './dual-bar-list';

const items = [
  {
    key: 'CIS Ubuntu Linux Benchmark',
    label: 'CIS Ubuntu Linux Benchmark',
    passed: 200,
    failed: 79,
    score: 200 / 279,
  },
];

describe('DualBarList', () => {
  it('renders the label and the formatted score per row', () => {
    render(<DualBarList items={items} />);
    expect(screen.getByText('CIS Ubuntu Linux Benchmark')).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
  });

  it('renders the title caption when provided', () => {
    render(<DualBarList items={items} title='Top 5 benchmarks' />);
    expect(screen.getByText('Top 5 benchmarks')).toBeInTheDocument();
  });

  it('renders the empty message instead of a blank list when items is empty', () => {
    render(<DualBarList items={[]} emptyMessage='No SCA benchmarks found' />);
    expect(screen.getByText('No SCA benchmarks found')).toBeInTheDocument();
  });
});
