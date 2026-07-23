import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThreatIntelTiles } from './threat-intel-tiles';
import {
  getDecodersUrl,
  getDetectorsUrl,
  getIntegrationsUrl,
  getRulesUrl,
} from '../../utils/navigation';

jest.mock('../../utils/navigation', () => ({
  getRulesUrl: jest.fn(),
  getDecodersUrl: jest.fn(),
  getIntegrationsUrl: jest.fn(),
  getDetectorsUrl: jest.fn(),
}));

const available = (value: number) => ({
  status: 'available' as const,
  data: value,
});

const allAvailable = {
  rules: available(482),
  decoders: available(128),
  iocs: available(2048),
  cvesMatched: available(3521),
  integrations: available(14),
  detectors: available(9),
};

describe('ThreatIntelTiles', () => {
  it('navigates to Rules/Decoders/Integrations/Detectors on click', () => {
    render(<ThreatIntelTiles {...allAvailable} />);
    fireEvent.click(screen.getByText('Rules'));
    expect(getRulesUrl).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Decoders'));
    expect(getDecodersUrl).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Integrations'));
    expect(getIntegrationsUrl).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Detectors'));
    expect(getDetectorsUrl).toHaveBeenCalled();
  });

  it('the IOCs and CVEs matched tiles have no click handler (reference only)', () => {
    const { container } = render(<ThreatIntelTiles {...allAvailable} />);
    for (const testSubj of [
      'threat-intel-tile-iocs',
      'threat-intel-tile-cves-matched',
    ]) {
      const tile = container.querySelector(`[data-test-subj="${testSubj}"]`);
      expect(tile?.tagName.toLowerCase()).not.toBe('button');
    }
  });

  it('keeps every tile (never hidden); an absent dependency shows "-"', () => {
    const { container } = render(
      <ThreatIntelTiles {...allAvailable} rules={{ status: 'unavailable' }} />,
    );
    const rules = container.querySelector(
      '[data-test-subj="threat-intel-tile-rules"]',
    );
    expect(rules).toBeInTheDocument();
    expect(rules?.textContent).toContain('-');
    expect(screen.getByText('Decoders')).toBeInTheDocument();
  });

  it('shows "-" for a failed tile (never hidden), no per-tile callout', () => {
    const { container } = render(
      <ThreatIntelTiles {...allAvailable} decoders={{ status: 'error' }} />,
    );
    // The failure is surfaced by a toast (raised upstream), not a per-tile callout.
    expect(
      container.querySelectorAll('[data-test-subj="widget-group-error"]')
        .length,
    ).toBe(0);
    const decoders = container.querySelector(
      '[data-test-subj="threat-intel-tile-decoders"]',
    );
    expect(decoders).toBeInTheDocument();
    expect(decoders?.textContent).toContain('-');
  });
});
