import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

// Stub the sections and the shared findings hook so the shell test doesn't
// pull the data-access seam.
jest.mock('./components/overview', () => ({
  OverviewSection: () => <div data-test-subj='overview-section' />,
}));
jest.mock('./components/endpoint-security', () => ({
  EndpointSecuritySection: jest.fn(() => (
    <div data-test-subj='endpoint-security-section' />
  )),
}));
jest.mock('./components/threat-hunting', () => ({
  ThreatHuntingSection: () => <div data-test-subj='threat-hunting-section' />,
}));
jest.mock('./components/security-operations', () => ({
  SecurityOperationsSection: () => (
    <div data-test-subj='security-operations-section' />
  ),
}));
jest.mock('./components/cloud-security', () => ({
  CloudSecuritySection: () => <div data-test-subj='cloud-security-section' />,
}));
jest.mock('./components/threat-intel-feed', () => ({
  ThreatIntelligenceFeedSection: () => (
    <div data-test-subj='threat-intelligence-feed-section' />
  ),
}));
jest.mock('./hooks/use-overview-data', () => ({
  useAgentStatus: jest.fn(() => ({ status: 'loading' })),
  useFindingsOverview: jest.fn(() => ({ status: 'loading' })),
  useFindingsBreakdowns: jest.fn(() => ({ status: 'loading' })),
  useVulnerabilityOverview: jest.fn(() => ({
    status: 'available',
    data: {
      severity: { critical: 0, high: 0, medium: 0, low: 0 },
      byPackage: [],
    },
  })),
  useThreatIntelEnrichments: jest.fn(() => ({
    status: 'available',
    data: { total: 0, feedByType: [], byThreatType: [] },
  })),
}));
jest.mock('../../hooks', () => ({
  useInViewport: jest.fn(() => [{ current: null }, true]),
}));
jest.mock('../../hocs', () => ({
  withGlobalBreadcrumb: () => (Component: React.FC) => Component,
  withErrorBoundary: (Component: React.FC) => Component,
}));

import { HomeOverview } from './home-overview';
import { EndpointSecuritySection } from './components/endpoint-security';
import { useAgentStatus } from './hooks/use-overview-data';

const asMock = (fn: unknown) => fn as jest.Mock;
const lastNoAgents = () =>
  asMock(EndpointSecuritySection).mock.calls.at(-1)[0].noAgents;

describe('HomeOverview shell', () => {
  it('renders the header and every section', () => {
    const { container } = render(<HomeOverview />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    for (const section of [
      'overview-section',
      'endpoint-security-section',
      'threat-hunting-section',
      'security-operations-section',
      'cloud-security-section',
      'threat-intelligence-feed-section',
    ]) {
      expect(
        container.querySelector(`[data-test-subj="${section}"]`),
      ).toBeInTheDocument();
    }
  });

  it('flags no agents only when the agent count loads as zero', () => {
    asMock(useAgentStatus).mockReturnValue({
      status: 'available',
      data: { total: 0 },
    });
    render(<HomeOverview />);
    expect(lastNoAgents()).toBe(true);
  });

  it.each([
    ['agents are registered', { status: 'available', data: { total: 3 } }],
    ['the agent count failed', { status: 'error' }],
    ['the agent count is loading', { status: 'loading' }],
  ])('keeps the cards as they are when %s', (_, agents) => {
    asMock(useAgentStatus).mockReturnValue(agents);
    render(<HomeOverview />);
    expect(lastNoAgents()).toBe(false);
  });
});
