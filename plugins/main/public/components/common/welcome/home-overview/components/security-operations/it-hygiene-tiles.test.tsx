import '@testing-library/jest-dom';
import React from 'react';
import { render } from '@testing-library/react';
import { ItHygieneTiles } from './it-hygiene-tiles';

const available = (value: number) => ({
  status: 'available' as const,
  data: value,
});

describe('ItHygieneTiles', () => {
  it('keeps every tile (never hidden); an unavailable index shows "-"', () => {
    const { container } = render(
      <ItHygieneTiles
        operatingSystems={available(12)}
        packages={{ status: 'unavailable' }}
        users={available(48)}
        services={available(320)}
      />,
    );
    const packages = container.querySelector(
      '[data-test-subj="it-hygiene-tile-packages"]',
    );
    expect(packages).toBeInTheDocument();
    expect(packages?.textContent).toContain('-');
    expect(
      container.querySelector(
        '[data-test-subj="it-hygiene-tile-operating-systems"]',
      ),
    ).toBeInTheDocument();
  });

  it('shows "-" for a failed tile (never a hidden tile), no per-tile callout', () => {
    const { container } = render(
      <ItHygieneTiles
        operatingSystems={available(12)}
        packages={{ status: 'error' }}
        users={available(48)}
        services={available(320)}
      />,
    );
    // Error surfaces via a toast (upstream).
    expect(
      container.querySelectorAll('[data-test-subj="widget-group-error"]')
        .length,
    ).toBe(0);
    const packages = container.querySelector(
      '[data-test-subj="it-hygiene-tile-packages"]',
    );
    expect(packages).toBeInTheDocument();
    expect(packages?.textContent).toContain('-');
  });
});
