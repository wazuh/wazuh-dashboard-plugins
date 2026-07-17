import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { StatTile } from './stat-tile';
import { SeverityBand, SeverityCounts } from '../../interfaces/types';
import { formatUINumber } from '../../../../../../react-services/format-number';
import { UI_COLOR_STATUS } from '../../../../../../../common/constants';

const SEVERITY_PRESENTATION: Array<{
  band: SeverityBand;
  label: string;
  color: string;
}> = [
  { band: 'critical', label: 'Critical', color: UI_COLOR_STATUS.danger },
  { band: 'high', label: 'High', color: UI_COLOR_STATUS.warning },
  { band: 'medium', label: 'Medium', color: UI_COLOR_STATUS.info },
  { band: 'low', label: 'Low', color: UI_COLOR_STATUS.success },
];

export interface FindingSeverityTilesProps {
  counts: SeverityCounts;
  /** Distinct data-test-subjs when two tile groups share a page. */
  testSubjPrefix?: string;
}

export const FindingSeverityTiles: React.FC<FindingSeverityTilesProps> = ({
  counts,
  testSubjPrefix = 'finding-severity',
}) => (
  <EuiFlexGroup gutterSize='m' responsive={false} wrap>
    {SEVERITY_PRESENTATION.map(severity => (
      <EuiFlexItem key={severity.band}>
        <StatTile
          value={
            <span className='tab-num'>
              {formatUINumber(counts[severity.band])}
            </span>
          }
          label={severity.label}
          color={severity.color}
          reverse
          data-test-subj={`${testSubjPrefix}-${severity.band}`}
        />
      </EuiFlexItem>
    ))}
  </EuiFlexGroup>
);
