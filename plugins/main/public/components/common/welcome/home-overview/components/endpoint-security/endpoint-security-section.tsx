import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiLink, EuiSpacer } from '@elastic/eui';
import { withErrorBoundary } from '../../../../hocs/error-boundary/with-error-boundary';
import {
  WidgetGroup,
  StatTile,
  TabNumber,
  ScoreGauge,
  DualBarList,
  SectionHeader,
  WIDGET_LOADING_MIN_HEIGHT,
} from '../common';
import { ScaTiles } from './sca-tiles';
import { FimTopFilesTable } from './fim-top-files-table';
import { MalwareDetectionPanel } from './malware-detection-panel';
import { useInViewport } from '../../../../hooks';
import {
  useFIMOverview,
  useFindingsOverview,
  useSCAOverview,
} from '../../hooks/use-overview-data';
import {
  getConfigurationAssessmentUrl,
  getFileIntegrityMonitoringInventoryFilesUrl,
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
    error: findings.error,
  };
  const feedByType: DataGroupResult<TopItem[]> = {
    status: threatIntel.status,
    data: threatIntel.data?.feedByType,
    error: threatIntel.error,
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
            errorLabel={sca.error?.message}
            showManageIndexPatternsLink={
              sca.error?.kind === 'index-pattern-missing'
            }
            isPermissionDenied={sca.error?.kind === 'permission-denied'}
            title='Configuration Assessment'
            titleLink={{ href: getConfigurationAssessmentUrl() }}
            caption='Current state'
            loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.heroAndList}
            data-test-subj='home-overview-sca'
          >
            {sca.data && (
              <>
                <ScaTiles
                  tiles={sca.data.tiles}
                  indexPatternId={sca.indexPatternId}
                />
                <EuiSpacer size='m' />
                <ScoreGauge
                  title='Overall score'
                  score={sca.data.tiles.score}
                  data-test-subj='sca-score-gauge'
                />
                <EuiSpacer size='m' />
                <DualBarList
                  title='Top 5 benchmarks'
                  items={sca.data.benchmarks.map(benchmark => ({
                    key: benchmark.name,
                    label: benchmark.name,
                    passed: benchmark.passed,
                    failed: benchmark.failed,
                    score: benchmark.score,
                  }))}
                  emptyMessage='No SCA benchmarks found'
                  data-test-subj='sca-benchmarks'
                />
              </>
            )}
          </WidgetGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <WidgetGroup
            status={fim.status}
            errorLabel={fim.error?.message}
            showManageIndexPatternsLink={
              fim.error?.kind === 'index-pattern-missing'
            }
            isPermissionDenied={fim.error?.kind === 'permission-denied'}
            title='File Integrity Monitoring'
            titleLink={{ href: getFileIntegrityMonitoringUrl() }}
            caption='Current state'
            loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.heroAndList}
            data-test-subj='home-overview-fim'
          >
            {fim.data && (
              <>
                <StatTile
                  value={
                    <RedirectAppLinks application={getCore().application}>
                      <EuiLink
                        style={{ fontWeight: 'inherit' }}
                        color='text'
                        href={getFileIntegrityMonitoringInventoryFilesUrl()}
                        data-test-subj='fim-hero-link'
                      >
                        <TabNumber value={fim.data.total} />
                      </EuiLink>
                    </RedirectAppLinks>
                  }
                  label='File integrity baselined fleet-wide'
                  reverse
                  textAlign='center'
                  data-test-subj='fim-hero'
                />
                <EuiSpacer size='s' />
                <FimTopFilesTable items={fim.data.files} />
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

// Annotated: `withErrorBoundary` is untyped, so without this the props
// would reach every call site as `any`.
export const EndpointSecuritySection: React.FC<EndpointSecuritySectionProps> =
  React.memo(withErrorBoundary(EndpointSecuritySectionComponent));
