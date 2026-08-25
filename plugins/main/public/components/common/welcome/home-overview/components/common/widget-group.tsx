import React from 'react';
import {
  EuiPanel,
  EuiTitle,
  EuiLink,
  EuiLoadingContent,
  EuiCallOut,
  EuiText,
  EuiToolTip,
  EuiEmptyPrompt,
} from '@elastic/eui';
import { DataGroupStatus } from '../../interfaces/data-group';
import { VALUE_PLACEHOLDER } from '../../lib/constants';
import { ErrorValuePlaceholder } from './tab-number';
import { getCore } from '../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';

export interface WidgetGroupTitleLink {
  /** Destination URL, built by `../../utils/navigation`. */
  href?: string;
  onClick?: () => void;
  /**
   * Module the title navigates to, named in the tooltip. Only needed when the
   * title itself isn't the module name ("Top 5 operating systems" navigating to
   * IT Hygiene); otherwise the title is used.
   */
  destination?: string;
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
   * Set when the failure is a missing index pattern, so a "Manage index
   * patterns" link can be offered next to the message (only rendered on
   * `unavailable`, the status a missing index pattern maps to).
   */
  showManageIndexPatternsLink?: boolean;
  isPermissionDenied?: boolean;
  /**
   * How a non-data state (`unavailable` / `error`) fills the body:
   * - `'dash'`  → a value-styled "-"; danger-colored with a tooltip on `error`
   *   (pure KPI panels).
   * - `'inline'`→ a compact line: an error callout, or a neutral "Not available".
   */
  errorDisplay?: 'inline' | 'dash';
  /** Skeleton height reserved while loading; see WIDGET_LOADING_MIN_HEIGHT. */
  loadingMinHeight?: number;
  children: React.ReactNode;
}

const MANAGE_INDEX_PATTERNS_PATH = '/opensearch-dashboards/indexPatterns';

const ManageIndexPatternsLink: React.FC = () => (
  <RedirectAppLinks application={getCore().application}>
    <EuiLink
      href={getCore().application.getUrlForApp('management', {
        path: MANAGE_INDEX_PATTERNS_PATH,
      })}
    >
      Manage index patterns
    </EuiLink>
  </RedirectAppLinks>
);

/**
 * Maps a data group's status to skeleton / placeholder / content, without panel
 * or title chrome. A widget is **never hidden**: `unavailable` (benign, data
 * source absent) and `error` (a real failure) both render a placeholder here;
 * the failure toast is raised upstream in `useDataGroup`, not here.
 * `WidgetGroup` below is the common one-group-per-panel case, built on this.
 */
export const WidgetGroupBody: React.FC<WidgetGroupBodyProps> = ({
  status,
  errorLabel,
  showManageIndexPatternsLink = false,
  isPermissionDenied = false,
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
  const label =
    errorLabel ?? (isError ? 'Could not load data' : 'Not available');
  const errorColor = isPermissionDenied ? 'warning' : 'danger';
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
        {isError ? (
          <ErrorValuePlaceholder tooltip={label} color={errorColor} />
        ) : errorLabel ? (
          <EuiToolTip position='top' content={errorLabel}>
            <EuiText color='subdued' className='tab-num'>
              {VALUE_PLACEHOLDER}
            </EuiText>
          </EuiToolTip>
        ) : (
          <EuiText color='subdued' className='tab-num'>
            {VALUE_PLACEHOLDER}
          </EuiText>
        )}
      </div>
    );
  }

  return (
    <div data-test-subj={testSubj} style={containerStyle}>
      {isError ? (
        <EuiCallOut
          size='s'
          color={errorColor}
          iconType='alert'
          title={label}
        />
      ) : (
        <EuiEmptyPrompt
          iconType='alert'
          body={<p>{label}</p>}
          actions={
            showManageIndexPatternsLink ? (
              <ManageIndexPatternsLink />
            ) : undefined
          }
        />
      )}
    </div>
  );
};

/**
 * Title as the card's link into its module, with a tooltip spelling out where
 * the click lands — the top-right "see more" links this replaced said it in the
 * label instead.
 */
const WidgetGroupTitle: React.FC<{
  title: string;
  link: WidgetGroupTitleLink;
}> = ({ title, link }) => (
  <RedirectAppLinks application={getCore().application}>
    <EuiToolTip position='top' content={`Go to ${link.destination ?? title}`}>
      <EuiLink href={link.href} onClick={link.onClick}>
        {title}
      </EuiLink>
    </EuiToolTip>
  </RedirectAppLinks>
);

export interface WidgetGroupProps {
  status: DataGroupStatus;
  title: string;
  /** Optional time-semantics caption ("Last 24 hours" / "Current"). */
  caption?: string;
  /**
   * Makes the title the card's only navigation affordance: no redundant
   * top-right link, so every card exposes one way into its module.
   */
  titleLink?: WidgetGroupTitleLink;
  errorLabel?: string;
  /** See WidgetGroupBody: only rendered on `unavailable`. */
  showManageIndexPatternsLink?: boolean;
  /** See WidgetGroupBody: warning instead of danger coloring on `error`. */
  isPermissionDenied?: boolean;
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
  titleLink,
  errorLabel,
  showManageIndexPatternsLink,
  isPermissionDenied,
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
        <EuiTitle size='xxs'>
          <h3>
            {titleLink ? (
              <WidgetGroupTitle title={title} link={titleLink} />
            ) : (
              title
            )}
          </h3>
        </EuiTitle>
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
            showManageIndexPatternsLink={showManageIndexPatternsLink}
            isPermissionDenied={isPermissionDenied}
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
