import '@testing-library/jest-dom';
import React from 'react';
import { render } from '@testing-library/react';
import { FindingSeverityTiles } from './finding-severity-tiles';

describe('FindingSeverityTiles', () => {
  it('uses a custom test-subj prefix so two instances can coexist on a page', () => {
    const { container } = render(
      <FindingSeverityTiles
        counts={{ critical: 179, high: 0, medium: 0, low: 0 }}
        testSubjPrefix='vulnerability-severity'
      />,
    );
    expect(
      container.querySelector(
        '[data-test-subj="vulnerability-severity-critical"]',
      ),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-test-subj="finding-severity-critical"]'),
    ).not.toBeInTheDocument();
  });
});
