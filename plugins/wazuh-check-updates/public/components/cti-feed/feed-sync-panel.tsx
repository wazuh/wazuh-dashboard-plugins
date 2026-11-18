import React, { useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButton,
  EuiButtonIcon,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiLoadingContent,
  EuiLoadingSpinner,
  EuiPanel,
  EuiProgress,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import type { CtiConsumer } from '../../../common/cti-consumers';
import {
  FeedSyncSummary,
  getConsumerSyncState,
} from '../../services/cti-consumer-sync-state';
import {
  getFeedCatalogLabel,
  getFeedMetadata,
  sortFeeds,
} from './feed-metadata';
import { FeedSyncBadge } from './feed-sync-badge';
import { FeedDetailsFlyout } from './feed-details-flyout';
import { CtiTimestamp } from './cti-timestamp';
import { FeedContentLine, hasFeedContent } from './feed-content';
import type { FeedContentCounts } from '../../services/cti-feed';
import { getCore } from '../../plugin-services';
import { RedirectAppLinks } from '../../../../../src/plugins/opensearch_dashboards_react/public';

/** Stable key of a feed across reads: its `type`, or its `name` if missing. */
const getFeedKey = (consumer: CtiConsumer) => consumer.type || consumer.name;

interface SummaryView {
  iconType: string;
  iconColor: string;
  title: string;
}

/**
 * `checking`: an update is known to be running, but no feed shows it syncing yet (it
 * may never, when there is nothing new).
 */
type PanelSummary = FeedSyncSummary | 'checking';

function getSummaryView(summary: PanelSummary): SummaryView {
  switch (summary) {
    case 'checking':
      return {
        iconType: 'refresh',
        iconColor: 'primary',
        title: i18n.translate('wazuhCheckUpdates.ctiFeed.sync.checkingTitle', {
          defaultMessage: 'Content update in progress',
        }),
      };
    case 'upToDate':
      return {
        iconType: 'check',
        iconColor: 'success',
        title: i18n.translate('wazuhCheckUpdates.ctiFeed.sync.upToDateTitle', {
          defaultMessage: 'All feeds are up to date',
        }),
      };
    case 'syncing':
      return {
        iconType: 'refresh',
        iconColor: 'primary',
        title: i18n.translate('wazuhCheckUpdates.ctiFeed.sync.syncingTitle', {
          defaultMessage: 'Syncing new content',
        }),
      };
    case 'retryPending':
      return {
        iconType: 'alert',
        iconColor: 'warning',
        title: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.sync.retryPendingTitle',
          { defaultMessage: 'Some sync steps are waiting to be retried' },
        ),
      };
    case 'pending':
      return {
        iconType: 'clock',
        iconColor: 'primary',
        title: i18n.translate('wazuhCheckUpdates.ctiFeed.sync.pendingTitle', {
          defaultMessage: 'New content is available',
        }),
      };
    case 'failed':
      return {
        iconType: 'alert',
        iconColor: 'danger',
        title: i18n.translate('wazuhCheckUpdates.ctiFeed.sync.failedTitle', {
          defaultMessage: 'Some feeds could not sync',
        }),
      };
    case 'empty':
      return {
        iconType: 'empty',
        iconColor: 'subdued',
        title: i18n.translate('wazuhCheckUpdates.ctiFeed.sync.emptyTitle', {
          defaultMessage: 'No feed content yet',
        }),
      };
    default:
      return {
        iconType: 'questionInCircle',
        iconColor: 'subdued',
        title: i18n.translate('wazuhCheckUpdates.ctiFeed.sync.unknownTitle', {
          defaultMessage: 'Sync state unknown',
        }),
      };
  }
}

const renderLastUpdated = (time: string) =>
  i18n.translate('wazuhCheckUpdates.ctiFeed.sync.lastUpdated', {
    defaultMessage: 'Last updated: {time}',
    values: { time },
  });

/**
 * How far a syncing feed is. While the new content is prepared (`local_offset` 0, e.g.
 * a plan change downloading a snapshot), caught up with the remote content but still
 * running (the indexer is applying what it downloaded), or with no known remote
 * offset, there is no meaningful percentage: the bar is indeterminate instead of one
 * stuck at 0% or full and not moving.
 */
