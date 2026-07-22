import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiLink, EuiToolTip } from '@elastic/eui';
import { StatTile } from './stat-tile';
import { TabNumber } from './tab-number';
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
  {
    band: 'informational',
    label: 'Informational',
    color: UI_COLOR_STATUS.disabled,
  },
  {
    band: 'pending',
    label: 'Pending',
    color: UI_COLOR_STATUS.disabled,
  },
];

export interface FindingSeverityTilesProps {
  counts: SeverityCounts;
  /** Distinct data-test-subjs when two tile groups share a page. */
  testSubjPrefix?: string;
  /** When set, each number becomes a link that drills into that band. */
  onSelect?: (band: SeverityBand) => void;
  /** Tooltip content per band, shown only when `onSelect` is set. */
  getTooltip?: (band: SeverityBand) => React.ReactNode;
}

export const FindingSeverityTiles: React.FC<FindingSeverityTilesProps> = ({
  counts,
  testSubjPrefix = 'finding-severity',
  onSelect,
  getTooltip,
}) => (
  <EuiFlexGroup gutterSize='m' responsive={false} wrap>
    {SEVERITY_PRESENTATION.filter(
      severity => counts[severity.band] !== undefined,
    ).map(severity => {
      const bandCount = counts[severity.band] ?? 0;
      const count = <TabNumber value={bandCount} />;
      const value = onSelect ? (
        <EuiToolTip position='top' content={getTooltip?.(severity.band)}>
          <EuiLink
            className='tab-num'
            style={{ fontWeight: 'normal', color: severity.color }}
            onClick={() => onSelect(severity.band)}
          >
            {formatUINumber(bandCount)}
          </EuiLink>
        </EuiToolTip>
      ) : (
        count
      );
      return (
        <EuiFlexItem key={severity.band}>
          <StatTile
            value={value}
            label={severity.label}
            color={severity.color}
            reverse
            data-test-subj={`${testSubjPrefix}-${severity.band}`}
          />
        </EuiFlexItem>
      );
    })}
  </EuiFlexGroup>
);
