import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { StatTile, TabNumber } from '../common';
import { ScaTilesData } from '../../interfaces/types';
import { UI_COLOR_STATUS } from '../../../../../../../common/constants';

export interface ScaTilesProps {
  tiles: ScaTilesData;
}

/** Passed/Failed/N-A counts; the score has its own `ScoreGauge` below. */
export const ScaTiles: React.FC<ScaTilesProps> = ({ tiles }) => (
  <EuiFlexGroup gutterSize='m' responsive={false} wrap>
    <EuiFlexItem>
      <StatTile
        value={<TabNumber value={tiles.passed} />}
        label='Passed'
        color={UI_COLOR_STATUS.success}
        titleSize='m'
        reverse
        data-test-subj='sca-tile-passed'
      />
    </EuiFlexItem>
    <EuiFlexItem>
      <StatTile
        value={<TabNumber value={tiles.failed} />}
        label='Failed'
        color={UI_COLOR_STATUS.failed}
        titleSize='m'
        reverse
        data-test-subj='sca-tile-failed'
      />
    </EuiFlexItem>
    <EuiFlexItem>
      <StatTile
        value={<TabNumber value={tiles.notApplicable} />}
        label='N/A'
        color={UI_COLOR_STATUS.info}
        titleSize='m'
        reverse
        data-test-subj='sca-tile-not-applicable'
      />
    </EuiFlexItem>
  </EuiFlexGroup>
);
