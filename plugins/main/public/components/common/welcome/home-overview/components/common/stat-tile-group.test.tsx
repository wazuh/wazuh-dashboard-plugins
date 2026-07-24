import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { StatTileGroup, StatTileSpec } from './stat-tile-group';
import { DataGroupResult } from '../../interfaces/data-group';

type Key = 'packages';

const TILES: ReadonlyArray<StatTileSpec<Key>> = [
  { key: 'packages', label: 'Packages', testSubj: 'packages-tile' },
];

describe('StatTileGroup', () => {
  it('shows the classified message as a warning (not danger) tooltip for a permission-denied error', () => {
    const results: Record<Key, DataGroupResult<number | undefined>> = {
      packages: {
        status: 'error',
        error: { kind: 'permission-denied', message: 'No permission' },
      },
    };
    const { container } = render(
      <StatTileGroup tiles={TILES} results={results} />,
    );
    expect(screen.getByText('-')).toBeInTheDocument();
    const icon = container.querySelector('[data-euiicon-type="alert"]');
    expect(icon).toBeInTheDocument();
    expect(icon?.getAttribute('color')).toBe('warning');
  });

  it('falls back to a generic per-tile message on error when unclassified', () => {
    const results: Record<Key, DataGroupResult<number | undefined>> = {
      packages: { status: 'error' },
    };
    const { container } = render(
      <StatTileGroup tiles={TILES} results={results} />,
    );
    expect(screen.getByText('-')).toBeInTheDocument();
    const icon = container.querySelector('[data-euiicon-type="alert"]');
    expect(icon?.getAttribute('color')).toBe('danger');
  });

  it('shows the classified message on unavailable, without danger styling', () => {
    const results: Record<Key, DataGroupResult<number | undefined>> = {
      packages: {
        status: 'unavailable',
        error: { kind: 'index-pattern-missing', message: 'Index pattern not found' },
      },
    };
    const { container } = render(
      <StatTileGroup tiles={TILES} results={results} />,
    );
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(
      container.querySelector('[data-euiicon-type="alert"]'),
    ).not.toBeInTheDocument();
  });

  it('renders the value when available', () => {
    const results: Record<Key, DataGroupResult<number | undefined>> = {
      packages: { status: 'available', data: 42 },
    };
    render(<StatTileGroup tiles={TILES} results={results} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});
