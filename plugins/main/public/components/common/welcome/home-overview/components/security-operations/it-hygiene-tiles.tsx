import React from 'react';
import { i18n } from '@osd/i18n';
import { StatTileGroup, StatTileSpec } from '../common';
import { DataGroupResult } from '../../interfaces/data-group';
import {
  getItHygieneServicesTabUrl,
  getItHygieneSoftwareUrl,
  getItHygieneSystemOsUrl,
  getItHygieneUsersTabUrl,
} from '../../utils/navigation';

export interface ItHygieneTilesProps {
  operatingSystems: DataGroupResult<number>;
  packages: DataGroupResult<number>;
  users: DataGroupResult<number>;
  services: DataGroupResult<number>;
}

const TILES: ReadonlyArray<StatTileSpec<keyof ItHygieneTilesProps>> = [
  {
    key: 'operatingSystems',
    label: i18n.translate(
      'wazuh.common.homeOverviewItHygieneTiles.operatingSystems',
      { defaultMessage: 'Operating systems' },
    ),
    testSubj: 'it-hygiene-tile-operating-systems',
    onSelect: () => getItHygieneSystemOsUrl(),
  },
  {
    key: 'packages',
    label: i18n.translate('wazuh.common.homeOverviewItHygieneTiles.packages', {
      defaultMessage: 'Packages',
    }),
    testSubj: 'it-hygiene-tile-packages',
    onSelect: getItHygieneSoftwareUrl,
  },
  {
    key: 'users',
    label: i18n.translate('wazuh.common.homeOverviewItHygieneTiles.users', {
      defaultMessage: 'Users',
    }),
    testSubj: 'it-hygiene-tile-users',
    onSelect: getItHygieneUsersTabUrl,
  },
  {
    key: 'services',
    label: i18n.translate('wazuh.common.homeOverviewItHygieneTiles.services', {
      defaultMessage: 'Services',
    }),
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
