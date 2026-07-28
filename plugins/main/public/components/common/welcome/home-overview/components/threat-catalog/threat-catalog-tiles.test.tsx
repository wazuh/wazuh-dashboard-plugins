import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { ThreatCatalogTiles } from './threat-catalog-tiles';

const available = (value: number) => ({
  status: 'available' as const,
  data: value,
});

const allAvailable = {
  iocs: available(2048),
  cvesMatched: available(3521),
};

describe('ThreatCatalogTiles', () => {
  it('renders the IOCs and CVEs matched tiles with no click handler (reference only)', () => {
    const { container } = render(<ThreatCatalogTiles {...allAvailable} />);
    expect(screen.getByText('IOCs')).toBeInTheDocument();
    expect(screen.getByText('CVEs matched')).toBeInTheDocument();
    for (const testSubj of [
      'threat-catalog-tile-iocs',
      'threat-catalog-tile-cves-matched',
    ]) {
      const tile = container.querySelector(`[data-test-subj="${testSubj}"]`);
      expect(tile?.tagName.toLowerCase()).not.toBe('button');
    }
  });

  it('keeps every tile (never hidden); an absent dependency shows "-"', () => {
    const { container } = render(
      <ThreatCatalogTiles {...allAvailable} iocs={{ status: 'unavailable' }} />,
    );
    const iocs = container.querySelector(
      '[data-test-subj="threat-catalog-tile-iocs"]',
    );
    expect(iocs).toBeInTheDocument();
    expect(iocs?.textContent).toContain('-');
    expect(screen.getByText('CVEs matched')).toBeInTheDocument();
  });

  it('shows "-" for a failed tile (never hidden), no per-tile callout', () => {
    const { container } = render(
      <ThreatCatalogTiles {...allAvailable} cvesMatched={{ status: 'error' }} />,
    );
    expect(
      container.querySelectorAll('[data-test-subj="widget-group-error"]')
        .length,
    ).toBe(0);
    const cvesMatched = container.querySelector(
      '[data-test-subj="threat-catalog-tile-cves-matched"]',
    );
    expect(cvesMatched).toBeInTheDocument();
    expect(cvesMatched?.textContent).toContain('-');
  });
});
