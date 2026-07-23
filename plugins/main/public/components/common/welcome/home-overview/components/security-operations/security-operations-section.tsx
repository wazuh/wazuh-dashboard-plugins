import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiLink } from '@elastic/eui';
import { getCore } from '../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { withErrorBoundary } from '../../../../hocs/error-boundary/with-error-boundary';
import { WidgetGroup, StatTile, TabNumber, SectionHeader } from '../common';
import { ItHygieneTiles } from './it-hygiene-tiles';
import { RegulatoryComplianceBadges } from './regulatory-compliance-badges';
import { useInViewport } from '../../../../hooks';
import {
  useActiveResponseOverview,
  useItHygieneOperatingSystemsCount,
  useItHygienePackagesCount,
  useItHygieneServicesCount,
  useItHygieneUsersCount,
} from '../../hooks/use-overview-data';
import {
  goToActiveResponse,
  goToItHygiene,
  goToRegulatoryComplianceHome,
} from '../../utils/navigation';

/** IT Hygiene and Active Response load lazily; Regulatory Compliance is static. */
const SecurityOperationsSectionComponent: React.FC = () => {
  const [sectionRef, visible] = useInViewport<HTMLDivElement>();
  const operatingSystems = useItHygieneOperatingSystemsCount(visible);
  const packages = useItHygienePackagesCount(visible);
  const users = useItHygieneUsersCount(visible);
  const services = useItHygieneServicesCount(visible);
  const activeResponse = useActiveResponseOverview(visible);

  return (
    <div ref={sectionRef}>
      <SectionHeader
        title='Security operations'
        description='Fleet inventory scale, automated response activity, and the regulatory frameworks you can jump to.'
      />
      <EuiFlexGroup wrap responsive={false}>
        <EuiFlexItem>
          <WidgetGroup
            status='available'
            title={
              <RedirectAppLinks application={getCore().application}>
                <EuiLink href={goToItHygiene()}>IT Hygiene</EuiLink>
              </RedirectAppLinks>
            }
            caption='Current state'
            centerBody
            data-test-subj='home-overview-it-hygiene'
          >
            <ItHygieneTiles
              operatingSystems={operatingSystems}
              packages={packages}
              users={users}
              services={services}
            />
          </WidgetGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <WidgetGroup
            status={activeResponse.status}
            title={
              <RedirectAppLinks application={getCore().application}>
                <EuiLink href={goToActiveResponse()}>Incident Response</EuiLink>
              </RedirectAppLinks>
            }
            caption='Last 24 hours'
            centerBody
            errorDisplay='dash'
            data-test-subj='home-overview-active-response'
          >
            <StatTile
              textAlign='center'
              reverse
              value={<TabNumber value={activeResponse.data} />}
              label='Actions triggered, last 24 hours'
              data-test-subj='active-response-stat'
            />
          </WidgetGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <WidgetGroup
            status='available'
            title={
              <RedirectAppLinks application={getCore().application}>
                <EuiLink href={goToRegulatoryComplianceHome()}>
                  Regulatory Compliance
                </EuiLink>
              </RedirectAppLinks>
            }
            caption='Frameworks'
            centerBody
            data-test-subj='home-overview-regulatory-compliance'
          >
            <RegulatoryComplianceBadges />
          </WidgetGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};

export const SecurityOperationsSection = React.memo(
  withErrorBoundary(SecurityOperationsSectionComponent),
);
