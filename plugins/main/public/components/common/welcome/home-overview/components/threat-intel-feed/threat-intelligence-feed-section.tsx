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
  useVulnerabilityOverview,
} from '../../hooks/use-overview-data';
import { DataGroupResult } from '../../interfaces/data-group';
import { ThreatIntelEnrichments, TopItem } from '../../interfaces/types';
import { getIntegrationsUrl } from '../../utils/navigation';

export interface ThreatIntelligenceFeedSectionProps {
  /** Shared vulnerabilities search; provides the CVEs-matched tile. */
  vulnerabilities: ReturnType<typeof useVulnerabilityOverview>;
  /** Shared threat-intel enrichments catalog; provides the IOCs tile and the threat-type composition. */
  threatIntel: DataGroupResult<ThreatIntelEnrichments>;
}

const ThreatIntelligenceFeedSectionComponent: React.FC<
  ThreatIntelligenceFeedSectionProps
> = ({ vulnerabilities, threatIntel }) => {
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
  const cvesMatched: DataGroupResult<number | undefined> = {
    status: vulnerabilities.status,
    data: vulnerabilities.data?.cvesMatched,
    error: vulnerabilities.error,
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
        <EuiFlexItem grow={3}>
          <WidgetGroup
            status='available'
            title='Security analytics'
            caption='Current state'
            headerLink={{ label: 'Manage content', href: getIntegrationsUrl() }}
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
            title='Threat catalog'
            caption='Current state'
            data-test-subj='home-overview-threat-catalog'
          >
            <ThreatCatalogTiles iocs={iocs} cvesMatched={cvesMatched} />
            <EuiHorizontalRule margin='m' />
            <ThreatTypeComposition byThreatType={byThreatType} />
          </WidgetGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};

export const ThreatIntelligenceFeedSection = React.memo(
  withErrorBoundary(ThreatIntelligenceFeedSectionComponent),
);
