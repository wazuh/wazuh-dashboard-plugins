import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SecurityOperationsSection } from './security-operations-section';
import {
  useActiveResponseOverview,
  useItHygieneOperatingSystemsCount,
  useItHygienePackagesCount,
  useItHygieneServicesCount,
  useItHygieneUsersCount,
} from '../../hooks/use-overview-data';
import { useInViewport } from '../../../../hooks';
import * as navigation from '../../utils/navigation';

jest.mock('../../hooks/use-overview-data', () => ({
  useItHygieneOperatingSystemsCount: jest.fn(),
  useItHygienePackagesCount: jest.fn(),
  useItHygieneUsersCount: jest.fn(),
  useItHygieneServicesCount: jest.fn(),
  useActiveResponseOverview: jest.fn(),
}));
jest.mock('../../utils/navigation', () => ({
  goToItHygiene: jest.fn(),
  goToActiveResponse: jest.fn(),
  goToRegulatoryCompliance: jest.fn(),
  goToRegulatoryComplianceHome: jest.fn(),
}));
jest.mock('../../../../hooks', () => ({
  useInViewport: jest.fn(() => [{ current: null }, true]),
}));

const asMock = (fn: unknown) => fn as jest.Mock;

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
  asMock(useInViewport).mockReturnValue([{ current: null }, true]);
});

describe('SecurityOperationsSection', () => {
  it('renders IT Hygiene, Active Response, and Regulatory Compliance', () => {
    render(<SecurityOperationsSection />);
    expect(screen.getByText('IT Hygiene')).toBeInTheDocument();
    expect(screen.getByText('Active Response')).toBeInTheDocument();
    expect(screen.getByText('Regulatory Compliance')).toBeInTheDocument();
    expect(screen.getByText('Operating systems')).toBeInTheDocument();
    expect(screen.getByText('35,682')).toBeInTheDocument();
    expect(
      screen.getByText('Actions triggered, last 24 hours'),
    ).toBeInTheDocument();
    expect(screen.getByText('PCI DSS')).toBeInTheDocument();
  });

  it('hides the whole IT Hygiene panel only when every tile is unavailable', () => {
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
    const { container } = render(<SecurityOperationsSection />);
    expect(
      container.querySelector('[data-test-subj="home-overview-it-hygiene"]'),
    ).not.toBeInTheDocument();
    // sibling panels are unaffected
    expect(screen.getByText('Active Response')).toBeInTheDocument();
  });

  it('keeps the IT Hygiene panel when only some tiles are unavailable', () => {
    asMock(useItHygienePackagesCount).mockReturnValue({
      status: 'unavailable',
    });
    const { container } = render(<SecurityOperationsSection />);
    expect(
      container.querySelector('[data-test-subj="home-overview-it-hygiene"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-test-subj="it-hygiene-tile-packages"]'),
    ).not.toBeInTheDocument();
  });

  it('hides Active Response when its index is unavailable', () => {
    asMock(useActiveResponseOverview).mockReturnValue({
      status: 'unavailable',
    });
    const { container } = render(<SecurityOperationsSection />);
    expect(
      container.querySelector(
        '[data-test-subj="home-overview-active-response"]',
      ),
    ).not.toBeInTheDocument();
  });

  it('navigates to IT Hygiene from the panel title', () => {
    render(<SecurityOperationsSection />);
    fireEvent.click(screen.getByText('IT Hygiene'));
    expect(navigation.goToItHygiene).toHaveBeenCalled();
  });

  it('fetches lazily once the section enters the viewport', () => {
    asMock(useInViewport).mockReturnValue([{ current: null }, false]);
    render(<SecurityOperationsSection />);
    expect(asMock(useItHygieneOperatingSystemsCount)).toHaveBeenCalledWith(
      false,
    );
    expect(asMock(useActiveResponseOverview)).toHaveBeenCalledWith(false);
  });
});
