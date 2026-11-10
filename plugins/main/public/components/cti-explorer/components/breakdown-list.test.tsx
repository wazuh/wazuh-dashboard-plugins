import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BreakdownList } from './breakdown-list';

describe('BreakdownList', () => {
  it('shows each row with its count and share of the total', () => {
    render(
      <BreakdownList
        buckets={[
          { key: 'high', count: 300 },
          { key: 'low', count: 100 },
        ]}
        total={400}
        getLabel={key => key.toUpperCase()}
      />,
    );
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('75.0%')).toBeInTheDocument();
    expect(screen.getByText('25.0%')).toBeInTheDocument();
  });

  it('colors each bar as asked', () => {
    render(
      <BreakdownList
        buckets={[{ key: 'critical', count: 1 }]}
        total={1}
        getColor={() => '#BD271E'}
      />,
    );
    expect(screen.getByRole('progressbar')).toHaveStyle({
      color: '#BD271E',
    });
  });
});
