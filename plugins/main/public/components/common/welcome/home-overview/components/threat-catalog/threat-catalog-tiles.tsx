import React from 'react';
import { StatTileGroup, StatTileSpec } from '../common';
import { DataGroupResult } from '../../interfaces/data-group';

export interface ThreatCatalogTilesProps {
  iocs: DataGroupResult<number>;
  cvesMatched: DataGroupResult<number>;
}

// IOCs and CVEs matched are reference-only entities (a catalog of known
// threats, not detection content), so neither tile carries an `onSelect`.
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
