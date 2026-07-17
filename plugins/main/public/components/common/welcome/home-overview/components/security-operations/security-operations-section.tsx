import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { withErrorBoundary } from '../../../../hocs/error-boundary/with-error-boundary';
import { WidgetGroup, StatTile } from '../common';
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
import { goToActiveResponse, goToItHygiene } from '../../utils/navigation';
import { formatUINumber } from '../../../../../../react-services/format-number';

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
      <EuiTitle size='xs'>
        <h2>Security operations</h2>
      </EuiTitle>
      <EuiText size='s' color='subdued'>
        Fleet inventory scale, automated response activity, and the
        regulatory frameworks you can jump to.
      </EuiText>
      <EuiSpacer size='s' />
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
                value={
                  <span className='tab-num'>
                    {formatUINumber(activeResponse.data)}
                  </span>
                }
                label='Actions triggered, last 24 hours'
                data-test-subj='active-response-stat'
              />
            )}
          </WidgetGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiPanel
            paddingSize='m'
            hasBorder
            data-test-subj='home-overview-regulatory-compliance'
          >
            <EuiTitle size='xxs'>
              <h3>Regulatory Compliance</h3>
            </EuiTitle>
            <div style={{ marginTop: 10 }}>
              <RegulatoryComplianceBadges />
            </div>
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};

export const SecurityOperationsSection = withErrorBoundary(
  SecurityOperationsSectionComponent,
);
