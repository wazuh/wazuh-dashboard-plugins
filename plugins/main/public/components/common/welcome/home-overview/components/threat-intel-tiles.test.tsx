import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThreatIntelTiles } from './threat-intel-tiles';
import {
  goToDecoders,
  goToDetectors,
  goToIntegrations,
  goToRules,
} from '../services/navigation';

jest.mock('../services/navigation', () => ({
  goToRules: jest.fn(),
  goToDecoders: jest.fn(),
  goToIntegrations: jest.fn(),
  goToDetectors: jest.fn(),
}));

const available = (value: number) => ({ status: 'available' as const, data: value });

const allAvailable = {
  rules: available(482),
  decoders: available(128),
  integrations: available(14),
  detectors: available(9),
  cvesMatched: available(3521),
};

describe('ThreatIntelTiles', () => {
  it('renders all five tiles with their labels and comma-formatted counts', () => {
    render(<ThreatIntelTiles {...allAvailable} />);
    for (const label of ['Rules', 'Decoders', 'Integrations', 'Detectors', 'CVEs matched']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText('482')).toBeInTheDocument();
    expect(screen.getByText('3,521')).toBeInTheDocument();
  });

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

  it('the CVEs matched tile has no click handler (informational only)', () => {
    const { container } = render(<ThreatIntelTiles {...allAvailable} />);
    const cvesTile = container.querySelector(
      '[data-test-subj="threat-intel-tile-cves-matched"]',
    );
    expect(cvesTile?.tagName.toLowerCase()).not.toBe('button');
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
