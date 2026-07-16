import React from 'react';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiLink,
  EuiLoadingContent,
  EuiCallOut,
  EuiText,
} from '@elastic/eui';
import { DataGroupStatus } from '../services/types';

export interface WidgetGroupHeaderLink {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface WidgetGroupProps {
  status: DataGroupStatus;
  title: React.ReactNode;
  /** Optional time-semantics caption ("Last 24 hours" / "Current"). */
  caption?: string;
  headerLink?: WidgetGroupHeaderLink;
  errorLabel?: string;
  children: React.ReactNode;
  ['data-test-subj']?: string;
}

/**
 * Maps a data group's status to what renders:
 * - `unavailable` → nothing (the whole widget is hidden — smallest-unit hide)
 * - `loading`     → a skeleton
 * - `error`       → a contained error callout (distinct from unavailable)
 * - `available`   → the widget content
 * Owns the panel + title chrome so hiding removes the panel entirely.
 */
export const WidgetGroup: React.FC<WidgetGroupProps> = ({
  status,
  title,
  caption,
  headerLink,
  errorLabel = 'Could not load data',
  children,
  ...rest
}) => {
  if (status === 'unavailable') {
    return null;
  }

  return (
    <EuiPanel paddingSize='m' hasBorder data-test-subj={rest['data-test-subj']}>
      <EuiFlexGroup alignItems='center' gutterSize='s' responsive={false}>
        <EuiFlexItem>
          <EuiTitle size='xxs'>
            <h3>{title}</h3>
          </EuiTitle>
          {caption && (
            <EuiText size='xs' color='subdued'>
              {caption}
            </EuiText>
          )}
        </EuiFlexItem>
        {headerLink && (
          <EuiFlexItem grow={false}>
            <EuiLink href={headerLink.href} onClick={headerLink.onClick}>
              {headerLink.label}
            </EuiLink>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
      <div style={{ marginTop: 10 }}>
        {status === 'loading' && (
          <div data-test-subj='widget-group-loading'>
            <EuiLoadingContent lines={3} />
          </div>
        )}
        {status === 'error' && (
          <div data-test-subj='widget-group-error'>
            <EuiCallOut
              size='s'
              color='danger'
              iconType='alert'
              title={errorLabel}
            />
          </div>
        )}
        {status === 'available' && children}
      </div>
    </EuiPanel>
  );
};
