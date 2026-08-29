import React from 'react';
import { StatTileGroup, StatTileSpec } from '../common';
import { DataGroupResult } from '../../interfaces/data-group';
import {
  getItHygieneServicesTabUrl,
  getItHygieneSoftwareUrl,
  getItHygieneSystemOsUrl,
  getItHygieneUsersTabUrl,
} from '../../utils/navigation';
import { homeOverviewI18n } from '../../i18n';

export interface ItHygieneTilesProps {
  operatingSystems: DataGroupResult<number>;
  packages: DataGroupResult<number>;
  users: DataGroupResult<number>;
  services: DataGroupResult<number>;
}

const TILES: ReadonlyArray<StatTileSpec<keyof ItHygieneTilesProps>> = [
  {
    key: 'operatingSystems',
    label: homeOverviewI18n.operatingSystems,
    testSubj: 'it-hygiene-tile-operating-systems',
    onSelect: () => getItHygieneSystemOsUrl(),
  },
  {
    key: 'packages',
    label: homeOverviewI18n.packages,
    testSubj: 'it-hygiene-tile-packages',
    onSelect: getItHygieneSoftwareUrl,
  },
  {
    key: 'users',
    label: homeOverviewI18n.users,
    testSubj: 'it-hygiene-tile-users',
    onSelect: getItHygieneUsersTabUrl,
  },
  {
    key: 'services',
    label: homeOverviewI18n.services,
    testSubj: 'it-hygiene-tile-services',
    onSelect: getItHygieneServicesTabUrl,
  },
];

/**
 * IT Hygiene summary tiles. Each tile is its own independent index search,
 * so a missing inventory index hides only its own tile, not the whole panel.
 */
export const ItHygieneTiles: React.FC<ItHygieneTilesProps> = props => (
  <StatTileGroup tiles={TILES} results={props} />
);
