import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThreatIntelTiles } from './threat-intel-tiles';
import {
  goToDecoders,
  goToDetectors,
  goToIntegrations,
  goToRules,
} from '../../utils/navigation';

jest.mock('../../utils/navigation', () => ({
  goToRules: jest.fn(),
  goToDecoders: jest.fn(),
  goToIntegrations: jest.fn(),
  goToDetectors: jest.fn(),
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
    expect(goToRules).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Decoders'));
    expect(goToDecoders).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Integrations'));
    expect(goToIntegrations).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Detectors'));
    expect(goToDetectors).toHaveBeenCalled();
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

  it('hides only the tile whose Security Analytics dependency is absent', () => {
    const { container } = render(
      <ThreatIntelTiles {...allAvailable} rules={{ status: 'unavailable' }} />,
    );
    expect(
      container.querySelector('[data-test-subj="threat-intel-tile-rules"]'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Decoders')).toBeInTheDocument();
  });

  it('shows a contained error for a failed tile, distinct from hidden', () => {
    const { container } = render(
      <ThreatIntelTiles {...allAvailable} decoders={{ status: 'error' }} />,
    );
    expect(
      container.querySelectorAll('[data-test-subj="widget-group-error"]')
        .length,
    ).toBe(1);
  });
});
