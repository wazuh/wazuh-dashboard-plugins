import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiPanel } from '@elastic/eui';
import { WidgetGroupBody, StatTile } from '../common';
import { DataGroupResult } from '../../interfaces/data-group';
import { formatUINumber } from '../../../../../../react-services/format-number';
import {
  goToDecoders,
  goToDetectors,
  goToIntegrations,
  goToRules,
} from '../../utils/navigation';

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
  /** Present only for the four clickable tiles; CVEs matched is informational-only. */
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
 * Each tile is independently gated: one absent dependency hides only its own
 * tile, not the whole panel.
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
