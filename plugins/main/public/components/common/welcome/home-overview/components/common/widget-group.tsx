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
import { DataGroupStatus } from '../../interfaces/data-group';

export interface WidgetGroupHeaderLink {
  label: string;
  href?: string;
  onClick?: () => void;
}

export const WIDGET_LOADING_MIN_HEIGHT = {
  /** A top-5 bar list or small table, no hero stat above it. */
  list: 110,
  /** A hero stat tile followed by a top-5 table. */
  heroAndList: 190,
} as const;

export interface WidgetGroupBodyProps {
  status: DataGroupStatus;
  errorLabel?: string;
  /** Skeleton height reserved while loading; see WIDGET_LOADING_MIN_HEIGHT. */
  loadingMinHeight?: number;
  children: React.ReactNode;
}

/**
 * Maps a data group's status to skeleton/error callout/content, without
 * panel or title chrome. Extracted so a panel hosting more than one
 * independently-gated group (e.g. Malware Detection's IOC Match hero +
 * IOC-feed-by-type table, which can degrade separately) can reuse the same
 * status mapping without nesting a second panel inside the first.
 * `WidgetGroup` below is the common one-group-per-panel case, built on this.
 */
export const WidgetGroupBody: React.FC<WidgetGroupBodyProps> = ({
  status,
  errorLabel = 'Could not load data',
  loadingMinHeight,
  children,
}) => (
  <>
    {status === 'loading' && (
      <div data-test-subj='widget-group-loading' style={{ minHeight: loadingMinHeight }}>
        <EuiLoadingContent lines={3} />
      </div>
    )}
    {status === 'error' && (
      <div data-test-subj='widget-group-error' style={{ minHeight: loadingMinHeight }}>
        <EuiCallOut
          size='s'
          color='danger'
          iconType='alert'
          title={errorLabel}
        />
      </div>
    )}
    {status === 'available' && children}
  </>
);

export interface WidgetGroupProps {
  status: DataGroupStatus;
  title: React.ReactNode;
  /** Optional time-semantics caption ("Last 24 hours" / "Current"). */
  caption?: string;
  headerLink?: WidgetGroupHeaderLink;
  errorLabel?: string;
  /**
   * Vertically centers the body when a taller sibling card stretches the
   * panel. Only right for a body that's just a KPI/tile row with nothing
   * below it; a hero/tiles-then-table body reads fine top-anchored (tables
   * have their own trailing space), so this defaults to false.
   */
  centerBody?: boolean;
  /** Skeleton height reserved while loading; see WIDGET_LOADING_MIN_HEIGHT. */
  loadingMinHeight?: number;
  children: React.ReactNode;
  ['data-test-subj']?: string;
}

export const WidgetGroup: React.FC<WidgetGroupProps> = ({
  status,
  title,
  caption,
  headerLink,
  errorLabel,
  centerBody = false,
  loadingMinHeight,
  children,
  ...rest
}) => {
  if (status === 'unavailable') {
    return null;
  }

  return (
    <EuiPanel
      paddingSize='m'
      hasBorder
      data-test-subj={rest['data-test-subj']}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <EuiFlexGroup
        alignItems='center'
        gutterSize='s'
        responsive={false}
        style={{ flexGrow: 0 }}
      >
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
      <div
        style={
          centerBody
            ? {
                marginTop: 10,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }
            : { marginTop: 10 }
        }
      >
        <div>
          <WidgetGroupBody
            status={status}
            errorLabel={errorLabel}
            loadingMinHeight={loadingMinHeight}
          >
            {children}
          </WidgetGroupBody>
        </div>
      </div>
    </EuiPanel>
  );
};
