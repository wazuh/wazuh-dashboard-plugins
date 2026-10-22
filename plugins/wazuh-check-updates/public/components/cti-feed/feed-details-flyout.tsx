import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiCallOut,
  EuiCopy,
  EuiDescriptionList,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiIcon,
  EuiLink,
  EuiPanel,
  EuiProgress,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import type { CtiConsumer } from '../../../common/cti-consumers';
import {
  ConsumerSyncState,
  getConsumerSyncState,
  getSyncProgress,
} from '../../services/cti-consumer-sync-state';
import {
  MISSING_CTI_VALUE,
  formatCtiTimestamp,
} from '../../services/cti-timestamp';
import { getFeedMetadata, getSyncPhaseMetadata } from './feed-metadata';
import { FeedSyncBadge } from './feed-sync-badge';
import { CtiTimestamp } from './cti-timestamp';
import { CheckForUpdatesButton } from './check-for-updates-button';

const TITLE_ID = 'ctiFeedDetailsFlyoutTitle';

const numberFormat = new Intl.NumberFormat();

interface StateExplanation {
  color: 'success' | 'primary' | 'warning' | 'danger';
  iconType: string;
  title: string;
  body: string;
}

function getStateExplanation(
  consumer: CtiConsumer,
  state: ConsumerSyncState,
  behind: number,
): StateExplanation {
  switch (state.kind) {
    case 'upToDate':
      // All content is downloaded, but not all of it is applied yet.
      if (consumer.pending_sync_phases?.length) {
        return {
          color: 'warning',
          iconType: 'alert',
          title: i18n.translate(
            'wazuhCheckUpdates.ctiFeed.details.state.upToDateWithPendingTitle',
            { defaultMessage: 'Synced, with steps to retry' },
          ),
          body: i18n.translate(
            'wazuhCheckUpdates.ctiFeed.details.state.upToDateWithPendingBody',
            {
              defaultMessage:
                'Every change published to the feed is downloaded, but some steps to apply it did not finish. The indexer retries them on its next sync.',
            },
          ),
        };
      }
      return {
        color: 'success',
        iconType: 'checkInCircleFilled',
        title: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.details.state.upToDateTitle',
          { defaultMessage: 'This feed is up to date' },
        ),
        body: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.details.state.upToDateBody',
          {
            defaultMessage:
              'Every change published to the feed is synced to this environment.',
          },
        ),
      };
    case 'pending':
      return {
        color: 'primary',
        iconType: 'clock',
        title: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.details.state.pendingTitle',
          { defaultMessage: 'New content is available' },
        ),
        body: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.details.state.pendingBody',
          {
            defaultMessage:
              'The feed has {count, plural, one {# change} other {# changes}} this environment does not have yet. The next sync brings {count, plural, one {it} other {them}} in, or use Check for updates to sync now.',
            values: { count: behind },
          },
        ),
      };
    case 'syncing':
      return {
        color: 'primary',
        iconType: 'refresh',
        title: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.details.state.syncingTitle',
          { defaultMessage: 'Syncing new content' },
        ),
        body: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.details.state.syncingBody',
          {
            defaultMessage:
              'The indexer is downloading changes from this feed. Detection keeps using the current content until the sync finishes. Refresh the feed sync to see its progress.',
          },
        ),
      };
    case 'failed':
      return {
        color: 'danger',
        iconType: 'alert',
        title: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.details.state.failedTitle',
          { defaultMessage: 'The last sync failed' },
        ),
        body: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.details.state.failedBody',
          {
            defaultMessage:
              'Detection keeps using the content already synced. Use Check for updates to try again. If it keeps failing, search the indexer logs for the consumer {name}.',
            values: { name: consumer.name },
          },
        ),
      };
    default:
      return {
        color: 'warning',
        iconType: 'questionInCircle',
        title: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.details.state.unknownTitle',
          { defaultMessage: 'Sync state unknown' },
        ),
        body: i18n.translate(
          'wazuhCheckUpdates.ctiFeed.details.state.unknownBody',
          {
            defaultMessage:
              'The indexer reports the status "{status}", which this page does not recognize.',
            values: { status: state.rawStatus },
          },
        ),
      };
  }
}

