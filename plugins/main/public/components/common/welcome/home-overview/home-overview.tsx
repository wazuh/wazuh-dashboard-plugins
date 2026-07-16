import React from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiButtonEmpty,
  EuiSpacer,
} from '@elastic/eui';
import { RefreshProvider, useRefresh } from './context/refresh-context';
import { OverviewSection } from './components/overview-section';
import { EndpointSecuritySection } from './components/endpoint-security-section';
import { ThreatHuntingSection } from './components/threat-hunting-section';
import { useFindingsOverview } from './services/use-overview-data';

const HomeOverviewHeader: React.FC = () => {
  const { refresh } = useRefresh();
  return (
    <EuiFlexGroup alignItems='center' gutterSize='s' responsive={false}>
      <EuiFlexItem>
        <EuiTitle size='s'>
          <h1>Overview</h1>
        </EuiTitle>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonEmpty
          iconType='refresh'
          onClick={refresh}
          data-test-subj='home-overview-refresh'
        >
          Refresh
        </EuiButtonEmpty>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

/**
 * The page body, rendered inside `RefreshProvider` so the shared findings
 * search (read by both OVERVIEW and Threat Hunting) picks up Refresh clicks.
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
    </>
  );
};

/**
 * The Home overview landing page: a live security dashboard that replaces the
 * static module catalog.
 */
export const HomeOverview: React.FC = () => (
  <RefreshProvider>
    <EuiPage paddingSize='l'>
      <EuiPageBody>
        <HomeOverviewBody />
      </EuiPageBody>
    </EuiPage>
  </RefreshProvider>
);
