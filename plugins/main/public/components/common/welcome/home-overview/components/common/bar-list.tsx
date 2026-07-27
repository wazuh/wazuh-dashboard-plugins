import React from 'react';
import { EuiProgress, EuiLink, EuiText } from '@elastic/eui';
import { TopItem } from '../../interfaces/types';
import { formatUINumber } from '../../../../../../react-services/format-number';
import { getCore } from '../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { EmptyState } from './empty-state';
import { WIDGET_LOADING_MIN_HEIGHT } from './widget-group';
import { UI_COLOR_STATUS } from '../../../../../../../common/constants';

export interface BarListProps {
  items: TopItem[];
  /** Small caption above the list, e.g. "Top 5 modified files". */
  title?: React.ReactNode;
  getHref?: (item: TopItem) => string | undefined;
  onSelect?: (item: TopItem) => void;
  emptyMessage?: React.ReactNode;
  ['data-test-subj']?: string;
}

export const BarList: React.FC<BarListProps> = ({
  items = [],
  title,
  getHref,
  onSelect,
  emptyMessage,
  ...rest
}) => {
  const max = Math.max(1, ...items.map(item => item.count));
  const isInteractive = Boolean(getHref || onSelect);

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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, max-content) 1fr max-content',
          columnGap: 8,
          rowGap: 10,
          alignItems: 'center',
          width: '100%',
        }}
      >
        {items.length === 0 && (
          <EmptyState
            message={emptyMessage}
            minHeight={WIDGET_LOADING_MIN_HEIGHT.list}
            style={{ gridColumn: '1 / -1' }}
            data-test-subj={rest['data-test-subj']}
          />
        )}
        {items.length > 0 &&
          items.map(item => (
            <React.Fragment key={item.key}>
              <EuiText
                size='s'
                className='eui-textTruncate'
                style={{ overflow: 'hidden' }}
              >
                {isInteractive ? (
                  <RedirectAppLinks application={getCore().application}>
                    <EuiLink
                      href={getHref?.(item)}
                      onClick={onSelect ? () => onSelect(item) : undefined}
                    >
                      {item.key}
                    </EuiLink>
                  </RedirectAppLinks>
                ) : (
                  <span
                    style={{
                      cursor: 'default',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={item.key}
                  >
                    {item.key}
                  </span>
                )}
              </EuiText>
              <div style={{ padding: '6px 0' }}>
                <EuiProgress value={item.count} max={max} size='m' color={UI_COLOR_STATUS.info} />
              </div>
              <EuiText size='s' className='tab-num'>
                <strong>{formatUINumber(item.count)}</strong>
              </EuiText>
            </React.Fragment>
          ))}
      </div>
    </div>
  );
};
