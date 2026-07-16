import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { EndpointSecuritySection } from './endpoint-security-section';
import {
  useFIMOverview,
  useMalwareOverview,
  useSCAOverview,
} from '../services/use-overview-data';
import { useInViewport } from '../../../hooks';

jest.mock('../services/use-overview-data', () => ({
  useSCAOverview: jest.fn(),
  useFIMOverview: jest.fn(),
  useMalwareOverview: jest.fn(),
}));
jest.mock('../services/navigation', () => ({
  goToConfigurationAssessment: jest.fn(),
  goToFileIntegrityMonitoring: jest.fn(),
  goToMalwareDetection: jest.fn(),
}));
jest.mock('../../../hooks', () => ({
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
  asMock(useMalwareOverview).mockReturnValue({
    status: 'available',
    data: { iocMatches: 0, iocFeedByType: [{ key: 'Domains', count: 92700 }] },
  });
  asMock(useInViewport).mockReturnValue([{ current: null }, true]);
});

describe('EndpointSecuritySection', () => {
  it('renders Configuration Assessment, File Integrity Monitoring, and Malware Detection', () => {
    render(<EndpointSecuritySection />);
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
    const { container } = render(<EndpointSecuritySection />);
    expect(
      container.querySelector('[data-test-subj="home-overview-sca"]'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('File Integrity Monitoring')).toBeInTheDocument();
  });

  it('hides Malware Detection when its findings search is unavailable', () => {
    asMock(useMalwareOverview).mockReturnValue({ status: 'unavailable' });
    const { container } = render(<EndpointSecuritySection />);
    expect(
      container.querySelector(
        '[data-test-subj="home-overview-malware-detection"]',
      ),
    ).not.toBeInTheDocument();
  });

  it('fetches lazily once the section enters the viewport', () => {
    asMock(useInViewport).mockReturnValue([{ current: null }, false]);
    render(<EndpointSecuritySection />);
    expect(asMock(useSCAOverview)).toHaveBeenCalledWith(false);
    expect(asMock(useFIMOverview)).toHaveBeenCalledWith(false);
    expect(asMock(useMalwareOverview)).toHaveBeenCalledWith(false);
  });
});
