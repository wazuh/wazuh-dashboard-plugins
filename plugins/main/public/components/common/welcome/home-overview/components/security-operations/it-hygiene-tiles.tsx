import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { WidgetGroupBody, StatTile } from '../common';
import { DataGroupResult } from '../../interfaces/data-group';
import { formatUINumber } from '../../../../../../react-services/format-number';

export interface ItHygieneTilesProps {
  operatingSystems: DataGroupResult<number>;
  packages: DataGroupResult<number>;
  users: DataGroupResult<number>;
  services: DataGroupResult<number>;
}

const TILES: Array<{
  key: keyof ItHygieneTilesProps;
  label: string;
  testSubj: string;
}> = [
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
              <StatTile
                value={
                  <span className='tab-num'>{formatUINumber(result.data)}</span>
                }
                label={tile.label}
                reverse
                data-test-subj={tile.testSubj}
              />
            )}
          </WidgetGroupBody>
        </EuiFlexItem>
      );
    })}
  </EuiFlexGroup>
);
