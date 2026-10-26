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
import { getFeedMetadata, sortFeeds } from './feed-metadata';
import { FeedSyncBadge } from './feed-sync-badge';
import { FeedDetailsFlyout } from './feed-details-flyout';
import { CtiTimestamp } from './cti-timestamp';

/** Stable key of a feed across reads: its `type`, or its `name` if missing. */
const getFeedKey = (consumer: CtiConsumer) => consumer.type || consumer.name;

interface SummaryView {
  iconType: string;
  iconColor: string;
  title: string;
  description: string;
}

const AUTOMATIC_SYNC_HINT = i18n.translate(
  'wazuhCheckUpdates.ctiFeed.sync.automaticHint',
  {
    defaultMessage:
      'The indexer syncs the feed automatically. Use Check for updates to sync it now.',
  },
);

function getSummaryView(summary: FeedSyncSummary): SummaryView {
  switch (summary) {
    case 'upToDate':
      return {
        iconType: 'checkInCircleFilled',
        iconColor: 'success',
        title: i18n.translate('wazuhCheckUpdates.ctiFeed.sync.upToDateTitle', {
          defaultMessage: 'All feeds are up to date',
        }),
        description: AUTOMATIC_SYNC_HINT,
      };
    case 'syncing':
      return {
        iconType: 'refresh',
        iconColor: 'primary',
        title: i18n.translate('wazuhCheckUpdates.ctiFeed.sync.syncingTitle', {
          defaultMessage: 'Syncing new content',
        }),
        description: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.sync.syncingDescription',
          {
            defaultMessage:
              'The indexer is downloading content from the feed. Detection keeps using the current content until the sync finishes. Refresh to see its progress.',
          },
        ),
      };
    case 'pending':
      return {
        iconType: 'clock',
        iconColor: 'primary',
        title: i18n.translate('wazuhCheckUpdates.ctiFeed.sync.pendingTitle', {
          defaultMessage: 'New content is available',
        }),
        description: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.sync.pendingDescription',
          {
            defaultMessage:
              'The next sync brings it in. Use Check for updates to sync it now.',
          },
        ),
      };
    case 'failed':
      return {
        iconType: 'alert',
        iconColor: 'danger',
        title: i18n.translate('wazuhCheckUpdates.ctiFeed.sync.failedTitle', {
          defaultMessage: 'Some feeds could not sync',
        }),
        description: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.sync.failedDescription',
          {
            defaultMessage:
              'Detection keeps using the content already synced. Use Check for updates to try again, or check the indexer logs if it keeps failing.',
          },
        ),
      };
    case 'empty':
      return {
        iconType: 'empty',
        iconColor: 'subdued',
        title: i18n.translate('wazuhCheckUpdates.ctiFeed.sync.emptyTitle', {
          defaultMessage: 'No feed content yet',
        }),
        description: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.sync.emptyDescription',
          {
            defaultMessage:
              'The feeds appear here after the indexer syncs them for the first time.',
          },
        ),
      };
    default:
      return {
        iconType: 'questionInCircle',
        iconColor: 'subdued',
        title: i18n.translate('wazuhCheckUpdates.ctiFeed.sync.unknownTitle', {
          defaultMessage: 'Sync state unknown',
        }),
        description: AUTOMATIC_SYNC_HINT,
      };
  }
}

const renderLastUpdated = (time: string) =>
  i18n.translate('wazuhCheckUpdates.ctiFeed.sync.lastUpdated', {
    defaultMessage: 'Last updated: {time}',
    values: { time },
  });

const FeedRow: React.FC<{ consumer: CtiConsumer; onOpen: () => void }> = ({
  consumer,
  onOpen,
}) => {
  const metadata = getFeedMetadata(consumer);
  const state = getConsumerSyncState(consumer);

  return (
    <EuiPanel
      color='subdued'
      hasShadow={false}
      paddingSize='m'
      onClick={onOpen}
      aria-haspopup='dialog'
      className='ctiFeed__feedRow'
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
      {state.kind === 'syncing' && state.progress !== null ? (
        <>
          <EuiSpacer size='s' />
          <EuiProgress
            value={Math.round(state.progress * 100)}
            max={100}
            size='s'
            color='primary'
            valueText={i18n.translate(
              'wazuhCheckUpdates.ctiFeed.sync.progress',
              {
                defaultMessage: '{percent}% synced',
                values: { percent: Math.round(state.progress * 100) },
              },
            )}
            data-test-subj='ctiFeedSyncProgress'
          />
        </>
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
}

export const FeedSyncPanel: React.FC<FeedSyncPanelProps> = ({
  consumers,
  summary,
  loading,
  refreshing,
  error,
  onRefresh,
  onUpdateRequested,
}) => {
  const view = getSummaryView(summary);
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
        alignItems='center'
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
              {summary === 'syncing' ? (
                <EuiLoadingSpinner size='l' />
              ) : (
                <EuiIcon
                  type={view.iconType}
                  color={view.iconColor}
                  size='l'
                  aria-hidden
                />
              )}
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiTitle size='xs'>
                <h3 data-test-subj='ctiFeedSyncSummaryTitle'>{view.title}</h3>
              </EuiTitle>
              <EuiText size='s' color='subdued'>
                {view.description}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
          {consumers.length > 0 ? (
            <>
              <EuiSpacer size='l' />
              <EuiFlexGroup direction='column' gutterSize='s'>
                {sortFeeds(consumers).map(consumer => (
                  <EuiFlexItem key={getFeedKey(consumer)}>
                    <FeedRow
                      consumer={consumer}
                      onOpen={() => setSelectedFeedKey(getFeedKey(consumer))}
                    />
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
            </>
          ) : null}
        </>
      )}
      {selectedFeed ? (
        <FeedDetailsFlyout
          consumer={selectedFeed}
          onClose={() => setSelectedFeedKey(null)}
          onUpdateRequested={onUpdateRequested}
        />
      ) : null}
    </EuiPanel>
  );
};
