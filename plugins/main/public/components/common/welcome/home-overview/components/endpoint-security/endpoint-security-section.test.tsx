import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { EndpointSecuritySection } from './endpoint-security-section';
import { useFIMOverview, useSCAOverview } from '../../hooks/use-overview-data';
import { useInViewport } from '../../../../hooks';

jest.mock('../../hooks/use-overview-data', () => ({
  useSCAOverview: jest.fn(),
  useFIMOverview: jest.fn(),
}));
jest.mock('../../utils/navigation', () => ({
  getConfigurationAssessmentUrl: jest.fn(),
  getFileIntegrityMonitoringUrl: jest.fn(),
  getMalwareDetectionUrl: jest.fn(),
}));
jest.mock('../../../../hooks', () => ({
  useInViewport: jest.fn(() => [{ current: null }, true]),
}));
jest.mock('../../../utils/helpers', () => ({
  decimalFormat: () => ({
    convert: (value: number) => `${Math.round(value * 100)}%`,
  }),
}));
const asMock = (fn: unknown) => fn as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  asMock(useSCAOverview).mockReturnValue({
    status: 'available',
    data: {
      tiles: { passed: 321, failed: 547, notApplicable: 52, score: 0.3698 },
      benchmarks: [
        {
          name: 'CIS Ubuntu Linux 24.04 LTS v1.0.0',
          passed: 200,
          failed: 79,
          score: 0.7168,
        },
      ],
    },
  });
  asMock(useFIMOverview).mockReturnValue({
    status: 'available',
    data: { total: 38822, files: [{ key: '/etc/passwd', count: 8435 }] },
  });
  asMock(useInViewport).mockReturnValue([{ current: null }, true]);
});

const findingsAvailable = {
  status: 'available' as const,
  data: {
    severity: { critical: 0, high: 0, medium: 0, low: 0 },
    topTactics: [],
    totalFindings: 0,
    topRules: [],
    techniquesCount: 0,
    topTechniques: [],
    iocMatches: 0,
    cloudSecurityByModule: {},
  },
};

const threatIntelAvailable = {
  status: 'available' as const,
  data: {
    total: 2048,
    feedByType: [{ key: 'Domains', count: 92700 }],
    byThreatType: [],
  },
};

describe('EndpointSecuritySection', () => {
  it('renders Configuration Assessment, File Integrity Monitoring, and Malware Detection', () => {
    render(
      <EndpointSecuritySection
        findings={findingsAvailable}
        threatIntel={threatIntelAvailable}
      />,
    );
    expect(screen.getByText('Configuration Assessment')).toBeInTheDocument();
    expect(screen.getByText('File Integrity Monitoring')).toBeInTheDocument();
    expect(screen.getByText('Malware Detection')).toBeInTheDocument();
    expect(
      document.querySelector('[data-test-subj="sca-tile-passed"]'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('CIS Ubuntu Linux 24.04 LTS v1.0.0'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('/etc/passwd').length).toBeGreaterThan(0);
    expect(
      screen.getByText('Files & registry objects baselined fleet-wide'),
    ).toBeInTheDocument();
    expect(screen.getByText('IOC matches')).toBeInTheDocument();
    expect(screen.getAllByText('Domains').length).toBeGreaterThan(0);
  });

  it('still renders Configuration Assessment when the SCA index is unavailable', () => {
    asMock(useSCAOverview).mockReturnValue({ status: 'unavailable' });
    const { container } = render(
      <EndpointSecuritySection
        findings={findingsAvailable}
        threatIntel={threatIntelAvailable}
      />,
    );
    expect(
      container.querySelector('[data-test-subj="home-overview-sca"]'),
    ).toBeInTheDocument();
    expect(screen.getByText('File Integrity Monitoring')).toBeInTheDocument();
  });

  it('still renders Malware Detection when the findings-backed hero is unavailable', () => {
    const { container } = render(
      <EndpointSecuritySection
        findings={{ status: 'unavailable' }}
        threatIntel={threatIntelAvailable}
      />,
    );
    expect(
      container.querySelector(
        '[data-test-subj="home-overview-malware-detection"]',
      ),
    ).toBeInTheDocument();
  });

  it('fetches Configuration Assessment and File Integrity Monitoring lazily once the section enters the viewport', () => {
    asMock(useInViewport).mockReturnValue([{ current: null }, false]);
    render(
      <EndpointSecuritySection
        findings={findingsAvailable}
        threatIntel={threatIntelAvailable}
      />,
    );
    expect(asMock(useSCAOverview)).toHaveBeenCalledWith(false);
    expect(asMock(useFIMOverview)).toHaveBeenCalledWith(false);
  });
});
