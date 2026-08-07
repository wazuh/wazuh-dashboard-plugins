import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { ThreatCatalogTiles } from './threat-catalog-tiles';

describe('ThreatCatalogTiles', () => {
  it('renders the IOCs count inline, with no click handler (reference only)', () => {
    const { container } = render(
      <ThreatCatalogTiles iocs={{ status: 'available', data: 1213 }} />,
    );
    expect(screen.getByText('1,213')).toBeInTheDocument();
    expect(screen.getByText('IOCs')).toBeInTheDocument();
    expect(
      container.querySelector('[data-test-subj="threat-catalog-tile-iocs"] a'),
    ).toBeNull();
  });

  it('shows "-" when the IOCs count is unavailable (never hidden)', () => {
    const { container } = render(
      <ThreatCatalogTiles iocs={{ status: 'unavailable' }} />,
    );
    const iocs = container.querySelector(
      '[data-test-subj="threat-catalog-tile-iocs"]',
    );
    expect(iocs).toBeInTheDocument();
    expect(iocs?.textContent).toContain('-');
  });

  it('shows "-" for a failed search (never hidden), no per-tile callout', () => {
    const { container } = render(
      <ThreatCatalogTiles iocs={{ status: 'error' }} />,
    );
    expect(
      container.querySelectorAll('[data-test-subj="widget-group-error"]')
        .length,
    ).toBe(0);
    const iocs = container.querySelector(
      '[data-test-subj="threat-catalog-tile-iocs"]',
    );
    expect(iocs).toBeInTheDocument();
    expect(iocs?.textContent).toContain('-');
  });
});
