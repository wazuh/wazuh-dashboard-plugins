import React from 'react';
import { EuiProgress, EuiLink, EuiText } from '@elastic/eui';
import { TopItem } from '../../interfaces/types';
import { formatUINumber } from '../../../../../../react-services/format-number';
import { getCore } from '../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';

export interface BarListProps {
  items: TopItem[];
  getHref?: (item: TopItem) => string | undefined;
  onSelect?: (item: TopItem) => void;
  emptyMessage?: React.ReactNode;
  ['data-test-subj']?: string;
}

export const BarList: React.FC<BarListProps> = ({
  items,
  getHref,
  onSelect,
  emptyMessage,
  ...rest
}) => {
  if (items.length === 0) {
    return <div data-test-subj={rest['data-test-subj']}>{emptyMessage}</div>;
  }

  const max = Math.max(1, ...items.map(item => item.count));
  const isInteractive = Boolean(getHref || onSelect);

  return (
    <div
      data-test-subj={rest['data-test-subj']}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, max-content) 1fr max-content',
        columnGap: 8,
        rowGap: 4,
        alignItems: 'center',
      }}
    >
      {items.map(item => (
        <React.Fragment key={item.key}>
          <EuiText
            size='xs'
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
              item.key
            )}
          </EuiText>
          <EuiProgress value={item.count} max={max} size='m' />
          <EuiText size='xs' className='tab-num'>
            <strong>{formatUINumber(item.count)}</strong>
          </EuiText>
        </React.Fragment>
      ))}
    </div>
  );
};
