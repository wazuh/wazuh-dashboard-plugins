import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { ItHygieneTiles } from './it-hygiene-tiles';
import {
  getItHygieneServicesTabUrl,
  getItHygieneSoftwareUrl,
  getItHygieneSystemOsUrl,
  getItHygieneUsersTabUrl,
} from '../../utils/navigation';

jest.mock('../../utils/navigation', () => ({
  getItHygieneSystemOsUrl: jest.fn(),
  getItHygieneSoftwareUrl: jest.fn(),
  getItHygieneUsersTabUrl: jest.fn(),
  getItHygieneServicesTabUrl: jest.fn(),
}));

const available = (value: number) => ({
  status: 'available' as const,
  data: value,
});

const allAvailable = {
  operatingSystems: available(12),
  packages: available(35682),
  users: available(48),
  services: available(320),
};

describe('ItHygieneTiles', () => {
  it('navigates to each tab on click', () => {
    render(<ItHygieneTiles {...allAvailable} />);
    fireEvent.click(screen.getByText('Operating systems'));
    expect(getItHygieneSystemOsUrl).toHaveBeenCalledWith();
    fireEvent.click(screen.getByText('Packages'));
    expect(getItHygieneSoftwareUrl).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Users'));
    expect(getItHygieneUsersTabUrl).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Services'));
    expect(getItHygieneServicesTabUrl).toHaveBeenCalled();
  });

  it('keeps every tile (never hidden); an unavailable index shows "-"', () => {
    const { container } = render(
      <ItHygieneTiles
        operatingSystems={available(12)}
        packages={{ status: 'unavailable' }}
        users={available(48)}
        services={available(320)}
      />,
    );
    const packages = container.querySelector(
      '[data-test-subj="it-hygiene-tile-packages"]',
    );
    expect(packages).toBeInTheDocument();
    expect(packages?.textContent).toContain('-');
    expect(
      container.querySelector(
        '[data-test-subj="it-hygiene-tile-operating-systems"]',
      ),
    ).toBeInTheDocument();
  });

  it('shows "-" for a failed tile (never a hidden tile), no per-tile callout', () => {
    const { container } = render(
      <ItHygieneTiles
        operatingSystems={available(12)}
        packages={{ status: 'error' }}
        users={available(48)}
        services={available(320)}
      />,
    );
    // Error surfaces via a toast (upstream)
    expect(
      container.querySelectorAll('[data-test-subj="widget-group-error"]')
        .length,
    ).toBe(0);
    const packages = container.querySelector(
      '[data-test-subj="it-hygiene-tile-packages"]',
    );
    expect(packages).toBeInTheDocument();
    expect(packages?.textContent).toContain('-');
  });

  it('marks a failed tile with a persistent danger indicator, distinct from an unavailable one', () => {
    const { container } = render(
      <ItHygieneTiles
        operatingSystems={available(12)}
        packages={{ status: 'error' }}
        users={{ status: 'unavailable' }}
        services={available(320)}
      />,
    );
    const packages = container.querySelector(
      '[data-test-subj="it-hygiene-tile-packages"]',
    );
    const users = container.querySelector(
      '[data-test-subj="it-hygiene-tile-users"]',
    );
    expect(
      packages?.querySelector('[data-euiicon-type="alert"]'),
    ).toBeInTheDocument();
    expect(
      users?.querySelector('[data-euiicon-type="alert"]'),
    ).not.toBeInTheDocument();
  });
});
