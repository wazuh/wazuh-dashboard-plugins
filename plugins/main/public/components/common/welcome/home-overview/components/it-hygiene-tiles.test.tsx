import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ItHygieneTiles } from './it-hygiene-tiles';

const available = (value: number) => ({ status: 'available' as const, data: value });

describe('ItHygieneTiles', () => {
  it('renders a tile per group with its label and comma-formatted count', () => {
    render(
      <ItHygieneTiles
        operatingSystems={available(12)}
        packages={available(35682)}
        users={available(48)}
        services={available(320)}
      />,
    );
    expect(screen.getByText('Operating systems')).toBeInTheDocument();
    expect(screen.getByText('Packages')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('35,682')).toBeInTheDocument();
  });

  it('hides only the tile whose index is unavailable, keeping the others', () => {
    const { container } = render(
      <ItHygieneTiles
        operatingSystems={available(12)}
        packages={{ status: 'unavailable' }}
        users={available(48)}
        services={available(320)}
      />,
    );
    expect(
      container.querySelector(
        '[data-test-subj="it-hygiene-tile-packages"]',
      ),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector(
        '[data-test-subj="it-hygiene-tile-operating-systems"]',
      ),
    ).toBeInTheDocument();
  });

  it('shows a contained error for a failed tile, distinct from hidden', () => {
    const { container } = render(
      <ItHygieneTiles
        operatingSystems={available(12)}
        packages={{ status: 'error' }}
        users={available(48)}
        services={available(320)}
      />,
    );
    expect(
      container.querySelectorAll('[data-test-subj="widget-group-error"]')
        .length,
    ).toBe(1);
  });
});
