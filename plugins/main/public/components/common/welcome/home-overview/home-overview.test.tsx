import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

// Stub the sections and the shared findings hook so the shell test doesn't
// pull the data-access seam.
jest.mock('./components/overview-section', () => ({
  OverviewSection: () => <div data-test-subj='overview-section' />,
}));
jest.mock('./components/endpoint-security-section', () => ({
  EndpointSecuritySection: () => (
    <div data-test-subj='endpoint-security-section' />
  ),
}));
jest.mock('./components/threat-hunting-section', () => ({
  ThreatHuntingSection: () => <div data-test-subj='threat-hunting-section' />,
}));
jest.mock('./components/security-operations-section', () => ({
  SecurityOperationsSection: () => (
    <div data-test-subj='security-operations-section' />
  ),
}));
jest.mock('./components/cloud-security-section', () => ({
  CloudSecuritySection: () => <div data-test-subj='cloud-security-section' />,
}));
jest.mock('./components/threat-intelligence-feed-section', () => ({
  ThreatIntelligenceFeedSection: () => (
    <div data-test-subj='threat-intelligence-feed-section' />
  ),
}));
jest.mock('./services/use-overview-data', () => ({
  useFindingsOverview: jest.fn(() => ({ status: 'loading' })),
}));

import { HomeOverview } from './home-overview';

describe('HomeOverview shell', () => {
  it('renders the header and every section', () => {
    render(<HomeOverview />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByTestId('overview-section')).toBeInTheDocument();
    expect(
      screen.getByTestId('endpoint-security-section'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('threat-hunting-section')).toBeInTheDocument();
    expect(
      screen.getByTestId('security-operations-section'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('cloud-security-section')).toBeInTheDocument();
    expect(
      screen.getByTestId('threat-intelligence-feed-section'),
    ).toBeInTheDocument();
  });
});
