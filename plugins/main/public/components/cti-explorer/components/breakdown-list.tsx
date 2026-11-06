import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiProgress,
  EuiText,
  EuiTextColor,
  EuiToolTip,
} from '@elastic/eui';
import type { CtiBucket } from '../../../../common/cti-explorer/types';
import { formatNumber } from '../utils/labels';
import { NORMAL_FONT_WEIGHT } from '../utils/styles';

interface BreakdownListProps {
  buckets: CtiBucket[];
  /** Share of each bucket is of this total. */
  total: number;
  getLabel?: (key: string) => string;
  /** Selecting a row filters the IOC list on it. */
  onSelect?: (key: string) => void;
  'data-test-subj'?: string;
}

/**
 * A breakdown as rows of label, bar and count: the bar is the share of the
 * catalog total, so rows of different breakdowns compare on the same scale.
 */
export const BreakdownList = ({
  buckets,
  total,
  getLabel = key => key,
  onSelect,
  'data-test-subj': dataTestSubj,
}: BreakdownListProps) => {
  if (!buckets.length) {
    return (
      <EuiText size='s' color='subdued' data-test-subj={dataTestSubj}>
        <p>
          {i18n.translate('wazuh.ctiExplorer.breakdown.empty', {
            defaultMessage: 'No records',
          })}
        </p>
      </EuiText>
    );
  }
  return (
    <div data-test-subj={dataTestSubj}>
      {buckets.map(bucket => {
        const label = getLabel(bucket.key);
        const share = total ? (bucket.count / total) * 100 : 0;
        const shareText = `${share.toFixed(1)}%`;
        return (
          <EuiFlexGroup
            key={bucket.key}
            gutterSize='s'
            alignItems='center'
            responsive={false}
          >
            <EuiFlexItem grow={4} style={{ minWidth: 0 }}>
              <EuiText size='s' className='eui-textTruncate'>
                {onSelect ? (
                  <EuiToolTip
                    content={i18n.translate(
                      'wazuh.ctiExplorer.breakdown.filterTooltip',
                      {
                        defaultMessage: 'Show the records of {label}',
                        values: { label },
                      },
                    )}
                  >
                    <EuiLink
                      onClick={() => onSelect(bucket.key)}
                      style={NORMAL_FONT_WEIGHT}
                      data-test-subj={`${dataTestSubj}-${bucket.key}`}
                    >
                      {label}
                    </EuiLink>
                  </EuiToolTip>
                ) : (
                  label
                )}
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={5}>
              <EuiProgress
                value={bucket.count}
                max={total || 1}
                size='s'
                color='primary'
                aria-label={label}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ minWidth: '9em' }}>
              <EuiText size='s' textAlign='right'>
                {formatNumber(bucket.count)}{' '}
                <EuiTextColor color='subdued'>
                  <small>{shareText}</small>
                </EuiTextColor>
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        );
      })}
    </div>
  );
};