const SyncProgress: React.FC<{
  consumer: CtiConsumer;
  state: ConsumerSyncState;
  behind: number;
}> = ({ consumer, state, behind }) => {
  const progress = getSyncProgress(consumer);

  if (progress === null) {
    return (
      <EuiText
        size='s'
        color='subdued'
        data-test-subj='ctiFeedDetailsNoContent'
      >
        {i18n.translate('wazuhCheckUpdates.ctiFeed.details.progress.empty', {
          defaultMessage: 'The feed has not published any content yet.',
        })}
      </EuiText>
    );
  }

  // Floor, so a feed that is still behind never reads as 100%.
  const percent = Math.floor(progress * 100);

  return (
    <>
      <EuiProgress
        value={percent}
        max={100}
        size='m'
        color={state.kind === 'upToDate' ? 'success' : 'primary'}
        label={i18n.translate(
          'wazuhCheckUpdates.ctiFeed.details.progress.label',
          {
            defaultMessage: '{synced} of {total} changes synced',
            values: {
              synced: numberFormat.format(consumer.local_offset),
              total: numberFormat.format(consumer.remote_offset),
            },
          },
        )}
        valueText={`${percent}%`}
        data-test-subj='ctiFeedDetailsProgress'
      />
      <EuiSpacer size='xs' />
      <EuiText size='xs' color='subdued' data-test-subj='ctiFeedDetailsBehind'>
        {behind > 0
          ? i18n.translate(
              'wazuhCheckUpdates.ctiFeed.details.progress.behind',
              {
                defaultMessage:
                  '{count, plural, one {# change} other {# changes}} behind the feed',
                values: { count: behind },
              },
            )
          : i18n.translate(
              'wazuhCheckUpdates.ctiFeed.details.progress.caughtUp',
              { defaultMessage: 'Nothing left to sync' },
            )}
      </EuiText>
    </>
  );
};

/** Lets `cti:catalog:consumer:…` identifiers wrap after a colon, not mid-word. */
const ColonSeparatedId: React.FC<{ value: string }> = ({ value }) => (
  <>
    {value.split(':').map((part, index) => (
      <React.Fragment key={index}>
        {index > 0 ? (
          <>
            :<wbr />
          </>
        ) : null}
        {part}
      </React.Fragment>
    ))}
  </>
);

const PendingSyncPhases: React.FC<{ phases: string[] }> = ({ phases }) => (
  <>
    <EuiTitle size='xs'>
      <h3>
        {i18n.translate(
          'wazuhCheckUpdates.ctiFeed.details.pendingPhases.title',
          {
            defaultMessage: 'Steps to retry',
          },
        )}
      </h3>
    </EuiTitle>
    <EuiText size='xs' color='subdued'>
      {i18n.translate(
        'wazuhCheckUpdates.ctiFeed.details.pendingPhases.description',
        {
          defaultMessage:
            'These steps of the last sync did not finish. The indexer retries them on its next sync, even without new content. Use Check for updates to retry them now.',
        },
      )}
    </EuiText>
    <EuiSpacer size='s' />
    <EuiFlexGroup
      direction='column'
      gutterSize='s'
      role='list'
      data-test-subj='ctiFeedDetailsPendingPhases'
    >
      {phases.map(phase => {
        const { label, description } = getSyncPhaseMetadata(phase);
        return (
          <EuiFlexItem key={phase} role='listitem'>
            <EuiPanel color='subdued' hasShadow={false} paddingSize='s'>
              <EuiFlexGroup
                gutterSize='s'
                alignItems='center'
                responsive={false}
              >
                <EuiFlexItem grow={false}>
                  <EuiIcon type='refresh' color='warning' aria-hidden />
                </EuiFlexItem>
                <EuiFlexItem style={{ minWidth: 0 }}>
                  <EuiText size='s'>
                    <strong>{label}</strong>
                  </EuiText>
                  {description ? (
                    <EuiText size='xs' color='subdued'>
                      {description}
                    </EuiText>
                  ) : null}
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          </EuiFlexItem>
        );
      })}
    </EuiFlexGroup>
    <EuiSpacer size='l' />
  </>
);

