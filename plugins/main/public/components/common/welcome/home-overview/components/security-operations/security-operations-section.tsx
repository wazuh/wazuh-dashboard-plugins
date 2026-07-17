import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiLink } from '@elastic/eui';
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

  const itHygieneStatus = [operatingSystems, packages, users, services].every(
    result => result.status === 'unavailable',
  )
    ? 'unavailable'
    : 'available';

  return (
    <div ref={sectionRef}>
      <SectionHeader
        title='Security operations'
        description='Fleet inventory scale, automated response activity, and the regulatory frameworks you can jump to.'
      />
      <EuiFlexGroup wrap responsive={false}>
        <EuiFlexItem>
          <WidgetGroup
            status={itHygieneStatus}
            title={<EuiLink onClick={goToItHygiene}>IT Hygiene</EuiLink>}
            caption='Current'
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
              <EuiLink onClick={goToActiveResponse}>Active Response</EuiLink>
            }
            caption='Last 24 hours'
            centerBody
            data-test-subj='home-overview-active-response'
          >
            {activeResponse.data !== undefined && (
              <StatTile
                textAlign='center'
                reverse
                value={<TabNumber value={activeResponse.data} />}
                label='Actions triggered, last 24 hours'
                data-test-subj='active-response-stat'
              />
            )}
          </WidgetGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <WidgetGroup
            status='available'
            title={
              <EuiLink onClick={goToRegulatoryComplianceHome}>
                Regulatory Compliance
              </EuiLink>
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
