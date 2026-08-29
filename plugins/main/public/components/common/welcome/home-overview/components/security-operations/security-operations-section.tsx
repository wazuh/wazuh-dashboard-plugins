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
import {
  getRegulatoryComplianceUrlHome,
} from '../../utils/navigation';
import { activeResponses, ITHygiene, regulatoryCompliance } from '../../../../../../utils/applications';
import { homeOverviewI18n } from '../../i18n';

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
        title={homeOverviewI18n.securityOperations}
        description={homeOverviewI18n.securityOperationsDescription}
      />
      <EuiFlexGroup wrap responsive={false}>
        <EuiFlexItem>
          <WidgetGroup
            status='available'
            title={
              <RedirectAppLinks application={getCore().application}>
                <EuiLink href={getItHygieneUrl()}>{ITHygiene.title}</EuiLink>
              </RedirectAppLinks>
            }
            caption={homeOverviewI18n.currentState}
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
                  {activeResponses.title}
                </EuiLink>
              </RedirectAppLinks>
            }
            caption={homeOverviewI18n.last24Hours}
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
              label={homeOverviewI18n.actionsTriggered24h}
              data-test-subj='active-response-stat'
            />
          </WidgetGroup>
        </EuiFlexItem>
        <EuiFlexItem style={{ minWidth: 'min(640px, 100%)' }}>
          <WidgetGroup
            status='available'
            title={
              <RedirectAppLinks application={getCore().application}>
                <EuiLink href={getRegulatoryComplianceUrlHome()}>
                  {regulatoryCompliance.title}
                </EuiLink>
              </RedirectAppLinks>
            }
            caption={homeOverviewI18n.controlsImplicated24h}
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
            title={homeOverviewI18n.top5OperatingSystems}
            caption={homeOverviewI18n.currentState}
            headerLink={{
              label: homeOverviewI18n.itHygiene,
              href: getItHygieneUrl(),
            }}
            loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.list}
            centerBody
            data-test-subj='home-overview-top-os'
          >
            {topOs.data && (
              <BarList
                items={topOs.data}
                emptyMessage={homeOverviewI18n.noOperatingSystems}
                title={homeOverviewI18n.osName}
                totalSlots={5}
                moreItemsMessage={homeOverviewI18n.noMoreOperatingSystems}
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
            title={homeOverviewI18n.top5NetworkServices}
            caption={homeOverviewI18n.currentState}
            headerLink={{
              label: homeOverviewI18n.itHygiene,
              href: getItHygieneUrl(),
            }}
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
