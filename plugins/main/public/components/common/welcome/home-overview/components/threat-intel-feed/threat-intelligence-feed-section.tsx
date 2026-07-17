import React from 'react';
import { EuiPanel, EuiSpacer, EuiText, EuiTitle } from '@elastic/eui';
import { withErrorBoundary } from '../../../../hocs/error-boundary/with-error-boundary';
import { ThreatIntelTiles } from './threat-intel-tiles';
import { useInViewport } from '../../../../hooks';
import {
  useDecodersCount,
  useDetectorsCount,
  useIntegrationsCount,
  useRulesCount,
  useVulnerabilityOverview,
} from '../../hooks/use-overview-data';
import { DataGroupResult } from '../../data-group';

export interface ThreatIntelligenceFeedSectionProps {
  /** Shared vulnerabilities search; provides the CVEs-matched tile. */
  vulnerabilities: ReturnType<typeof useVulnerabilityOverview>;
}

/**
 * Hides only when every tile lacks its dependency; CVEs matched isn't
 * SA-backed, so the section still shows when Security Analytics is absent.
 */
const ThreatIntelligenceFeedSectionComponent: React.FC<
  ThreatIntelligenceFeedSectionProps
> = ({ vulnerabilities }) => {
  const [sectionRef, visible] = useInViewport<HTMLDivElement>();
  const rules = useRulesCount(visible);
  const decoders = useDecodersCount(visible);
  const integrations = useIntegrationsCount(visible);
  const detectors = useDetectorsCount(visible);
  const cvesMatched: DataGroupResult<number> = {
    status: vulnerabilities.status,
    data: vulnerabilities.data?.cvesMatched,
  };

  const everyTileUnavailable = [
    rules,
    decoders,
    integrations,
    detectors,
    cvesMatched,
  ].every(result => result.status === 'unavailable');

  if (everyTileUnavailable) {
    return null;
  }

  return (
    <div ref={sectionRef}>
      <EuiTitle size='xs'>
        <h2>Threat intelligence feed</h2>
      </EuiTitle>
      <EuiText size='s' color='subdued'>
        What the platform is detecting with — detection content and
        knowledge base.
      </EuiText>
      <EuiSpacer size='s' />
      <EuiPanel
        paddingSize='m'
        hasBorder
        data-test-subj='home-overview-threat-intel'
      >
        <ThreatIntelTiles
          rules={rules}
          decoders={decoders}
          integrations={integrations}
          detectors={detectors}
          cvesMatched={cvesMatched}
        />
      </EuiPanel>
    </div>
  );
};

export const ThreatIntelligenceFeedSection = withErrorBoundary(
  ThreatIntelligenceFeedSectionComponent,
);
