import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiLink, EuiSpacer } from '@elastic/eui';
import { withErrorBoundary } from '../../../../hocs/error-boundary/with-error-boundary';
import {
  WidgetGroup,
  StatTile,
  TabNumber,
  SectionHeader,
  WIDGET_LOADING_MIN_HEIGHT,
} from '../common';
import { ScaTiles } from './sca-tiles';
import { ScaBenchmarksTable } from './sca-benchmarks-table';
import { FimPlatformsTable } from './fim-platforms-table';
import { MalwareDetectionPanel } from './malware-detection-panel';
import { useInViewport } from '../../../../hooks';
import {
  useFIMOverview,
  useFindingsOverview,
  useSCAOverview,
} from '../../hooks/use-overview-data';
import {
  getConfigurationAssessmentUrl,
  getFileIntegrityMonitoringUrl,
} from '../../utils/navigation';
import { DataGroupResult } from '../../interfaces/data-group';
import { ThreatIntelEnrichments, TopItem } from '../../interfaces/types';
import { getCore } from '../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';

export interface EndpointSecuritySectionProps {
  /** Malware Detection's IOC-match hero rides the shared findings search. */
  findings: ReturnType<typeof useFindingsOverview>;
  /** Feed-by-type comes from the shared threat-intel enrichments catalog. */
  threatIntel: DataGroupResult<ThreatIntelEnrichments>;
}

const EndpointSecuritySectionComponent: React.FC<
  EndpointSecuritySectionProps
> = ({ findings, threatIntel }) => {
  const [sectionRef, visible] = useInViewport<HTMLDivElement>();
  const sca = useSCAOverview(visible);
  const fim = useFIMOverview(visible);
  // Hero (detections, last 24h) and feed-by-type (catalog, current) have
  // distinct sources, so each carries its own status.
  const iocMatches: DataGroupResult<number> = {
    status: findings.status,
    data: findings.data?.iocMatches,
  };
  const feedByType: DataGroupResult<TopItem[]> = {
    status: threatIntel.status,
    data: threatIntel.data?.feedByType,
  };

  return (
    <div ref={sectionRef}>
      <SectionHeader
        title='Endpoint security'
        description='Harden configurations, detect malware, and monitor file integrity across your fleet.'
      />
      <EuiFlexGroup wrap responsive={false}>
        <EuiFlexItem>
          <WidgetGroup
            status={sca.status}
            title={
              <RedirectAppLinks application={getCore().application}>
                <EuiLink href={getConfigurationAssessmentUrl()}>
                  Configuration Assessment
                </EuiLink>
              </RedirectAppLinks>
            }
            caption='Current state'
            loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.heroAndList}
            data-test-subj='home-overview-sca'
          >
            {sca.data && (
              <>
                <ScaTiles tiles={sca.data.tiles} />
                <EuiSpacer size='s' />
                <ScaBenchmarksTable items={sca.data.benchmarks} />
              </>
            )}
          </WidgetGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <WidgetGroup
            status={fim.status}
            title={
              <RedirectAppLinks application={getCore().application}>
                <EuiLink href={getFileIntegrityMonitoringUrl()}>
                  File Integrity Monitoring
                </EuiLink>
              </RedirectAppLinks>
            }
            caption='Current state'
            loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.heroAndList}
            data-test-subj='home-overview-fim'
          >
            {fim.data && (
              <>
                <StatTile
                  value={<TabNumber value={fim.data.total} />}
                  label='Files & registry objects baselined fleet-wide'
                  reverse
                  textAlign='center'
                  data-test-subj='fim-hero'
                />
                <EuiSpacer size='s' />
                <FimPlatformsTable items={fim.data.platforms} />
              </>
            )}
          </WidgetGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <MalwareDetectionPanel
            iocMatches={iocMatches}
            feedByType={feedByType}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};

export const EndpointSecuritySection = React.memo(
  withErrorBoundary(EndpointSecuritySectionComponent),
);
