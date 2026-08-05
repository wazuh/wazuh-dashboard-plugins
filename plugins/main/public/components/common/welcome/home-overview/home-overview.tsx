import React from 'react';
import { EuiPage, EuiPageBody, EuiSpacer } from '@elastic/eui';
import { SectionHeader } from './components/common';
import { QuickAccessMenu } from './components/quick-access';
import { OverviewSection } from './components/overview';
import { EndpointSecuritySection } from './components/endpoint-security';
import { ThreatHuntingSection } from './components/threat-hunting';
import { SecurityOperationsSection } from './components/security-operations';
import { CloudSecuritySection } from './components/cloud-security';
import { ThreatIntelligenceFeedSection } from './components/threat-intel-feed';
import {
  useFindingsBreakdowns,
  useFindingsOverview,
  useThreatIntelEnrichments,
  useVulnerabilityOverview,
} from './hooks/use-overview-data';
import { useInViewport } from '../../hooks';
import { withErrorBoundary, withGlobalBreadcrumb } from '../../hocs';
import { overview } from '../../../../utils/applications';

/**
 * Searches feeding more than one section run once here: findings on mount, the
 * rest once their sections scroll in. Enrichments feed Malware Detection
 * (feed-by-type) and the Threat Catalog (IOCs); the findings breakdowns feed the
 * Compliance chips and the Cloud Security badges.
 */
const HomeOverviewBody: React.FC = () => {
  const findings = useFindingsOverview();
  const [vulnerabilitiesRef, vulnerabilitiesVisible] =
    useInViewport<HTMLDivElement>();
  const vulnerabilities = useVulnerabilityOverview(vulnerabilitiesVisible);
  const [enrichmentsRef, enrichmentsVisible] = useInViewport<HTMLDivElement>();
  const threatIntel = useThreatIntelEnrichments(enrichmentsVisible);
  const [breakdownsRef, breakdownsVisible] = useInViewport<HTMLDivElement>();
  const breakdowns = useFindingsBreakdowns(breakdownsVisible);

  return (
    <>
      <SectionHeader
        title='Overview'
        description='Fleet health, findings, and MITRE ATT&CK activity across your environment.'
        actions={<QuickAccessMenu />}
      />
      <OverviewSection findings={findings} />
      <EuiSpacer size='l' />
      <div ref={enrichmentsRef}>
        <EndpointSecuritySection
          findings={findings}
          threatIntel={threatIntel}
        />
      </div>
      <EuiSpacer size='l' />
      <div ref={vulnerabilitiesRef}>
        <ThreatHuntingSection
          findings={findings}
          vulnerabilities={vulnerabilities}
        />
      </div>
      <EuiSpacer size='l' />
      <ThreatIntelligenceFeedSection
        vulnerabilities={vulnerabilities}
        threatIntel={threatIntel}
      />
      <EuiSpacer size='l' />
      <div ref={breakdownsRef}>
        <SecurityOperationsSection
          complianceControls={{
            ...breakdowns,
            data: breakdowns.data?.complianceControlsByFramework,
          }}
        />
        <EuiSpacer size='l' />
        <CloudSecuritySection
          findings={{
            ...breakdowns,
            data: breakdowns.data?.cloudSecurityByModule,
          }}
        />
      </div>
    </>
  );
};

export const HomeOverview = withErrorBoundary(
  withGlobalBreadcrumb(() => [{ text: overview.breadcrumbLabel }])(() => (
    <EuiPage paddingSize='l'>
      <EuiPageBody>
        <HomeOverviewBody />
      </EuiPageBody>
    </EuiPage>
  )),
);
