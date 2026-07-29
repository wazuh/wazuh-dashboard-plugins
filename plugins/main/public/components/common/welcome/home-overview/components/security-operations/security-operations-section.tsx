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
  useFindingsOverview,
  useItHygieneOperatingSystemsCount,
  useItHygienePackagesCount,
  useItHygieneServicesCount,
  useItHygieneUsersCount,
} from '../../hooks/use-overview-data';
import {
  getActiveResponseUrl,
  getItHygieneUrl,
  getRegulatoryComplianceUrlHome,
} from '../../utils/navigation';

export interface SecurityOperationsSectionProps {
  findings: ReturnType<typeof useFindingsOverview>;
}

/**
 * IT Hygiene and Active Response load lazily. Regulatory Compliance's chips
 * always navigate (the panel never gates on `findings`); they're merely
 * enriched with a controls-implicated count once the shared findings query
 * on `findings` resolves.
 */
const SecurityOperationsSectionComponent: React.FC<
  SecurityOperationsSectionProps
> = ({ findings }) => {
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
                <EuiLink href={getItHygieneUrl()}>IT Hygiene</EuiLink>
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
            errorLabel={activeResponse.error?.message}
            showManageIndexPatternsLink={
              activeResponse.error?.kind === 'index-pattern-missing'
            }
            isPermissionDenied={
              activeResponse.error?.kind === 'permission-denied'
            }
            title={
              <RedirectAppLinks application={getCore().application}>
                <EuiLink href={getActiveResponseUrl()}>
                  Incident Response
                </EuiLink>
              </RedirectAppLinks>
            }
            caption='Last 24 hours'
            centerBody
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
                <EuiLink href={getRegulatoryComplianceUrlHome()}>
                  Regulatory Compliance
                </EuiLink>
              </RedirectAppLinks>
            }
            caption='Controls implicated, last 24 hours'
            centerBody
            data-test-subj='home-overview-regulatory-compliance'
          >
            <RegulatoryComplianceBadges findings={findings} />
          </WidgetGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};

export const SecurityOperationsSection = React.memo(
  withErrorBoundary(SecurityOperationsSectionComponent),
);