/** Raw step names, as the indexer logs them; `None` when all are in sync. */
function formatPendingSyncPhases(phases: string[] | undefined): string {
  if (!phases) {
    return MISSING_CTI_VALUE;
  }
  return phases.length > 0
    ? phases.join(', ')
    : i18n.translate(
        'wazuhCheckUpdates.ctiFeed.details.fields.pendingPhasesNone',
        { defaultMessage: 'None' },
      );
}

const COPY_RESOURCE_LABEL = i18n.translate(
  'wazuhCheckUpdates.ctiFeed.details.fields.resourceCopy',
  { defaultMessage: 'Copy resource URL' },
);

const ResourceValue: React.FC<{ resource: string }> = ({ resource }) => (
  <EuiFlexGroup gutterSize='xs' alignItems='center' responsive={false}>
    <EuiFlexItem style={{ minWidth: 0 }}>
      <EuiLink
        href={resource}
        target='_blank'
        rel='noopener noreferrer'
        title={resource}
        className='eui-textTruncate'
        data-test-subj='ctiFeedDetailsResource'
      >
        {resource}
      </EuiLink>
    </EuiFlexItem>
    <EuiFlexItem grow={false}>
      <EuiCopy textToCopy={resource} beforeMessage={COPY_RESOURCE_LABEL}>
        {copy => (
          <EuiButtonIcon
            iconType='copyClipboard'
            size='xs'
            onClick={copy}
            aria-label={COPY_RESOURCE_LABEL}
          />
        )}
      </EuiCopy>
    </EuiFlexItem>
  </EuiFlexGroup>
);

function getDetailItems(consumer: CtiConsumer) {
  return [
    {
      title: i18n.translate('wazuhCheckUpdates.ctiFeed.details.fields.name', {
        defaultMessage: 'Consumer',
      }),
      description: consumer.name,
    },
    {
      title: i18n.translate(
        'wazuhCheckUpdates.ctiFeed.details.fields.context',
        { defaultMessage: 'Context' },
      ),
      description: consumer.context,
    },
    {
      title: i18n.translate('wazuhCheckUpdates.ctiFeed.details.fields.type', {
        defaultMessage: 'Type',
      }),
      description: <ColonSeparatedId value={consumer.type} />,
    },
    {
      title: i18n.translate('wazuhCheckUpdates.ctiFeed.details.fields.access', {
        defaultMessage: 'Access',
      }),
      description: consumer.is_public
        ? i18n.translate(
            'wazuhCheckUpdates.ctiFeed.details.fields.accessPublic',
            { defaultMessage: 'Public' },
          )
        : i18n.translate(
            'wazuhCheckUpdates.ctiFeed.details.fields.accessPrivate',
            { defaultMessage: 'Private' },
          ),
    },
    {
      title: i18n.translate('wazuhCheckUpdates.ctiFeed.details.fields.status', {
        defaultMessage: 'Indexer status',
      }),
      description: consumer.status || '-',
    },
    {
      title: i18n.translate(
        'wazuhCheckUpdates.ctiFeed.details.fields.updatedAt',
        { defaultMessage: 'Last updated' },
      ),
      description: formatCtiTimestamp(consumer.updated_at),
    },
    {
      title: i18n.translate(
        'wazuhCheckUpdates.ctiFeed.details.fields.pendingPhases',
        { defaultMessage: 'Pending phases' },
      ),
      description: formatPendingSyncPhases(consumer.pending_sync_phases),
    },
    {
      title: i18n.translate(
        'wazuhCheckUpdates.ctiFeed.details.fields.localOffset',
        { defaultMessage: 'Local offset' },
      ),
      description: numberFormat.format(consumer.local_offset),
    },
    {
      title: i18n.translate(
        'wazuhCheckUpdates.ctiFeed.details.fields.remoteOffset',
        { defaultMessage: 'Remote offset' },
      ),
      description: numberFormat.format(consumer.remote_offset),
    },
    {
      title: i18n.translate(
        'wazuhCheckUpdates.ctiFeed.details.fields.resource',
        { defaultMessage: 'Resource' },
      ),
      description: consumer.resource ? (
        <ResourceValue resource={consumer.resource} />
      ) : (
        '-'
      ),
    },
  ];
}

