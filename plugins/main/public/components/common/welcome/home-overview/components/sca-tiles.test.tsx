import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ScaTiles } from './sca-tiles';

describe('ScaTiles', () => {
  it('renders Passed/Failed/N-A/Score with comma-formatted counts', () => {
    render(
      <ScaTiles
        tiles={{ passed: 321, failed: 547, notApplicable: 52, score: 36.98 }}
      />,
    );
    expect(screen.getByText('Passed')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
    expect(screen.getByText('Score')).toBeInTheDocument();
    expect(screen.getByText('321')).toBeInTheDocument();
    expect(screen.getByText('547')).toBeInTheDocument();
    expect(screen.getByText('52')).toBeInTheDocument();
    expect(screen.getByText('36.98%')).toBeInTheDocument();
  });
});
