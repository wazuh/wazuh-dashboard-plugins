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
import { WidgetGroup } from './widget-group';
import { StatTile } from './stat-tile';
import { ItHygieneTiles } from './it-hygiene-tiles';
import { RegulatoryComplianceBadges } from './regulatory-compliance-badges';
import { useInViewport } from '../../../hooks';
import {
  useActiveResponseOverview,
  useItHygieneOperatingSystemsCount,
  useItHygienePackagesCount,
  useItHygieneServicesCount,
  useItHygieneUsersCount,
} from '../services/use-overview-data';
import { goToActiveResponse, goToItHygiene } from '../services/navigation';
import { formatUINumber } from '../../../../../react-services/format-number';

/**
 * The Security Operations section: IT Hygiene, Active Response, and
 * Regulatory Compliance. IT Hygiene and Active Response load lazily, once
 * the section approaches the viewport; Regulatory Compliance is static and
 * renders immediately.
 */
export const SecurityOperationsSection: React.FC = () => {
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
      <EuiFlexGroup>
        <EuiFlexItem>
          <WidgetGroup
            status={itHygieneStatus}
            title={<EuiLink onClick={goToItHygiene}>IT Hygiene</EuiLink>}
            caption='Current'
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
            data-test-subj='home-overview-active-response'
          >
            {activeResponse.data !== undefined && (
              <StatTile
                value={
                  <span className='tab-num'>
                    {formatUINumber(activeResponse.data)}
                  </span>
                }
                label='Actions triggered, last 24 hours'
                textAlign='left'
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
