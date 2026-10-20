import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiBadge,
  EuiButton,
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
  ConsumerSyncState,
  FeedSyncSummary,
  getConsumerSyncState,
} from '../../services/cti-consumer-sync-state';
import { getFeedMetadata, sortFeeds } from './feed-metadata';

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
      'The indexer syncs the feed automatically. Use Update CTI content to sync it now.',
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
              'The indexer is downloading content from the feed. Detection keeps using the current content until the sync finishes.',
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
              'The next sync brings it in. Use Update CTI content to sync it now.',
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
              'Detection keeps using the content already synced. Use Update CTI content to try again, or check the indexer logs if it keeps failing.',
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

const SyncBadge: React.FC<{ state: ConsumerSyncState }> = ({ state }) => {
  switch (state.kind) {
    case 'upToDate':
      return (
        <EuiBadge color='success' data-test-subj='ctiFeedSyncBadge'>
          {i18n.translate('wazuhCheckUpdates.ctiFeed.sync.badge.upToDate', {
            defaultMessage: 'Up to date',
          })}
        </EuiBadge>
      );
    case 'pending':
      return (
        <EuiBadge color='primary' data-test-subj='ctiFeedSyncBadge'>
          {i18n.translate('wazuhCheckUpdates.ctiFeed.sync.badge.pending', {
            defaultMessage: 'Update available',
          })}
        </EuiBadge>
      );
    case 'syncing':
      return (
        <EuiBadge color='warning' data-test-subj='ctiFeedSyncBadge'>
          {i18n.translate('wazuhCheckUpdates.ctiFeed.sync.badge.syncing', {
            defaultMessage: 'Syncing',
          })}
        </EuiBadge>
      );
    case 'failed':
      return (
        <EuiBadge color='danger' data-test-subj='ctiFeedSyncBadge'>
          {i18n.translate('wazuhCheckUpdates.ctiFeed.sync.badge.failed', {
            defaultMessage: 'Sync failed',
          })}
        </EuiBadge>
      );
    default:
      return (
        <EuiBadge color='hollow' data-test-subj='ctiFeedSyncBadge'>
          {state.rawStatus ||
            i18n.translate('wazuhCheckUpdates.ctiFeed.sync.badge.unknown', {
              defaultMessage: 'Unknown',
            })}
        </EuiBadge>
      );
  }
};

const FeedRow: React.FC<{ consumer: CtiConsumer }> = ({ consumer }) => {
  const metadata = getFeedMetadata(consumer);
  const state = getConsumerSyncState(consumer);

  return (
    <EuiPanel
      color='subdued'
      hasShadow={false}
      paddingSize='m'
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
          <SyncBadge state={state} />
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
  error: string | null;
  onRetry: () => void;
}

export const FeedSyncPanel: React.FC<FeedSyncPanelProps> = ({
  consumers,
  summary,
  loading,
  error,
  onRetry,
}) => {
  const view = getSummaryView(summary);

  return (
    <EuiPanel
      hasBorder
      paddingSize='l'
      className='ctiFeed__panel'
      data-test-subj='ctiFeedSyncPanel'
    >
      <EuiTitle size='xs'>
        <h2>
          {i18n.translate('wazuhCheckUpdates.ctiFeed.sync.title', {
            defaultMessage: 'Feed sync',
          })}
        </h2>
      </EuiTitle>
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
            onClick={onRetry}
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
                  <EuiFlexItem key={consumer.type || consumer.name}>
                    <FeedRow consumer={consumer} />
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
            </>
          ) : null}
        </>
      )}
    </EuiPanel>
  );
};
