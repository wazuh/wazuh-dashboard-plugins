import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiProgress,
  EuiLink,
  EuiText,
} from '@elastic/eui';
import { TopItem } from '../services/types';
import { formatUINumber } from '../../../../../react-services/format-number';

export interface BarListProps {
  items: TopItem[];
  /** If provided, each row label becomes a link to this href. */
  getHref?: (item: TopItem) => string | undefined;
  /** If provided, clicking a row label calls this (SPA navigation). */
  onSelect?: (item: TopItem) => void;
  /** Shown in place of the (otherwise blank) list when `items` is empty. */
  emptyMessage?: React.ReactNode;
  ['data-test-subj']?: string;
}

/** Ranked horizontal bar list (EuiProgress rows) with optional clickable rows. */
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
    <div data-test-subj={rest['data-test-subj']}>
      {items.map(item => (
        <EuiFlexGroup
          key={item.key}
          gutterSize='s'
          alignItems='center'
          responsive={false}
          style={{ marginBottom: 4 }}
        >
          <EuiFlexItem grow={3} style={{ overflow: 'hidden' }}>
            <EuiText size='xs' className='eui-textTruncate'>
              {isInteractive ? (
                <EuiLink
                  href={getHref?.(item)}
                  onClick={onSelect ? () => onSelect(item) : undefined}
                >
                  {item.key}
                </EuiLink>
              ) : (
                item.key
              )}
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={5}>
            <EuiProgress value={item.count} max={max} size='m' />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size='xs' className='tab-num'>
              <strong>{formatUINumber(item.count)}</strong>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      ))}
    </div>
  );
};
