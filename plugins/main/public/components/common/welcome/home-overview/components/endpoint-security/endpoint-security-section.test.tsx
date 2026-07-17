import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { EndpointSecuritySection } from './endpoint-security-section';
import {
  useFIMOverview,
  useSCAOverview,
} from '../../hooks/use-overview-data';
import { useInViewport } from '../../../../hooks';

jest.mock('../../hooks/use-overview-data', () => ({
  useSCAOverview: jest.fn(),
  useFIMOverview: jest.fn(),
}));
jest.mock('../../utils/navigation', () => ({
  goToConfigurationAssessment: jest.fn(),
  goToFileIntegrityMonitoring: jest.fn(),
  goToMalwareDetection: jest.fn(),
}));
jest.mock('../../../../hooks', () => ({
  useInViewport: jest.fn(() => [{ current: null }, true]),
}));

const asMock = (fn: unknown) => fn as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  asMock(useSCAOverview).mockReturnValue({
    status: 'available',
    data: {
      tiles: { passed: 321, failed: 547, notApplicable: 52, score: 36.98 },
      benchmarks: [
        {
          name: 'CIS Ubuntu Linux 24.04 LTS v1.0.0',
          passed: 200,
          failed: 79,
          score: 71.68,
        },
      ],
    },
  });
  asMock(useFIMOverview).mockReturnValue({
    status: 'available',
    data: { total: 38822, platforms: [{ key: 'Ubuntu', count: 8435 }] },
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
    iocFeedByType: [{ key: 'Domains', count: 92700 }],
  },
};

describe('EndpointSecuritySection', () => {
  it('renders Configuration Assessment, File Integrity Monitoring, and Malware Detection', () => {
    render(<EndpointSecuritySection findings={findingsAvailable} />);
    expect(screen.getByText('Configuration Assessment')).toBeInTheDocument();
    expect(screen.getByText('File Integrity Monitoring')).toBeInTheDocument();
    expect(screen.getByText('Malware Detection')).toBeInTheDocument();
    // "Passed" also appears as a benchmarks-table column header, so scope to the tile.
    expect(
      document.querySelector('[data-test-subj="sca-tile-passed"]'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Ubuntu').length).toBeGreaterThan(0);
    expect(
      screen.getByText('Files & registry objects baselined fleet-wide'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('IOC matches, last 24 hours'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Domains').length).toBeGreaterThan(0);
  });

  it('hides Configuration Assessment when the SCA index is unavailable', () => {
    asMock(useSCAOverview).mockReturnValue({ status: 'unavailable' });
    const { container } = render(
      <EndpointSecuritySection findings={findingsAvailable} />,
    );
    expect(
      container.querySelector('[data-test-subj="home-overview-sca"]'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('File Integrity Monitoring')).toBeInTheDocument();
  });

  it('hides Malware Detection when the shared findings search is unavailable', () => {
    const { container } = render(
      <EndpointSecuritySection findings={{ status: 'unavailable' }} />,
    );
    expect(
      container.querySelector(
        '[data-test-subj="home-overview-malware-detection"]',
      ),
    ).not.toBeInTheDocument();
  });

  it('fetches Configuration Assessment and File Integrity Monitoring lazily once the section enters the viewport', () => {
    asMock(useInViewport).mockReturnValue([{ current: null }, false]);
    render(<EndpointSecuritySection findings={findingsAvailable} />);
    expect(asMock(useSCAOverview)).toHaveBeenCalledWith(false);
    expect(asMock(useFIMOverview)).toHaveBeenCalledWith(false);
  });
});
