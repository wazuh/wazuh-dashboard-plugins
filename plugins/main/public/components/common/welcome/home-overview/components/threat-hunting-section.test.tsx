import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThreatHuntingSection } from './threat-hunting-section';
import { useVulnerabilityOverview } from '../services/use-overview-data';
import { useInViewport } from '../../../hooks';
import * as navigation from '../services/navigation';

jest.mock('../services/use-overview-data', () => ({
  useVulnerabilityOverview: jest.fn(),
}));
jest.mock('../services/navigation', () => ({
  goToThreatHunting: jest.fn(),
  goToMitre: jest.fn(),
  goToMitreTechnique: jest.fn(),
  goToVulnerabilityDetection: jest.fn(),
}));
jest.mock('../../../hooks', () => ({
  useInViewport: jest.fn(() => [{ current: null }, true]),
}));

const asMock = (fn: unknown) => fn as jest.Mock;

const findingsAvailable = {
  status: 'available' as const,
  data: {
    severity: { critical: 0, high: 0, medium: 0, low: 0 },
    topTactics: [],
    totalFindings: 40614,
    topRules: [{ key: 'Wazuh IT Hygiene – Item modified', count: 3899 }],
    techniquesCount: 7,
    topTechniques: [
      { key: 'Exploit Public-Facing Application', count: 35378 },
    ],
  },
  indexPatternId: 'idx-1',
};

beforeEach(() => {
  jest.clearAllMocks();
  asMock(useVulnerabilityOverview).mockReturnValue({
    status: 'available',
    data: {
      severity: { critical: 179, high: 5456, medium: 31517, low: 1980 },
      byOs: [{ key: 'Red Hat Enterprise Linux 9.5', count: 29685 }],
    },
  });
  asMock(useInViewport).mockReturnValue([{ current: null }, true]);
});

describe('ThreatHuntingSection', () => {
  it('renders Threat Hunting, MITRE ATT&CK, and Vulnerability Detection panels', () => {
    render(<ThreatHuntingSection findings={findingsAvailable} />);
    expect(screen.getByText('Threat Hunting')).toBeInTheDocument();
    expect(screen.getByText('MITRE ATT&CK')).toBeInTheDocument();
    expect(screen.getByText('Vulnerability Detection')).toBeInTheDocument();
    expect(screen.getByText('40,614')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(
      screen.getAllByText('Exploit Public-Facing Application').length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText('Red Hat Enterprise Linux 9.5').length,
    ).toBeGreaterThan(0);
  });

  it('hides Vulnerability Detection when the vulnerabilities index is unavailable', () => {
    asMock(useVulnerabilityOverview).mockReturnValue({
      status: 'unavailable',
    });
    const { container } = render(
      <ThreatHuntingSection findings={findingsAvailable} />,
    );
    expect(
      container.querySelector('[data-test-subj="home-overview-vulnerabilities"]'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Threat Hunting')).toBeInTheDocument();
  });

  it('shows a contained error for Threat Hunting / MITRE when the shared findings search fails', () => {
    const { container } = render(
      <ThreatHuntingSection findings={{ status: 'error' }} />,
    );
    expect(
      container.querySelectorAll('[data-test-subj="widget-group-error"]')
        .length,
    ).toBeGreaterThan(0);
  });

  it('navigates to Threat Hunting from the panel title', () => {
    render(<ThreatHuntingSection findings={findingsAvailable} />);
    fireEvent.click(screen.getByText('Threat Hunting'));
    expect(navigation.goToThreatHunting).toHaveBeenCalled();
  });

  it('navigates to the selected MITRE technique with the findings index pattern', () => {
    render(<ThreatHuntingSection findings={findingsAvailable} />);
    fireEvent.click(
      screen.getAllByText('Exploit Public-Facing Application')[0],
    );
    expect(navigation.goToMitreTechnique).toHaveBeenCalledWith(
      'Exploit Public-Facing Application',
      'idx-1',
    );
  });

  it('fetches Vulnerability Detection lazily once the section enters the viewport', () => {
    asMock(useInViewport).mockReturnValue([{ current: null }, false]);
    render(<ThreatHuntingSection findings={findingsAvailable} />);
    expect(asMock(useVulnerabilityOverview)).toHaveBeenCalledWith(false);
  });
});
