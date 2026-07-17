import React from 'react';
import { EuiPage, EuiPageBody, EuiSpacer } from '@elastic/eui';
import { SectionHeader } from './components/common';
import { OverviewSection } from './components/overview';
import { EndpointSecuritySection } from './components/endpoint-security';
import { ThreatHuntingSection } from './components/threat-hunting';
import { SecurityOperationsSection } from './components/security-operations';
import { CloudSecuritySection } from './components/cloud-security';
import { ThreatIntelligenceFeedSection } from './components/threat-intel-feed';
import {
  useFindingsOverview,
  useVulnerabilityOverview,
} from './hooks/use-overview-data';
import { useInViewport } from '../../hooks';

/**
 * Findings (on mount) and vulnerabilities (lazy) are searched once here and
 * shared across sections.
 */
const HomeOverviewBody: React.FC = () => {
  const findings = useFindingsOverview();
  const [vulnerabilitiesRef, vulnerabilitiesVisible] =
    useInViewport<HTMLDivElement>();
  const vulnerabilities = useVulnerabilityOverview(vulnerabilitiesVisible);

  return (
    <>
      <SectionHeader
        title='Overview'
        description='Fleet health, findings, and MITRE ATT&CK activity across your environment.'
      />
      <OverviewSection findings={findings} />
      <EuiSpacer size='l' />
      <EndpointSecuritySection findings={findings} />
      <EuiSpacer size='l' />
      <div ref={vulnerabilitiesRef}>
        <ThreatHuntingSection findings={findings} vulnerabilities={vulnerabilities} />
      </div>
      <EuiSpacer size='l' />
      <ThreatIntelligenceFeedSection vulnerabilities={vulnerabilities} />
      <EuiSpacer size='l' />
      <SecurityOperationsSection />
      <EuiSpacer size='l' />
      <CloudSecuritySection />
    </>
  );
};

export const HomeOverview: React.FC = () => (
  <EuiPage paddingSize='l'>
    <EuiPageBody>
      <HomeOverviewBody />
    </EuiPageBody>
  </EuiPage>
);
