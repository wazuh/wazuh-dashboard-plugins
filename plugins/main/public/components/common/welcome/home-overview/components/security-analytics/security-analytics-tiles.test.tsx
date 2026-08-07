import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { SecurityAnalyticsTiles } from './security-analytics-tiles';
import {
  getDecodersUrl,
  getDetectorsUrl,
  getFiltersUrl,
  getIntegrationsUrl,
  getKvdbsUrl,
  getRulesUrl,
} from '../../utils/navigation';

jest.mock('../../utils/navigation', () => ({
  getRulesUrl: jest.fn(),
  getDecodersUrl: jest.fn(),
  getDetectorsUrl: jest.fn(),
  getIntegrationsUrl: jest.fn(),
  getKvdbsUrl: jest.fn(),
  getFiltersUrl: jest.fn(),
}));
const available = (value: number) => ({
  status: 'available' as const,
  data: value,
});

const allAvailable = {
  rules: available(482),
  decoders: available(128),
  detectors: available(9),
  integrations: available(14),
  kvdbs: available(6),
  filters: available(3),
};

describe('SecurityAnalyticsTiles', () => {
  it('navigates to Rules/Decoders/Detectors/Integrations/KVDBs/Filters on click', () => {
    render(<SecurityAnalyticsTiles {...allAvailable} />);
    fireEvent.click(screen.getByText('Rules'));
    expect(getRulesUrl).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Decoders'));
    expect(getDecodersUrl).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Detectors'));
    expect(getDetectorsUrl).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Integrations'));
    expect(getIntegrationsUrl).toHaveBeenCalled();
    fireEvent.click(screen.getByText('KVDBs'));
    expect(getKvdbsUrl).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Filters'));
    expect(getFiltersUrl).toHaveBeenCalled();
  });

  it('keeps every tile (never hidden); an absent dependency shows "-"', () => {
    const { container } = render(
      <SecurityAnalyticsTiles
        {...allAvailable}
        kvdbs={{ status: 'unavailable' }}
      />,
    );
    const kvdbs = container.querySelector(
      '[data-test-subj="security-analytics-tile-kvdbs"]',
    );
    expect(kvdbs).toBeInTheDocument();
    expect(kvdbs?.textContent).toContain('-');
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('shows "-" for a failed tile (never hidden), no per-tile callout', () => {
    const { container } = render(
      <SecurityAnalyticsTiles
        {...allAvailable}
        filters={{ status: 'error' }}
      />,
    );
    expect(
      container.querySelectorAll('[data-test-subj="widget-group-error"]')
        .length,
    ).toBe(0);
    const filters = container.querySelector(
      '[data-test-subj="security-analytics-tile-filters"]',
    );
    expect(filters).toBeInTheDocument();
    expect(filters?.textContent).toContain('-');
  });
});
