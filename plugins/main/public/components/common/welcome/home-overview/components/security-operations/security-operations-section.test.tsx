import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { SecurityOperationsSection } from './security-operations-section';
import {
  useActiveResponseOverview,
  useItHygieneOperatingSystemsCount,
  useItHygienePackagesCount,
  useItHygieneServicesCount,
  useItHygieneUsersCount,
  useTopNetworkServices,
  useTopOperatingSystems,
} from '../../hooks/use-overview-data';
import { useInViewport } from '../../../../hooks';
import * as navigation from '../../utils/navigation';

jest.mock('../../hooks/use-overview-data', () => ({
  useItHygieneOperatingSystemsCount: jest.fn(),
  useItHygienePackagesCount: jest.fn(),
  useItHygieneUsersCount: jest.fn(),
  useItHygieneServicesCount: jest.fn(),
  useActiveResponseOverview: jest.fn(),
  useTopOperatingSystems: jest.fn(),
  useTopNetworkServices: jest.fn(),
}));
jest.mock('../../utils/navigation', () => ({
  getItHygieneUrl: jest.fn(() => '#it-hygiene'),
  getItHygieneSystemOsUrl: jest.fn(() => '#it-hygiene-os'),
  getActiveResponseUrl: jest.fn(),
  getActiveResponseResponsesUrl: jest.fn(() => '#active-response-responses'),
  getRegulatoryComplianceUrl: jest.fn(),
  getRegulatoryComplianceUrlHome: jest.fn(),
}));
jest.mock('../../../../hooks', () => ({
  useInViewport: jest.fn(() => [{ current: null }, true]),
}));
const asMock = (fn: unknown) => fn as jest.Mock;
const complianceControls = { status: 'loading' } as const;

beforeEach(() => {
  jest.clearAllMocks();
  asMock(useItHygieneOperatingSystemsCount).mockReturnValue({
    status: 'available',
    data: 12,
  });
  asMock(useItHygienePackagesCount).mockReturnValue({
    status: 'available',
    data: 35682,
  });
  asMock(useItHygieneUsersCount).mockReturnValue({
    status: 'available',
    data: 48,
  });
  asMock(useItHygieneServicesCount).mockReturnValue({
    status: 'available',
    data: 320,
  });
  asMock(useActiveResponseOverview).mockReturnValue({
    status: 'available',
    data: 7,
  });
  asMock(useTopOperatingSystems).mockReturnValue({
    status: 'available',
    data: [{ key: 'Ubuntu 24.04.2 LTS', count: 2 }],
    indexPatternId: 'idx-os',
  });
  asMock(useTopNetworkServices).mockReturnValue({
    status: 'available',
    data: [{ key: 'svchost.exe', count: 13 }],
  });
  asMock(useInViewport).mockReturnValue([{ current: null }, true]);
});

