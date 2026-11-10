import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiLink,
} from '@elastic/eui';
import { withErrorBoundary } from '../../../../hocs/error-boundary/with-error-boundary';
import { SectionHeader, WidgetGroup } from '../common';
import { SecurityAnalyticsTiles } from '../security-analytics';
import { ThreatCatalogTiles, ThreatTypeComposition } from '../threat-catalog';
import { useInViewport } from '../../../../hooks';
import {
  useDecodersCount,
  useDetectorsCount,
  useFiltersCount,
  useIntegrationsCount,
  useKvdbsCount,
  useRulesCount,
} from '../../hooks/use-overview-data';
import { DataGroupResult } from '../../interfaces/data-group';
import { ThreatIntelEnrichments, TopItem } from '../../interfaces/types';
import {
  getCtiExplorerIocsUrl,
  getCtiFeedUrl,
  getIntegrationsUrl,
} from '../../utils/navigation';
import { getCore } from '../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';

export interface ThreatIntelligenceFeedSectionProps {
  /** Shared enrichments catalog: the IOCs tile and the threat-type bar. */
  threatIntel: DataGroupResult<ThreatIntelEnrichments>;
}

const ThreatIntelligenceFeedSectionComponent: React.FC<
  ThreatIntelligenceFeedSectionProps
> = ({ threatIntel }) => {
  const [sectionRef, visible] = useInViewport<HTMLDivElement>();
  const rules = useRulesCount(visible);
  const decoders = useDecodersCount(visible);
  const detectors = useDetectorsCount(visible);
  const integrations = useIntegrationsCount(visible);
  const kvdbs = useKvdbsCount(visible);
  const filters = useFiltersCount(visible);
  const iocs: DataGroupResult<number | undefined> = {
    status: threatIntel.status,
    data: threatIntel.data?.total,
    error: threatIntel.error,
  };
  const byThreatType: DataGroupResult<TopItem[]> = {
    status: threatIntel.status,
    data: threatIntel.data?.byThreatType,
    error: threatIntel.error,
  };

  return (
    <div ref={sectionRef}>
      <SectionHeader
        title={i18n.translate(
          'wazuh.common.homeOverviewThreatIntelFeed.title',
          { defaultMessage: 'Threat intelligence feed' },
        )}
        description={
          <>
            {i18n.translate(
              'wazuh.common.homeOverviewThreatIntelFeed.description',
              {
                defaultMessage:
                  'Detection content and IOCs from the CTI feed, synced by the indexer every hour by default.',
              },
            )}{' '}
            <RedirectAppLinks
              application={getCore().application}
              className='eui-displayInline'
            >
              <EuiLink
                href={getCtiFeedUrl()}
                data-test-subj='home-overview-threat-intel-feed-cti-feed-link'
              >
                {i18n.translate(
                  'wazuh.common.homeOverviewThreatIntelFeed.ctiFeedLink',
                  { defaultMessage: 'Open CTI feed' },
                )}
              </EuiLink>
            </RedirectAppLinks>
          </>
        }
      />
      <EuiFlexGroup wrap responsive={false}>
        <EuiFlexItem grow={3}>
          <WidgetGroup
            status='available'
            title={i18n.translate(
              'wazuh.common.homeOverviewThreatIntelFeed.rulesetManagementTitle',
              { defaultMessage: 'Ruleset management' },
            )}
            caption={i18n.translate(
              'wazuh.common.homeOverviewWidget.captionCurrentState',
              { defaultMessage: 'Current state' },
            )}
            titleLink={{
              href: getIntegrationsUrl(),
              destination: i18n.translate(
                'wazuh.common.homeOverviewThreatIntelFeed.rulesetManagementDestination',
                { defaultMessage: 'Ruleset Management' },
              ),
            }}
            centerBody
            data-test-subj='home-overview-security-analytics'
          >
            <SecurityAnalyticsTiles
              rules={rules}
              decoders={decoders}
              detectors={detectors}
              integrations={integrations}
              kvdbs={kvdbs}
              filters={filters}
            />
          </WidgetGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={2}>
          <WidgetGroup
            status='available'
            title={i18n.translate(
              'wazuh.common.homeOverviewThreatIntelFeed.threatCatalogTitle',
              { defaultMessage: 'Threat catalog' },
            )}
            caption={i18n.translate(
              'wazuh.common.homeOverviewWidget.captionCurrentState',
              { defaultMessage: 'Current state' },
            )}
            titleLink={{
              href: getCtiExplorerIocsUrl(),
              destination: i18n.translate(
                'wazuh.common.homeOverviewThreatIntelFeed.threatCatalogDestination',
                { defaultMessage: 'CTI Explorer' },
              ),
            }}
            data-test-subj='home-overview-threat-catalog'
          >
            <ThreatCatalogTiles iocs={iocs} />
            <EuiHorizontalRule margin='m' />
            <ThreatTypeComposition byThreatType={byThreatType} />
          </WidgetGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};

// Annotated: `withErrorBoundary` is untyped, so without this the props
// would reach every call site as `any`.
export const ThreatIntelligenceFeedSection: React.FC<ThreatIntelligenceFeedSectionProps> =
  React.memo(withErrorBoundary(ThreatIntelligenceFeedSectionComponent));