export interface FeedDetailsFlyoutProps {
  consumer: CtiConsumer;
  onClose: () => void;
  onUpdateRequested: () => void | Promise<void>;
}

export const FeedDetailsFlyout: React.FC<FeedDetailsFlyoutProps> = ({
  consumer,
  onClose,
  onUpdateRequested,
}) => {
  const metadata = getFeedMetadata(consumer);
  const state = getConsumerSyncState(consumer);
  const behind = Math.max(0, consumer.remote_offset - consumer.local_offset);
  const explanation = getStateExplanation(consumer, state, behind);

  return (
    <EuiFlyout
      onClose={onClose}
      size='s'
      ownFocus
      aria-labelledby={TITLE_ID}
      data-test-subj='ctiFeedDetailsFlyout'
    >
      <EuiFlyoutHeader hasBorder>
        <EuiFlexGroup gutterSize='m' alignItems='center' responsive={false}>
          <EuiFlexItem grow={false}>
            <span className='ctiFeed__feedIcon ctiFeed__feedIcon--large'>
              <EuiIcon type={metadata.iconType} size='l' aria-hidden />
            </span>
          </EuiFlexItem>
          <EuiFlexItem style={{ minWidth: 0 }}>
            <EuiTitle size='s'>
              <h2 id={TITLE_ID}>{metadata.label}</h2>
            </EuiTitle>
            <EuiText size='s' color='subdued'>
              {metadata.description}
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size='m' />
        <EuiFlexGroup gutterSize='s' alignItems='center' responsive={false}>
          <EuiFlexItem grow={false}>
            <FeedSyncBadge state={state} dataTestSubj='ctiFeedDetailsBadge' />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <CtiTimestamp
              timestamp={consumer.updated_at}
              renderText={time =>
                i18n.translate(
                  'wazuhCheckUpdates.ctiFeed.details.lastUpdated',
                  {
                    defaultMessage: 'Last updated: {time}',
                    values: { time },
                  },
                )
              }
              dataTestSubj='ctiFeedDetailsUpdatedAt'
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiCallOut
          size='s'
          color={explanation.color}
          iconType={explanation.iconType}
          title={explanation.title}
          data-test-subj='ctiFeedDetailsState'
        >
          <p>{explanation.body}</p>
        </EuiCallOut>
        <EuiSpacer size='l' />
        {consumer.pending_sync_phases?.length ? (
          <PendingSyncPhases phases={consumer.pending_sync_phases} />
        ) : null}
        <EuiTitle size='xs'>
          <h3>
            {i18n.translate(
              'wazuhCheckUpdates.ctiFeed.details.progress.title',
              {
                defaultMessage: 'Sync progress',
              },
            )}
          </h3>
        </EuiTitle>
        <EuiSpacer size='s' />
        <SyncProgress consumer={consumer} state={state} behind={behind} />
        <EuiSpacer size='l' />
        <EuiTitle size='xs'>
          <h3>
            {i18n.translate('wazuhCheckUpdates.ctiFeed.details.fields.title', {
              defaultMessage: 'Consumer details',
            })}
          </h3>
        </EuiTitle>
        <EuiSpacer size='s' />
        <EuiDescriptionList
          type='column'
          compressed
          className='ctiFeed__details'
          listItems={getDetailItems(consumer)}
          data-test-subj='ctiFeedDetailsFields'
        />
      </EuiFlyoutBody>
      <EuiFlyoutFooter>
        <EuiFlexGroup
          justifyContent='spaceBetween'
          alignItems='center'
          responsive={false}
        >
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              iconType='cross'
              flush='left'
              onClick={onClose}
              data-test-subj='ctiFeedDetailsClose'
            >
              {i18n.translate('wazuhCheckUpdates.ctiFeed.details.close', {
                defaultMessage: 'Close',
              })}
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <CheckForUpdatesButton
              fill
              onRequested={onUpdateRequested}
              dataTestSubj='ctiFeedDetailsCheckForUpdatesButton'
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
};