describe('SecurityOperationsSection', () => {
  it('renders IT Hygiene, Incident Response, and Regulatory Compliance', () => {
    const { container } = render(
      <SecurityOperationsSection complianceControls={complianceControls} />,
    );
    const itHygienePanel = container.querySelector(
      '[data-test-subj="home-overview-it-hygiene"]',
    ) as HTMLElement;
    expect(within(itHygienePanel).getByText('IT Hygiene')).toBeInTheDocument();
    expect(screen.getByText('Incident Response')).toBeInTheDocument();
    expect(screen.getByText('Regulatory Compliance')).toBeInTheDocument();
    expect(screen.getByText('Operating systems')).toBeInTheDocument();
    expect(screen.getByText('35,682')).toBeInTheDocument();
    expect(
      screen.getByText('Actions triggered, last 24 hours'),
    ).toBeInTheDocument();
    expect(screen.getByText('PCI DSS')).toBeInTheDocument();
  });

  it('renders the Top 5 operating systems and network services cards below the existing three', () => {
    render(
      <SecurityOperationsSection complianceControls={complianceControls} />,
    );
    expect(screen.getByText('Top 5 operating systems')).toBeInTheDocument();
    expect(screen.getByText('Top 5 network services')).toBeInTheDocument();
    expect(screen.getByText('Ubuntu 24.04.2 LTS')).toBeInTheDocument();
    expect(screen.getAllByText('svchost.exe').length).toBeGreaterThan(0);
  });

  it('links each Top 5 operating systems label to IT Hygiene filtered by that OS', () => {
    render(
      <SecurityOperationsSection complianceControls={complianceControls} />,
    );
    fireEvent.click(screen.getByText('Ubuntu 24.04.2 LTS'));
    expect(navigation.getItHygieneSystemOsUrl).toHaveBeenCalledWith(
      'Ubuntu 24.04.2 LTS',
      'idx-os',
    );
  });

  it('links the Incident Response KPI to the Responses tab', () => {
    const { container } = render(
      <SecurityOperationsSection complianceControls={complianceControls} />,
    );
    const link = container.querySelector(
      '[data-test-subj="active-response-stat-link"]',
    ) as HTMLElement;
    fireEvent.click(link);
    expect(navigation.getActiveResponseResponsesUrl).toHaveBeenCalled();
  });

  it('keeps the IT Hygiene panel (never hidden) even when every tile is unavailable', () => {
    asMock(useItHygieneOperatingSystemsCount).mockReturnValue({
      status: 'unavailable',
    });
    asMock(useItHygienePackagesCount).mockReturnValue({
      status: 'unavailable',
    });
    asMock(useItHygieneUsersCount).mockReturnValue({ status: 'unavailable' });
    asMock(useItHygieneServicesCount).mockReturnValue({
      status: 'unavailable',
    });
    const { container } = render(
      <SecurityOperationsSection complianceControls={complianceControls} />,
    );
    expect(
      container.querySelector('[data-test-subj="home-overview-it-hygiene"]'),
    ).toBeInTheDocument();
    expect(screen.getByText('Incident Response')).toBeInTheDocument();
  });

  it('keeps every IT Hygiene tile; an unavailable one shows "-"', () => {
    asMock(useItHygienePackagesCount).mockReturnValue({
      status: 'unavailable',
    });
    const { container } = render(
      <SecurityOperationsSection complianceControls={complianceControls} />,
    );
    expect(
      container.querySelector('[data-test-subj="home-overview-it-hygiene"]'),
    ).toBeInTheDocument();
    const packages = container.querySelector(
      '[data-test-subj="it-hygiene-tile-packages"]',
    );
    expect(packages).toBeInTheDocument();
    expect(packages?.textContent).toContain('-');
  });

  it('keeps Incident Response (never hidden) when its index is unavailable', () => {
    asMock(useActiveResponseOverview).mockReturnValue({
      status: 'unavailable',
    });
    const { container } = render(
      <SecurityOperationsSection complianceControls={complianceControls} />,
    );
    expect(
      container.querySelector(
        '[data-test-subj="home-overview-active-response"]',
      ),
    ).toBeInTheDocument();
  });

  it('navigates to IT Hygiene from the panel title', () => {
    const { container } = render(
      <SecurityOperationsSection complianceControls={complianceControls} />,
    );
    const itHygienePanel = container.querySelector(
      '[data-test-subj="home-overview-it-hygiene"]',
    ) as HTMLElement;
    fireEvent.click(within(itHygienePanel).getByText('IT Hygiene'));
    expect(navigation.getItHygieneUrl).toHaveBeenCalled();
  });

  it('fetches lazily once the section enters the viewport', () => {
    asMock(useInViewport).mockReturnValue([{ current: null }, false]);
    render(
      <SecurityOperationsSection complianceControls={complianceControls} />,
    );
    expect(asMock(useItHygieneOperatingSystemsCount)).toHaveBeenCalledWith(
      false,
    );
    expect(asMock(useActiveResponseOverview)).toHaveBeenCalledWith(false);
    expect(asMock(useTopOperatingSystems)).toHaveBeenCalledWith(false);
    expect(asMock(useTopNetworkServices)).toHaveBeenCalledWith(false);
  });
});
