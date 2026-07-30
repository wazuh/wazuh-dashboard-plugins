import React from 'react';
import { EuiEmptyPrompt, EuiIcon, IconSize } from '@elastic/eui';

export interface EmptyStateProps {
  message: React.ReactNode;
  iconType?: string;
  /** `EuiEmptyPrompt` forces `iconType` to "xxl"; only its `icon` prop resizes. */
  iconSize?: IconSize;
  /** Reserved height, so an empty widget doesn't collapse beside a full one. */
  minHeight?: number;
  /** Merged with the centering styles, e.g. to span a grid parent. */
  style?: React.CSSProperties;
  ['data-test-subj']?: string;
}

/**
 * The "no data" treatment for ranked lists, distinct from `WidgetGroupBody`'s
 * `alert`-icon states, which mean something is actually wrong.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  iconType = 'stats',
  iconSize = 'l',
  minHeight,
  style,
  ...rest
}) => (
  <div
    data-test-subj={rest['data-test-subj']}
    style={{
      minHeight,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...style,
    }}
  >
    <EuiEmptyPrompt
      icon={<EuiIcon type={iconType} size={iconSize} color='subdued' />}
      body={<p>{message}</p>}
    />
  </div>
);