const SyncProgress: React.FC<{
  progress: number | null;
  preparing: boolean;
}> = ({ progress, preparing }) => {
  const percent = progress === null ? null : Math.round(progress * 100);
  if (!preparing && percent !== null && percent < 100) {
    return (
      <EuiProgress
        value={percent}
        max={100}
        size='s'
        color='primary'
        valueText={i18n.translate('wazuhCheckUpdates.ctiFeed.sync.progress', {
          defaultMessage: '{percent}% synced',
          values: { percent },
        })}
        data-test-subj='ctiFeedSyncProgress'
      />
    );
  }
  return (
    <>
      <EuiText
        size='xs'
        color='subdued'
        textAlign='right'
        data-test-subj='ctiFeedSyncProgressCaption'
      >
        {preparing
          ? i18n.translate('wazuhCheckUpdates.ctiFeed.sync.preparing', {
              defaultMessage: 'Preparing the new content',
            })
          : percent === null
          ? i18n.translate('wazuhCheckUpdates.ctiFeed.sync.downloading', {
              defaultMessage: 'Downloading content',
            })
          : i18n.translate('wazuhCheckUpdates.ctiFeed.sync.finishing', {
              defaultMessage: 'Finishing the sync',
            })}
      </EuiText>
      <EuiProgress
        size='s'
        color='primary'
        data-test-subj='ctiFeedSyncProgress'
      />
    </>
  );
};

const FeedRow: React.FC<{
  consumer: CtiConsumer;
  onOpen: () => void;
  contentCounts: FeedContentCounts | null;
  contentLoading: boolean;
}> = ({ consumer, onOpen, contentCounts, contentLoading }) => {
  const metadata = getFeedMetadata(consumer);
  const state = getConsumerSyncState(consumer);

  // The clickable part opens the details; the content line sits outside it, as its
  // links cannot go inside a button.
  return (
    <EuiPanel
      color='subdued'
      hasShadow={false}
      paddingSize='none'
      className='ctiFeed__feedRow'
      data-test-subj='ctiFeedSyncRowContainer'
    >
      <EuiPanel
        color='transparent'
        hasShadow={false}
        paddingSize='m'
        onClick={onOpen}
        aria-haspopup='dialog'
        className='ctiFeed__feedRowButton'
        data-test-subj='ctiFeedSyncRow'
      >
        <EuiFlexGroup gutterSize='m' alignItems='center' responsive={false}>
          <EuiFlexItem grow={false}>
            <span className='ctiFeed__feedIcon'>
              <EuiIcon type={metadata.iconType} aria-hidden />
            </span>
          </EuiFlexItem>
          <EuiFlexItem style={{ minWidth: 0 }}>
            <EuiText size='s'>
              <strong>{metadata.label}</strong>
            </EuiText>
            <EuiText size='xs' color='subdued'>
              {metadata.description}
            </EuiText>
            <EuiText size='xs' color='subdued' data-test-subj='ctiFeedCatalog'>
              {getFeedCatalogLabel(consumer)}
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup
              direction='column'
              alignItems='flexEnd'
              gutterSize='xs'
              responsive={false}
            >
              <EuiFlexItem grow={false}>
                <FeedSyncBadge state={state} />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <CtiTimestamp
                  timestamp={consumer.updated_at}
                  renderText={renderLastUpdated}
                  dataTestSubj='ctiFeedUpdatedAt'
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiIcon type='arrowRight' color='subdued' aria-hidden />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
      {/* One line under the row, so it keeps its height whatever the state: the sync
          progress while syncing (the counts are about to change), otherwise what
          the feed delivered. */}
      {state.kind === 'syncing' || hasFeedContent(consumer.type) ? (
        <div className='ctiFeed__feedRowFooter'>
          {state.kind === 'syncing' ? (
            <SyncProgress
              progress={state.progress}
              preparing={state.preparing}
            />
          ) : (
            <FeedContentLine
              feedType={consumer.type}
              counts={contentCounts}
              loading={contentLoading}
            />
          )}
        </div>
      ) : null}
    </EuiPanel>
  );
};

export interface FeedSyncPanelProps {
  consumers: CtiConsumer[];
  summary: FeedSyncSummary;
  loading: boolean;
  /** A read is in flight: the refresh button waits for it. */
  refreshing: boolean;
  error: string | null;
  /** Reads the sync state again, from the refresh button or after an error. */
  onRefresh: () => void;
  /** Called after an update check is requested from a feed's details. */
  onUpdateRequested: () => void | Promise<void>;
  /** A feed is syncing, or an update is known to be running. */
  updateInProgress?: boolean;
  /** An update is known to be running (see `CheckForUpdatesButton`). */
  onUpdateRunning?: () => void;
  /** What each feed has delivered, shown in its row. */
  contentCounts?: FeedContentCounts | null;
  contentLoading?: boolean;
}

