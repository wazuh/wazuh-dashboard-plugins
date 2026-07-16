import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiPanel } from '@elastic/eui';
import { WidgetGroupBody } from './widget-group';
import { StatTile } from './stat-tile';
import { DataGroupResult } from '../services/types';
import { formatUINumber } from '../../../../../react-services/format-number';
import {
  goToDecoders,
  goToDetectors,
  goToIntegrations,
  goToRules,
} from '../services/navigation';

export interface ThreatIntelTilesProps {
  rules: DataGroupResult<number>;
  decoders: DataGroupResult<number>;
  integrations: DataGroupResult<number>;
  detectors: DataGroupResult<number>;
  cvesMatched: DataGroupResult<number>;
}

const TILES: Array<{
  key: keyof ThreatIntelTilesProps;
  label: string;
  testSubj: string;
  /** Present only for the four clickable tiles; CVEs matched is
   * informational-only. */
  onSelect?: () => void;
}> = [
  { key: 'rules', label: 'Rules', testSubj: 'threat-intel-tile-rules', onSelect: goToRules },
  {
    key: 'decoders',
    label: 'Decoders',
    testSubj: 'threat-intel-tile-decoders',
    onSelect: goToDecoders,
  },
  {
    key: 'integrations',
    label: 'Integrations',
    testSubj: 'threat-intel-tile-integrations',
    onSelect: goToIntegrations,
  },
  {
    key: 'detectors',
    label: 'Detectors',
    testSubj: 'threat-intel-tile-detectors',
    onSelect: goToDetectors,
  },
  {
    key: 'cvesMatched',
    label: 'CVEs matched',
    testSubj: 'threat-intel-tile-cves-matched',
  },
];

/**
 * The Threat Intelligence Feed's tiles. Rules/Decoders/Integrations/
 * Detectors are clickable through to their management pages (an
 * `onClick`-bearing `EuiPanel`, which signals clickability); CVEs matched
 * is informational only. Each tile is independently gated, so one absent
 * dependency hides only its own tile rather than the whole panel.
 *
 * (There used to be a sixth, informational IOCs tile, but the IOC catalog
 * endpoint it depended on doesn't exist on this backend — confirmed live,
 * OpenSearch itself returns "no handler found for uri" — so it was
 * dropped rather than kept as a permanently-hidden dead widget.)
 */
export const ThreatIntelTiles: React.FC<ThreatIntelTilesProps> = props => (
  <EuiFlexGroup gutterSize='m' responsive={false} wrap>
    {TILES.map(tile => {
      const result = props[tile.key];
      if (result.status === 'unavailable') {
        return null;
      }
      return (
        <EuiFlexItem key={tile.key}>
          <WidgetGroupBody status={result.status}>
            {result.data !== undefined && (
              <EuiPanel
                paddingSize='s'
                hasBorder
                onClick={tile.onSelect}
                data-test-subj={tile.testSubj}
              >
                <StatTile
                  value={
                    <span className='tab-num'>
                      {formatUINumber(result.data)}
                    </span>
                  }
                  label={tile.label}
                  reverse
                />
              </EuiPanel>
            )}
          </WidgetGroupBody>
        </EuiFlexItem>
      );
    })}
  </EuiFlexGroup>
);
