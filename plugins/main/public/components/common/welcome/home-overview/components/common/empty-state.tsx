import React from 'react';
import { EuiEmptyPrompt, EuiIcon, IconSize } from '@elastic/eui';

export interface EmptyStateProps {
  message: React.ReactNode;
  iconType?: string;
  /** `EuiEmptyPrompt` hardcodes `iconType` to a fixed "xxl" icon; passing a
   * pre-sized `EuiIcon` via its `icon` prop is the only way around that. */
  iconSize?: IconSize;
  /** Reserves height so a widget with no data doesn't collapse next to a sibling that has content. */
  minHeight?: number;
  /** Merged with the centering styles — e.g. `{ gridColumn: '1 / -1' }` to span a grid parent. */
  style?: React.CSSProperties;
  ['data-test-subj']?: string;
}

/**
 * Shared "genuinely no data" treatment for ranked lists (`BarList`,
 * `DualBarList`, `DistributionBar`, `TopNTable`) — distinct from
 * `WidgetGroupBody`'s `alert`-icon unavailable/error states, which mean
 * something's actually wrong. `minHeight` keeps a widget with zero results
 * visually balanced next to a sibling panel that has a full 5-item list.
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
      titleSize='xs'
      paddingSize='xs'
      body={<p>{message}</p>}
    />
  </div>
);
