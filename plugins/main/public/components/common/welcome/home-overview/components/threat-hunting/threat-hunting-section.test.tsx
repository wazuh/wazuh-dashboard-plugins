import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { ThreatHuntingSection } from './threat-hunting-section';
import * as navigation from '../../utils/navigation';

jest.mock('../../utils/navigation', () => ({
  getThreatHuntingUrl: jest.fn(),
  getMitreUrl: jest.fn(),
  getMitreTechniqueUrl: jest.fn(),
  getVulnerabilityDetectionUrl: jest.fn(),
}));
const findingsAvailable = {
  status: 'available' as const,
  data: {
    severity: { critical: 0, high: 0, medium: 0, low: 0 },
    topTactics: [],
    totalFindings: 40614,
    topRules: [{ key: 'Wazuh IT Hygiene – Item modified', count: 3899 }],
    techniquesCount: 7,
    topTechniques: [
      { key: 'Exploit Public-Facing Application', count: 35378, id: 'T1190' },
    ],
    iocMatches: 0,
  },
  indexPatternId: 'idx-1',
};

const vulnerabilitiesAvailable = {
  status: 'available' as const,
  data: {
    severity: { critical: 179, high: 5456, medium: 31517, low: 1980 },
    byOs: [{ key: 'Red Hat Enterprise Linux 9.5', count: 29685 }],
    cvesMatched: 3521,
  },
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ThreatHuntingSection', () => {
  it('renders Threat Hunting, MITRE ATT&CK, and Vulnerability Detection panels', () => {
    render(
      <ThreatHuntingSection
        findings={findingsAvailable}
        vulnerabilities={vulnerabilitiesAvailable}
      />,
    );
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

  it('keeps Vulnerability Detection when the search is unavailable', () => {
    const { container } = render(
      <ThreatHuntingSection
        findings={findingsAvailable}
        vulnerabilities={{ status: 'unavailable' }}
      />,
    );
    expect(
      container.querySelector(
        '[data-test-subj="home-overview-vulnerabilities"]',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Threat Hunting')).toBeInTheDocument();
  });

  it('shows a contained error for Threat Hunting / MITRE when the shared findings search fails', () => {
    const { container } = render(
      <ThreatHuntingSection
        findings={{ status: 'error' }}
        vulnerabilities={vulnerabilitiesAvailable}
      />,
    );
    expect(
      container.querySelectorAll('[data-test-subj="widget-group-error"]')
        .length,
    ).toBeGreaterThan(0);
  });

  it('navigates to Threat Hunting from the panel title', () => {
    render(
      <ThreatHuntingSection
        findings={findingsAvailable}
        vulnerabilities={vulnerabilitiesAvailable}
      />,
    );
    fireEvent.click(screen.getByText('Threat Hunting'));
    expect(navigation.getThreatHuntingUrl).toHaveBeenCalled();
  });
});
