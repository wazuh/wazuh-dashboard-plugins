import React from 'react';
import { EuiPanel } from '@elastic/eui';
import { withErrorBoundary } from '../../../../hocs/error-boundary/with-error-boundary';
import { SectionHeader } from '../common';
import { ThreatIntelTiles } from './threat-intel-tiles';
import { useInViewport } from '../../../../hooks';
import {
  useDecodersCount,
  useDetectorsCount,
  useIntegrationsCount,
  useRulesCount,
  useVulnerabilityOverview,
} from '../../hooks/use-overview-data';
import { DataGroupResult } from '../../interfaces/data-group';
import { ThreatIntelEnrichments } from '../../interfaces/types';

export interface ThreatIntelligenceFeedSectionProps {
  /** Shared vulnerabilities search; provides the CVEs-matched tile. */
  vulnerabilities: ReturnType<typeof useVulnerabilityOverview>;
  /** Shared threat-intel enrichments catalog; provides the IOCs tile. */
  threatIntel: DataGroupResult<ThreatIntelEnrichments>;
}

/**
 * Hides only when every tile lacks its dependency; IOCs and CVEs matched
 * aren't SA-backed, so the section still shows when Security Analytics is absent.
 */
const ThreatIntelligenceFeedSectionComponent: React.FC<
  ThreatIntelligenceFeedSectionProps
> = ({ vulnerabilities, threatIntel }) => {
  const [sectionRef, visible] = useInViewport<HTMLDivElement>();
  const rules = useRulesCount(visible);
  const decoders = useDecodersCount(visible);
  const integrations = useIntegrationsCount(visible);
  const detectors = useDetectorsCount(visible);
  const iocs: DataGroupResult<number> = {
    status: threatIntel.status,
    data: threatIntel.data?.total,
  };
  const cvesMatched: DataGroupResult<number> = {
    status: vulnerabilities.status,
    data: vulnerabilities.data?.cvesMatched,
  };

  const everyTileUnavailable = [
    rules,
    decoders,
    iocs,
    cvesMatched,
    integrations,
    detectors,
  ].every(result => result.status === 'unavailable');

  if (everyTileUnavailable) {
    return null;
  }

  return (
    <div ref={sectionRef}>
      <SectionHeader
        title='Threat intelligence feed'
        description='What the platform is detecting with — detection content and knowledge base.'
      />
      <EuiPanel
        paddingSize='m'
        hasBorder
        data-test-subj='home-overview-threat-intel'
      >
        <ThreatIntelTiles
          rules={rules}
          decoders={decoders}
          iocs={iocs}
          cvesMatched={cvesMatched}
          integrations={integrations}
          detectors={detectors}
        />
      </EuiPanel>
    </div>
  );
};

export const ThreatIntelligenceFeedSection = React.memo(
  withErrorBoundary(ThreatIntelligenceFeedSectionComponent),
);
