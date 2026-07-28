import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { UI_COLOR_STATUS } from '../../../../../../../common/constants';
import { decimalFormat } from '../../../utils/helpers';
import { LegendDot } from './distribution-bar';
import { EmptyState } from './empty-state';
import { WIDGET_LOADING_MIN_HEIGHT } from './widget-group';

export interface DualBarListItem {
  key: string;
  label: string;
  passed: number;
  failed: number;
  /** Fraction (0..1): passed / (passed + failed). */
  score: number;
}

export interface DualBarListProps {
  items: DualBarListItem[];
  title?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  ['data-test-subj']?: string;
}

/**
 * A ranked list of pass/fail dual-segment bars (e.g. SCA benchmarks), one row
 * per item: label, a two-color bar, and the resulting score. Same grid layout
 * as `BarList`, so the two read as one family of ranked-bar visualizations.
 */
export const DualBarList: React.FC<DualBarListProps> = ({
  items,
  title,
  emptyMessage,
  ...rest
}) => {
  if (items.length === 0) {
    return (
      <EmptyState
        message={emptyMessage}
        minHeight={WIDGET_LOADING_MIN_HEIGHT.list}
        data-test-subj={rest['data-test-subj']}
      />
    );
  }

  const formatter = decimalFormat();

  return (
    <div data-test-subj={rest['data-test-subj']}>
      {title && (
        <EuiText
          size='xs'
          style={{
            paddingTop: 4,
            paddingBottom: 6,
            marginBottom: 10,
            borderBottom: '1px solid rgba(128, 128, 128, 0.2)',
          }}
        >
          <strong>{title}</strong>
        </EuiText>
      )}
      <EuiFlexGroup
        gutterSize='m'
        responsive={false}
        style={{ marginBottom: 10 }}
      >
        <EuiFlexItem grow={false}>
          <EuiText
            size='xs'
            color='subdued'
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <LegendDot color={UI_COLOR_STATUS.success} />
            Passed
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText
            size='xs'
            color='subdued'
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <LegendDot color={UI_COLOR_STATUS.failed} />
            Failed
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, max-content) 1fr max-content',
          columnGap: 8,
          rowGap: 10,
          alignItems: 'center',
        }}
      >
        {items.map(item => {
          const total = item.passed + item.failed;
          const passPct = total > 0 ? (item.passed / total) * 100 : 0;
          const failPct = total > 0 ? 100 - passPct : 0;
          return (
            <React.Fragment key={item.key}>
              <EuiText
                size='s'
                className='eui-textTruncate'
                style={{ overflow: 'hidden', maxWidth: '150px' }}
                title={item.label}
              >
                {item.label}
              </EuiText>
              <div style={{ padding: '6px 0' }}>
                <div
                  style={{
                    display: 'flex',
                    height: 10,
                    borderRadius: 4,
                    overflow: 'hidden',
                    background: 'rgba(128, 128, 128, 0.15)',
                  }}
                >
                  {passPct > 0 && (
                    <div
                      style={{
                        width: `${passPct}%`,
                        background: UI_COLOR_STATUS.success,
                      }}
                    />
                  )}
                  {failPct > 0 && (
                    <div
                      style={{
                        width: `${failPct}%`,
                        background: UI_COLOR_STATUS.failed,
                      }}
                    />
                  )}
                </div>
              </div>
              <EuiText size='s' className='tab-num'>
                <strong>{formatter.convert(item.score)}</strong>
              </EuiText>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
