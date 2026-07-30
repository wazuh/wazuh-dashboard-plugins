import React from 'react';
import { StatTileGroup, StatTileSpec } from '../common';
import { DataGroupResult } from '../../interfaces/data-group';

export interface ThreatCatalogTilesProps {
  iocs: DataGroupResult<number | undefined>;
  cvesMatched: DataGroupResult<number | undefined>;
}

// Reference-only entities (a catalog, not detection content): no `onSelect`.
const TILES: ReadonlyArray<StatTileSpec<keyof ThreatCatalogTilesProps>> = [
  { key: 'iocs', label: 'IOCs', testSubj: 'threat-catalog-tile-iocs' },
  {
    key: 'cvesMatched',
    label: 'CVEs matched',
    testSubj: 'threat-catalog-tile-cves-matched',
  },
];

export const ThreatCatalogTiles: React.FC<ThreatCatalogTilesProps> = props => (
  <StatTileGroup tiles={TILES} results={props} />
);
