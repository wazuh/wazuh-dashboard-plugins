import React from 'react';
import { EuiPage, EuiPageBody, EuiTitle, EuiSpacer } from '@elastic/eui';
import { OverviewSection } from './components/overview-section';
import { EndpointSecuritySection } from './components/endpoint-security-section';
import { ThreatHuntingSection } from './components/threat-hunting-section';
import { SecurityOperationsSection } from './components/security-operations-section';
import { CloudSecuritySection } from './components/cloud-security-section';
import { ThreatIntelligenceFeedSection } from './components/threat-intelligence-feed-section';
import { useFindingsOverview } from './services/use-overview-data';

const HomeOverviewHeader: React.FC = () => (
  <EuiTitle size='s'>
    <h1>Overview</h1>
  </EuiTitle>
);

/**
 * The page body. The shared findings search (read by both OVERVIEW and
 * Threat Hunting) is owned here so both sections read the same result
 * rather than each issuing their own scan.
 */
const HomeOverviewBody: React.FC = () => {
  const findings = useFindingsOverview();

  return (
    <>
      <HomeOverviewHeader />
      <EuiSpacer size='m' />
      <OverviewSection findings={findings} />
      <EuiSpacer size='l' />
      <EndpointSecuritySection />
      <EuiSpacer size='l' />
      <ThreatHuntingSection findings={findings} />
      <EuiSpacer size='l' />
      <ThreatIntelligenceFeedSection />
      <EuiSpacer size='l' />
      <SecurityOperationsSection />
      <EuiSpacer size='l' />
      <CloudSecuritySection />
    </>
  );
};

/**
 * The Home overview landing page: a live security dashboard that replaces the
 * static module catalog.
 */
export const HomeOverview: React.FC = () => (
  <EuiPage paddingSize='l'>
    <EuiPageBody>
      <HomeOverviewBody />
    </EuiPageBody>
  </EuiPage>
);
