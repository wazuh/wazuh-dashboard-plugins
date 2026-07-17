import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { StatTile, TabNumber } from '../common';
import { ScaTilesData } from '../../interfaces/types';
import { UI_COLOR_STATUS } from '../../../../../../../common/constants';

export interface ScaTilesProps {
  tiles: ScaTilesData;
}

/** Below this, the fleet-wide pass rate reads as a posture problem. */
const SCORE_PASS_THRESHOLD = 50;

export const ScaTiles: React.FC<ScaTilesProps> = ({ tiles }) => (
  <EuiFlexGroup gutterSize='m' responsive={false} wrap>
    <EuiFlexItem>
      <StatTile
        value={<TabNumber value={tiles.passed} />}
        label='Passed'
        color={UI_COLOR_STATUS.success}
        reverse
        data-test-subj='sca-tile-passed'
      />
    </EuiFlexItem>
    <EuiFlexItem>
      <StatTile
        value={<TabNumber value={tiles.failed} />}
        label='Failed'
        color={UI_COLOR_STATUS.failed}
        reverse
        data-test-subj='sca-tile-failed'
      />
    </EuiFlexItem>
    <EuiFlexItem>
      <StatTile
        value={<TabNumber value={tiles.notApplicable} />}
        label='N/A'
        color={UI_COLOR_STATUS.notApplicable}
        reverse
        data-test-subj='sca-tile-not-applicable'
      />
    </EuiFlexItem>
    <EuiFlexItem>
      <StatTile
        value={<span className='tab-num'>{tiles.score.toFixed(2)}%</span>}
        label='Score'
        color={
          tiles.score >= SCORE_PASS_THRESHOLD
            ? UI_COLOR_STATUS.success
            : UI_COLOR_STATUS.danger
        }
        reverse
        data-test-subj='sca-tile-score'
      />
    </EuiFlexItem>
  </EuiFlexGroup>
);
