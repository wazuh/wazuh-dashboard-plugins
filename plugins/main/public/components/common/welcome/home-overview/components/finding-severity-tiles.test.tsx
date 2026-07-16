import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { FindingSeverityTiles } from './finding-severity-tiles';

describe('FindingSeverityTiles', () => {
  it('renders a tile per band with its label and comma-formatted count', () => {
    const { container } = render(
      <FindingSeverityTiles
        counts={{ critical: 0, high: 1, medium: 35682, low: 286 }}
      />,
    );

    for (const label of ['Critical', 'High', 'Medium', 'Low']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText('35,682')).toBeInTheDocument();
    expect(screen.getByText('286')).toBeInTheDocument();

    for (const band of ['critical', 'high', 'medium', 'low']) {
      expect(
        container.querySelector(`[data-test-subj="finding-severity-${band}"]`),
      ).toBeInTheDocument();
    }
  });

  it('uses a custom test-subj prefix so two instances can coexist on a page', () => {
    const { container } = render(
      <FindingSeverityTiles
        counts={{ critical: 179, high: 0, medium: 0, low: 0 }}
        testSubjPrefix='vulnerability-severity'
      />,
    );
    expect(
      container.querySelector('[data-test-subj="vulnerability-severity-critical"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-test-subj="finding-severity-critical"]'),
    ).not.toBeInTheDocument();
  });
});
