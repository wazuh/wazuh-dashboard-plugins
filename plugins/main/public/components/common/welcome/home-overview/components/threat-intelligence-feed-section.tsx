import React from 'react';
import { EuiPanel, EuiSpacer, EuiText, EuiTitle } from '@elastic/eui';
import { withErrorBoundary } from '../../../hocs/error-boundary/with-error-boundary';
import { ThreatIntelTiles } from './threat-intel-tiles';
import { useInViewport } from '../../../hooks';
import {
  useCvesMatchedCount,
  useDecodersCount,
  useDetectorsCount,
  useIntegrationsCount,
  useRulesCount,
} from '../services/use-overview-data';

/**
 * The Threat Intelligence Feed section: a tile row summarizing what the
 * platform is detecting with (Rules/Decoders/Integrations/Detectors) plus
 * CVEs matched. Loads lazily, once the section approaches the viewport.
 * The whole section hides only when every tile lacks its dependency — CVEs
 * matched isn't Security-Analytics-backed, so the section still shows it
 * even when Security Analytics is absent.
 *
 * (There used to be a sixth, informational IOCs tile sourced from the
 * Security Analytics IOC catalog, but that endpoint doesn't exist on this
 * backend — confirmed live — so it was dropped.)
 */
const ThreatIntelligenceFeedSectionComponent: React.FC = () => {
  const [sectionRef, visible] = useInViewport<HTMLDivElement>();
  const rules = useRulesCount(visible);
  const decoders = useDecodersCount(visible);
  const integrations = useIntegrationsCount(visible);
  const detectors = useDetectorsCount(visible);
  const cvesMatched = useCvesMatchedCount(visible);

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
