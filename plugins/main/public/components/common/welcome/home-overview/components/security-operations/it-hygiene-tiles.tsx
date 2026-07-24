import React from 'react';
import { StatTileGroup, StatTileSpec } from '../common';
import { DataGroupResult } from '../../interfaces/data-group';

export interface ItHygieneTilesProps {
  operatingSystems: DataGroupResult<number>;
  packages: DataGroupResult<number>;
  users: DataGroupResult<number>;
  services: DataGroupResult<number>;
}

const TILES: ReadonlyArray<StatTileSpec<keyof ItHygieneTilesProps>> = [
  {
    key: 'operatingSystems',
    label: 'Operating systems',
    testSubj: 'it-hygiene-tile-operating-systems',
  },
  { key: 'packages', label: 'Packages', testSubj: 'it-hygiene-tile-packages' },
  { key: 'users', label: 'Users', testSubj: 'it-hygiene-tile-users' },
  { key: 'services', label: 'Services', testSubj: 'it-hygiene-tile-services' },
];

/**
 * IT Hygiene summary tiles. Each tile is its own independent index search,
 * so a missing inventory index hides only its own tile, not the whole panel.
 */
export const ItHygieneTiles: React.FC<ItHygieneTilesProps> = props => (
  <StatTileGroup tiles={TILES} results={props} />
);
