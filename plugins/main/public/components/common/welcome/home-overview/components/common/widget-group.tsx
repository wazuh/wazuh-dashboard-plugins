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
import { VALUE_PLACEHOLDER } from '../../lib/constants';
import { getCore } from '../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';

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
  /**
   * How a non-data state (`unavailable` / `error`) fills the body:
   * - `'dash'`  → a value-styled "-" (pure KPI panels).
   * - `'inline'`→ a compact line: an error callout, or a neutral "Not available".
   */
  errorDisplay?: 'inline' | 'dash';
  /** Skeleton height reserved while loading; see WIDGET_LOADING_MIN_HEIGHT. */
  loadingMinHeight?: number;
  children: React.ReactNode;
}

/**
 * Maps a data group's status to skeleton / placeholder / content, without panel
 * or title chrome. A widget is **never hidden**: `unavailable` (benign, data
 * source absent) and `error` (a real failure) both render a placeholder here;
 * the failure toast is raised upstream in `useDataGroup`, not here.
 * `WidgetGroup` below is the common one-group-per-panel case, built on this.
 */
export const WidgetGroupBody: React.FC<WidgetGroupBodyProps> = ({
  status,
  errorLabel = 'Could not load data',
  errorDisplay = 'inline',
  loadingMinHeight,
  children,
}) => {
  if (status === 'loading') {
    return (
      <div
        data-test-subj='widget-group-loading'
        style={{ minHeight: loadingMinHeight }}
      >
        <EuiLoadingContent lines={3} />
      </div>
    );
  }
  if (status === 'available') {
    return <>{children}</>;
  }

  // 'unavailable' | 'error' — never hidden.
  const isError = status === 'error';
  const testSubj = isError ? 'widget-group-error' : 'widget-group-unavailable';
  const containerStyle = {
    minHeight: loadingMinHeight,
    height: '100%',
    alignContent: 'center',
  } as const;

  if (errorDisplay === 'dash') {
    return (
      <div
        data-test-subj={testSubj}
        style={{ ...containerStyle, textAlign: 'center' }}
      >
        <EuiText color='subdued' className='tab-num'>
          {VALUE_PLACEHOLDER}
        </EuiText>
      </div>
    );
  }

  return (
    <div data-test-subj={testSubj} style={containerStyle}>
      {isError ? (
        <EuiCallOut
          size='s'
          color='danger'
          iconType='alert'
          title={errorLabel}
        />
      ) : (
        <EuiText size='s' color='subdued'>
          Not available
        </EuiText>
      )}
    </div>
  );
};

export interface WidgetGroupProps {
  status: DataGroupStatus;
  title: React.ReactNode;
  /** Optional time-semantics caption ("Last 24 hours" / "Current"). */
  caption?: string;
  headerLink?: WidgetGroupHeaderLink;
  errorLabel?: string;
  /** See WidgetGroupBody: 'dash' for pure-KPI panels, 'inline' (default) otherwise. */
  errorDisplay?: 'inline' | 'dash';
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
  errorDisplay,
  centerBody = false,
  loadingMinHeight,
  children,
  ...rest
}) => {
  return (
    <EuiPanel
      paddingSize='m'
      hasBorder
      data-test-subj={rest['data-test-subj']}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ flexGrow: 0 }}>
        <EuiFlexGroup alignItems='center' gutterSize='s' responsive={false}>
          <EuiFlexItem>
            <EuiTitle size='xxs'>
              <h3>{title}</h3>
            </EuiTitle>
          </EuiFlexItem>
          {headerLink && (
            <EuiFlexItem grow={false}>
              <RedirectAppLinks application={getCore().application}>
                <EuiLink href={headerLink.href} onClick={headerLink.onClick}>
                  {headerLink.label}
                </EuiLink>
              </RedirectAppLinks>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
        {caption && (
          <EuiText size='xs' color='subdued'>
            {caption}
          </EuiText>
        )}
      </div>
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
            errorDisplay={errorDisplay}
            loadingMinHeight={loadingMinHeight}
          >
            {children}
          </WidgetGroupBody>
        </div>
      </div>
    </EuiPanel>
  );
};
