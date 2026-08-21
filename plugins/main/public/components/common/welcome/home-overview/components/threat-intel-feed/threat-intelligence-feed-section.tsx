import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiHorizontalRule } from '@elastic/eui';
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
import { CARD_MIN_WIDTH } from '../../lib/constants';
import { DataGroupResult } from '../../interfaces/data-group';
import { ThreatIntelEnrichments, TopItem } from '../../interfaces/types';
import { getIntegrationsUrl } from '../../utils/navigation';

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
        title='Threat intelligence feed'
        description='What the platform is detecting with — detection content and knowledge base.'
      />
      <EuiFlexGroup wrap responsive={false}>
        <EuiFlexItem grow={3} style={{ minWidth: CARD_MIN_WIDTH }}>
          <WidgetGroup
            status='available'
            title='Security analytics'
            caption='Current state'
            titleLink={{
              href: getIntegrationsUrl(),
              destination: 'Security Analytics',
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
        <EuiFlexItem grow={2} style={{ minWidth: CARD_MIN_WIDTH }}>
          <WidgetGroup
            status='available'
            title='Threat catalog'
            caption='Current state'
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
