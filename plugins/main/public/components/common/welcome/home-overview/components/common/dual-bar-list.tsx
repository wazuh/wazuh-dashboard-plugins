import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { UI_COLOR_STATUS } from '../../../../../../../common/constants';
import { decimalFormat } from '../../../utils/helpers';
import { BarTrack, LegendItem } from './bar-track';
import { EmptyState } from './empty-state';
import { ListTitle } from './list-chrome';
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

const LABEL_MAX_WIDTH = 150;

/**
 * Ranked pass/fail bars (e.g. SCA benchmarks): label, two-color bar, score.
 * Same grid as `BarList`, so both read as one family.
 */
export const DualBarList: React.FC<DualBarListProps> = ({
  items,
  title,
  emptyMessage,
  ...rest
}) => {
  const testSubj = rest['data-test-subj'];

  if (items.length === 0) {
    return (
      <EmptyState
        message={emptyMessage}
        minHeight={WIDGET_LOADING_MIN_HEIGHT.list}
        data-test-subj={testSubj ? `${testSubj}-empty` : undefined}
      />
    );
  }

  const formatter = decimalFormat();

  return (
    <div data-test-subj={testSubj}>
      {title && <ListTitle>{title}</ListTitle>}
      <EuiFlexGroup
        gutterSize='m'
        responsive={false}
        style={{ marginBottom: 10 }}
      >
        <EuiFlexItem grow={false}>
          <LegendItem color={UI_COLOR_STATUS.success} label='Passed' />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <LegendItem color={UI_COLOR_STATUS.failed} label='Failed' />
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
                style={{ overflow: 'hidden', maxWidth: LABEL_MAX_WIDTH }}
                title={item.label}
              >
                {item.label}
              </EuiText>
              <div style={{ padding: '6px 0' }}>
                <BarTrack>
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
                </BarTrack>
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
