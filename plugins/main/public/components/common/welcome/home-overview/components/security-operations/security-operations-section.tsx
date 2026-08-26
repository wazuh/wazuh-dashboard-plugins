import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiLink, EuiSpacer } from '@elastic/eui';
import { getCore } from '../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { withErrorBoundary } from '../../../../hocs/error-boundary/with-error-boundary';
import {
  WidgetGroup,
  StatTile,
  TabNumber,
  SectionHeader,
  BarList,
  WIDGET_LOADING_MIN_HEIGHT,
} from '../common';
import { ItHygieneTiles } from './it-hygiene-tiles';
import {
  RegulatoryComplianceBadges,
  RegulatoryComplianceBadgesProps,
} from './regulatory-compliance-badges';
import { TopNetworkServicesTable } from '../overview/top-network-services-table';
import { useInViewport } from '../../../../hooks';
import { CARD_MIN_WIDTH } from '../../lib/constants';
import {
  useActiveResponseOverview,
  useItHygieneOperatingSystemsCount,
  useItHygienePackagesCount,
  useItHygieneServicesCount,
  useItHygieneUsersCount,
  useTopNetworkServices,
  useTopOperatingSystems,
} from '../../hooks/use-overview-data';
import {
  getActiveResponseResponsesUrl,
  getActiveResponseUrl,
  getItHygieneSystemOsUrl,
  getItHygieneUrl,
  getRegulatoryComplianceUrlHome,
} from '../../utils/navigation';

export interface SecurityOperationsSectionProps {
  complianceControls: RegulatoryComplianceBadgesProps['controls'];
}

/** IT Hygiene and Active Response load lazily; the chips navigate regardless. */
const SecurityOperationsSectionComponent: React.FC<
  SecurityOperationsSectionProps
> = ({ complianceControls }) => {
  const [sectionRef, visible] = useInViewport<HTMLDivElement>();
  const operatingSystems = useItHygieneOperatingSystemsCount(visible);
  const packages = useItHygienePackagesCount(visible);
  const users = useItHygieneUsersCount(visible);
  const services = useItHygieneServicesCount(visible);
  const activeResponse = useActiveResponseOverview(visible);
  const topOs = useTopOperatingSystems(visible);
  const topServices = useTopNetworkServices(visible);

  return (
    <div ref={sectionRef}>
      <SectionHeader
        title='Security operations'
        description='Fleet inventory scale, automated response activity, and the regulatory frameworks you can jump to.'
      />
      <EuiFlexGroup wrap responsive={false}>
        <EuiFlexItem style={{ minWidth: CARD_MIN_WIDTH }}>
          <WidgetGroup
            status='available'
            title='IT Hygiene'
            titleLink={{ href: getItHygieneUrl() }}
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
        <EuiFlexItem style={{ minWidth: CARD_MIN_WIDTH }}>
          <WidgetGroup
            status={activeResponse.status}
            errorLabel={activeResponse.error?.message}
            showManageIndexPatternsLink={
              activeResponse.error?.kind === 'index-pattern-missing'
            }
            isPermissionDenied={
              activeResponse.error?.kind === 'permission-denied'
            }
            title='Incident Response'
            titleLink={{ href: getActiveResponseUrl() }}
            caption='Last 24 hours'
            centerBody
            data-test-subj='home-overview-active-response'
          >
            <StatTile
              textAlign='center'
              reverse
              value={
                <RedirectAppLinks application={getCore().application}>
                  <EuiLink
                    style={{ fontWeight: 'normal' }}
                    color='text'
                    href={getActiveResponseResponsesUrl()}
                    data-test-subj='active-response-stat-link'
                  >
                    <TabNumber value={activeResponse.data} />
                  </EuiLink>
                </RedirectAppLinks>
              }
              label='Actions triggered, last 24 hours'
              data-test-subj='active-response-stat'
            />
          </WidgetGroup>
        </EuiFlexItem>
        <EuiFlexItem style={{ minWidth: CARD_MIN_WIDTH }}>
          <WidgetGroup
            status='available'
            title='Regulatory Compliance'
            titleLink={{ href: getRegulatoryComplianceUrlHome() }}
            caption='Controls implicated, last 24 hours'
            centerBody
            data-test-subj='home-overview-regulatory-compliance'
          >
            <RegulatoryComplianceBadges controls={complianceControls} />
          </WidgetGroup>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size='m' />

      <EuiFlexGroup>
        <EuiFlexItem>
          <WidgetGroup
            status={topOs.status}
            errorLabel={topOs.error?.message}
            showManageIndexPatternsLink={
              topOs.error?.kind === 'index-pattern-missing'
            }
            isPermissionDenied={topOs.error?.kind === 'permission-denied'}
            title='Top 5 operating systems'
            caption='Current state'
            titleLink={{ href: getItHygieneUrl(), destination: 'IT Hygiene' }}
            loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.list}
            centerBody
            data-test-subj='home-overview-top-os'
          >
            {topOs.data && (
              <BarList
                items={topOs.data}
                emptyMessage='No operating systems found'
                title='OS name'
                totalSlots={5}
                moreItemsMessage='No more operating systems to display'
                getHref={item =>
                  getItHygieneSystemOsUrl(item.key, topOs.indexPatternId)
                }
                data-test-subj='top-os'
              />
            )}
          </WidgetGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <WidgetGroup
            status={topServices.status}
            errorLabel={topServices.error?.message}
            showManageIndexPatternsLink={
              topServices.error?.kind === 'index-pattern-missing'
            }
            isPermissionDenied={topServices.error?.kind === 'permission-denied'}
            title='Top 5 network services'
            caption='Current state'
            titleLink={{ href: getItHygieneUrl(), destination: 'IT Hygiene' }}
            loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.list}
            data-test-subj='home-overview-top-network-services'
          >
            {topServices.data && (
              <TopNetworkServicesTable items={topServices.data} />
            )}
          </WidgetGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};

// Annotated: `withErrorBoundary` is untyped, so without this the props
// would reach every call site as `any`.
export const SecurityOperationsSection: React.FC<SecurityOperationsSectionProps> =
  React.memo(withErrorBoundary(SecurityOperationsSectionComponent));