export const FeedSyncPanel: React.FC<FeedSyncPanelProps> = ({
  consumers,
  summary,
  loading,
  refreshing,
  error,
  onRefresh,
  onUpdateRequested,
  updateInProgress,
  onUpdateRunning,
  contentCounts = null,
  contentLoading = false,
}) => {
  // An update known to be running leads, until a feed shows it (or something failed).
  const panelSummary: PanelSummary =
    updateInProgress && (summary === 'upToDate' || summary === 'pending')
      ? 'checking'
      : summary;
  const view = getSummaryView(panelSummary);
  const [selectedFeedKey, setSelectedFeedKey] = useState<string | null>(null);
  // Looked up on every render so the details follow the latest read.
  const selectedFeed = selectedFeedKey
    ? consumers.find(consumer => getFeedKey(consumer) === selectedFeedKey)
    : undefined;

  // A feed that stops being reported closes its details for good, instead of
  // reopening them if a later read brings it back.
  useEffect(() => {
    if (selectedFeedKey && !selectedFeed) {
      setSelectedFeedKey(null);
    }
  }, [selectedFeedKey, selectedFeed]);

  return (
    <EuiPanel
      hasBorder
      paddingSize='l'
      className='ctiFeed__panel'
      data-test-subj='ctiFeedSyncPanel'
    >
      <EuiFlexGroup
        justifyContent='spaceBetween'
        alignItems='flexStart'
        responsive={false}
      >
        <EuiFlexItem>
          <EuiTitle size='xs'>
            <h2>
              {i18n.translate('wazuhCheckUpdates.ctiFeed.sync.title', {
                defaultMessage: 'Feed sync',
              })}
            </h2>
          </EuiTitle>
          <EuiText size='s' color='subdued'>
            {i18n.translate('wazuhCheckUpdates.ctiFeed.sync.description', {
              defaultMessage:
                'The sync state of each feed and the content it delivered to this environment. Content you create yourself is not counted.',
            })}
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            iconType='refresh'
            onClick={onRefresh}
            isDisabled={refreshing}
            aria-label={i18n.translate(
              'wazuhCheckUpdates.ctiFeed.sync.refreshAriaLabel',
              { defaultMessage: 'Refresh feed sync state' },
            )}
            data-test-subj='ctiFeedSyncRefresh'
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size='m' />
      {loading ? (
        <EuiLoadingContent lines={5} data-test-subj='ctiFeedSyncLoading' />
      ) : error ? (
        <EuiCallOut
          color='danger'
          iconType='alert'
          title={i18n.translate('wazuhCheckUpdates.ctiFeed.sync.errorTitle', {
            defaultMessage: 'Could not read the feed sync state',
          })}
          data-test-subj='ctiFeedSyncError'
        >
          <p>{error}</p>
          <EuiButton
            color='danger'
            size='s'
            iconType='refresh'
            onClick={onRefresh}
          >
            {i18n.translate('wazuhCheckUpdates.ctiFeed.sync.retryButton', {
              defaultMessage: 'Retry',
            })}
          </EuiButton>
        </EuiCallOut>
      ) : (
        <>
          <EuiFlexGroup
            gutterSize='m'
            alignItems='center'
            responsive={false}
            data-test-subj='ctiFeedSyncSummary'
          >
            <EuiFlexItem grow={false}>
              {panelSummary === 'syncing' || panelSummary === 'checking' ? (
                <EuiLoadingSpinner size='m' />
              ) : (
                <EuiIcon
                  type={view.iconType}
                  color={view.iconColor}
                  size='m'
                  aria-hidden
                />
              )}
            </EuiFlexItem>
            <EuiFlexItem>
              <h3
                className='ctiFeed__syncSummaryTitle'
                data-test-subj='ctiFeedSyncSummaryTitle'
              >
                {view.title}
              </h3>
            </EuiFlexItem>
          </EuiFlexGroup>
          {consumers.length > 0 ? (
            <>
              <EuiSpacer size='l' />
              <RedirectAppLinks application={getCore().application}>
                <EuiFlexGroup direction='column' gutterSize='s'>
                  {sortFeeds(consumers).map(consumer => (
                    <EuiFlexItem key={getFeedKey(consumer)}>
                      <FeedRow
                        consumer={consumer}
                        onOpen={() => setSelectedFeedKey(getFeedKey(consumer))}
                        contentCounts={contentCounts}
                        contentLoading={contentLoading}
                      />
                    </EuiFlexItem>
                  ))}
                </EuiFlexGroup>
              </RedirectAppLinks>
            </>
          ) : null}
        </>
      )}
      {selectedFeed ? (
        <FeedDetailsFlyout
          consumer={selectedFeed}
          onClose={() => setSelectedFeedKey(null)}
          onUpdateRequested={onUpdateRequested}
          updateInProgress={updateInProgress ?? summary === 'syncing'}
          onUpdateRunning={onUpdateRunning}
        />
      ) : null}
    </EuiPanel>
  );
};
