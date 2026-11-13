import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiLink, EuiProgress, EuiText, EuiToolTip } from '@elastic/eui';
import type { CtiBucket } from '../../../../common/cti-explorer/types';
import { formatNumber } from '../utils/labels';
import { CARD_TEXT_STYLE, NORMAL_FONT_WEIGHT } from '../utils/styles';

interface BreakdownListProps {
  buckets: CtiBucket[];
  /** Share of each bucket is of this total. */
  total: number;
  getLabel?: (key: string) => string;
  /** Color of the bar of each row; the primary color when omitted. */
  getColor?: (key: string) => string;
  /** Selecting a row filters the IOC list on it. */
  onSelect?: (key: string) => void;
  'data-test-subj'?: string;
}

/**
 * Columns of the Home page bar lists: the label column is as wide as the longest
 * label, so every bar starts right after it; count and share follow, each one
 * right-aligned in its own column.
 */
const GRID_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(0, max-content) minmax(40px, 1fr) max-content max-content',
  columnGap: 8,
  rowGap: 10,
  alignItems: 'center',
  width: '100%',
};

const NUMBER_STYLE: React.CSSProperties = {
  ...CARD_TEXT_STYLE,
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
};

/**
 * A breakdown as rows of label, bar, count and share: the bar is the share of
 * the catalog total, so rows of different breakdowns compare on the same scale.
 */
export const BreakdownList = ({
  buckets,
  total,
  getLabel = key => key,
  getColor,
  onSelect,
  'data-test-subj': dataTestSubj,
}: BreakdownListProps) => {
  if (!buckets.length) {
    return (
      <EuiText
        size='s'
        color='subdued'
        style={CARD_TEXT_STYLE}
        data-test-subj={dataTestSubj}
      >
        <p>
          {i18n.translate('wazuh.ctiExplorer.breakdown.empty', {
            defaultMessage: 'No records',
          })}
        </p>
      </EuiText>
    );
  }
  return (
    <div style={GRID_STYLE} data-test-subj={dataTestSubj}>
      {buckets.map(bucket => {
        const label = getLabel(bucket.key);
        const share = total ? (bucket.count / total) * 100 : 0;
        return (
          <React.Fragment key={bucket.key}>
            <EuiText
              size='s'
              className='eui-textTruncate'
              style={CARD_TEXT_STYLE}
            >
              {onSelect ? (
                <EuiToolTip
                  display='block'
                  anchorClassName='eui-textTruncate'
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
                <span title={label}>{label}</span>
              )}
            </EuiText>
            <EuiProgress
              value={bucket.count}
              max={total || 1}
              size='m'
              color={getColor?.(bucket.key) ?? 'primary'}
              aria-label={label}
            />
            <EuiText size='s' style={NUMBER_STYLE}>
              {formatNumber(bucket.count)}
            </EuiText>
            <EuiText size='xs' color='subdued' style={NUMBER_STYLE}>
              {`${share.toFixed(1)}%`}
            </EuiText>
          </React.Fragment>
        );
      })}
    </div>
  );
};
