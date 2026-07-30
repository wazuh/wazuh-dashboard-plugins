import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiLink, EuiToolTip } from '@elastic/eui';
import { StatTile } from './stat-tile';
import { TabNumber, formatValueSafely } from './tab-number';
import { SeverityBand, SeverityCounts } from '../../interfaces/types';
import { getCore } from '../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { SEVERITY_PRESENTATION } from '../../lib/severity-presentation';

export interface FindingSeverityTilesProps {
  counts: SeverityCounts;
  /** Distinct data-test-subjs when two tile groups share a page. */
  testSubjPrefix?: string;
  /** When set, each number becomes a link that drills into that band. */
  onSelect?: (band: SeverityBand) => string | undefined;
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
    {SEVERITY_PRESENTATION.filter(severity => severity.band in counts).map(
      severity => {
        const bandCount = counts[severity.band];
        const count = <TabNumber value={bandCount} />;
        const value = onSelect ? (
          <EuiToolTip position='top' content={getTooltip?.(severity.band)}>
            <RedirectAppLinks application={getCore().application}>
              <EuiLink
                className='tab-num'
                style={{ fontWeight: 'normal', color: severity.color }}
                href={onSelect(severity.band)}
              >
                {formatValueSafely(bandCount)}
              </EuiLink>
            </RedirectAppLinks>
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
      },
    )}
  </EuiFlexGroup>
);
