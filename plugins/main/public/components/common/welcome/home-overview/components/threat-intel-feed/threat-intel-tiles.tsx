import React from 'react';
import { StatTileGroup, StatTileSpec } from '../common';
import { DataGroupResult } from '../../interfaces/data-group';
import {
  goToDecoders,
  goToDetectors,
  goToIntegrations,
  goToRules,
} from '../../utils/navigation';

export interface ThreatIntelTilesProps {
  rules: DataGroupResult<number>;
  decoders: DataGroupResult<number>;
  iocs: DataGroupResult<number>;
  cvesMatched: DataGroupResult<number>;
  integrations: DataGroupResult<number>;
  detectors: DataGroupResult<number>;
}

const TILES: ReadonlyArray<StatTileSpec<keyof ThreatIntelTilesProps>> = [
  {
    key: 'rules',
    label: 'Rules',
    testSubj: 'threat-intel-tile-rules',
    onSelect: goToRules,
  },
  {
    key: 'decoders',
    label: 'Decoders',
    testSubj: 'threat-intel-tile-decoders',
    onSelect: goToDecoders,
  },
  // IOCs and CVEs matched are reference-only, so they carry no `onSelect`.
  { key: 'iocs', label: 'IOCs', testSubj: 'threat-intel-tile-iocs' },
  {
    key: 'cvesMatched',
    label: 'CVEs matched',
    testSubj: 'threat-intel-tile-cves-matched',
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
];

export const ThreatIntelTiles: React.FC<ThreatIntelTilesProps> = props => (
  <StatTileGroup tiles={TILES} results={props} />
);
