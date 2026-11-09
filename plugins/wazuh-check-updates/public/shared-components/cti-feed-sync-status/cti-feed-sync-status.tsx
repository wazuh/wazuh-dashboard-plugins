import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiBadge, EuiHealth, EuiTextColor, EuiToolTip } from '@elastic/eui';
import type { CtiConsumer } from '../../../common/cti-consumers';
import { CTI_FEED_APP_ID } from '../../../common/cti-feed';
import { RedirectAppLinks } from '../../../../../src/plugins/opensearch_dashboards_react/public';
import { getCore } from '../../plugin-services';
import { useCtiConsumers } from '../../components/cti-feed/hooks/use-cti-consumers';
import { getFeedMetadata } from '../../components/cti-feed/feed-metadata';
import {
  ConsumerSyncState,
  FeedSyncSummary,
  getConsumerSyncState,
  getFeedSyncSummary,
} from '../../services/cti-consumer-sync-state';
import {
  formatCtiTimestamp,
  parseCtiTimestamp,
} from '../../services/cti-timestamp';

/** Feeds of the CTI feed, by the last part of their consumer `type`. */
export type CtiFeedKey = 'ruleset' | 'iocs' | 'vulnerabilities';

const toConsumerType = (feed: CtiFeedKey) => `cti:catalog:consumer:${feed}`;

export interface CtiFeedSyncStatusProps {
  /** Feeds the status covers; every feed when omitted. */
  feeds?: CtiFeedKey[];
}

const SUMMARY: Record<FeedSyncSummary, { color: string; label: string }> = {
  upToDate: {
    color: 'success',
    label: i18n.translate('wazuhCheckUpdates.ctiFeedSyncStatus.upToDate', {
      defaultMessage: 'Feeds up to date',
    }),
  },
  syncing: {
    color: 'primary',
    label: i18n.translate('wazuhCheckUpdates.ctiFeedSyncStatus.syncing', {
      defaultMessage: 'Syncing feeds',
    }),
  },
  pending: {
    color: 'primary',
    label: i18n.translate('wazuhCheckUpdates.ctiFeedSyncStatus.pending', {
      defaultMessage: 'New feed content available',
    }),
  },
  failed: {
    color: 'danger',
    label: i18n.translate('wazuhCheckUpdates.ctiFeedSyncStatus.failed', {
      defaultMessage: 'Feed sync failed',
    }),
  },
  empty: {
    color: 'subdued',
    label: i18n.translate('wazuhCheckUpdates.ctiFeedSyncStatus.empty', {
      defaultMessage: 'No feed content yet',
    }),
  },
  unknown: {
    color: 'subdued',
    label: i18n.translate('wazuhCheckUpdates.ctiFeedSyncStatus.unknown', {
      defaultMessage: 'Sync state unknown',
    }),
  },
};

const STATE_LABELS: Record<ConsumerSyncState['kind'], string> = {
  upToDate: i18n.translate(
    'wazuhCheckUpdates.ctiFeedSyncStatus.state.upToDate',
    {
      defaultMessage: 'up to date',
    },
  ),
  pending: i18n.translate('wazuhCheckUpdates.ctiFeedSyncStatus.state.pending', {
    defaultMessage: 'update available',
  }),
  syncing: i18n.translate('wazuhCheckUpdates.ctiFeedSyncStatus.state.syncing', {
    defaultMessage: 'syncing',
  }),
  failed: i18n.translate('wazuhCheckUpdates.ctiFeedSyncStatus.state.failed', {
    defaultMessage: 'sync failed',
  }),
  unknown: i18n.translate('wazuhCheckUpdates.ctiFeedSyncStatus.state.unknown', {
    defaultMessage: 'unknown',
  }),
};

/** The latest content update of the feeds, the time the CTI feed app shows per feed. */
export const getLastUpdatedAt = (
  consumers: CtiConsumer[],
): string | undefined =>
  consumers
    .map(consumer => consumer.updated_at)
    .filter(time => parseCtiTimestamp(time) !== null)
    .sort((a, b) => Date.parse(b as string) - Date.parse(a as string))[0];

const FeedLines = ({
  consumers,
  lastCheckedAt,
}: {
  consumers: CtiConsumer[];
  lastCheckedAt?: string;
}) => (
  <>
    {consumers.map(consumer => (
      <div key={consumer.type || consumer.name}>
        {i18n.translate('wazuhCheckUpdates.ctiFeedSyncStatus.feedLine', {
          defaultMessage: '{feed}: {state}, last updated {time}',
          values: {
            feed: getFeedMetadata(consumer).label,
            state: STATE_LABELS[getConsumerSyncState(consumer).kind],
            time: formatCtiTimestamp(consumer.updated_at),
          },
        })}
      </div>
    ))}
    <div>
      {i18n.translate('wazuhCheckUpdates.ctiFeedSyncStatus.lastChecked', {
        defaultMessage: 'Last checked for new content: {time}',
        values: { time: formatCtiTimestamp(lastCheckedAt) },
      })}
    </div>
    <div>
      {i18n.translate('wazuhCheckUpdates.ctiFeedSyncStatus.opensFeedApp', {
        defaultMessage: 'Select to open CTI feed.',
      })}
    </div>
  </>
);

/**
 * Sync state of the CTI feed, read like the CTI feed app does, and the time of
 * its last content update with the `dateFormat` advanced settings. Opens the
 * CTI feed app. Renders nothing while loading or when the state cannot be read.
 */
export const CtiFeedSyncStatus = ({ feeds }: CtiFeedSyncStatusProps) => {
  const {
    consumers: allConsumers,
    lastCheckedAt,
    loading,
    error,
  } = useCtiConsumers();

  if (loading || error) {
    return null;
  }

  const types = feeds?.map(toConsumerType);
  const consumers = types
    ? allConsumers.filter(consumer => types.includes(consumer.type))
    : allConsumers;
  const summary = SUMMARY[getFeedSyncSummary(consumers)];
  const lastUpdatedAt = getLastUpdatedAt(consumers);

  const content = (
    // Block: as an inline-block on the text baseline, it leaves the descender
    // space under it and sits above the middle of the badge.
    <EuiHealth
      color={summary.color}
      textSize='xs'
      className='eui-textNoWrap eui-displayBlock'
    >
      {/* One child: the health item stacks its children in a column. */}
      <span>
        {summary.label}
        {lastUpdatedAt ? (
          <EuiTextColor color='subdued'>
            &nbsp;
            {i18n.translate('wazuhCheckUpdates.ctiFeedSyncStatus.synced', {
              defaultMessage: '· synced {time}',
              values: { time: formatCtiTimestamp(lastUpdatedAt) },
            })}
          </EuiTextColor>
        ) : null}
      </span>
    </EuiHealth>
  );

  return (
    <EuiToolTip
      position='bottom'
      content={
        <FeedLines consumers={consumers} lastCheckedAt={lastCheckedAt} />
      }
    >
      <RedirectAppLinks application={getCore().application}>
        <EuiBadge
          color='hollow'
          href={getCore().application.getUrlForApp(CTI_FEED_APP_ID)}
          // The tooltip describes it; no native title on top of it.
          title={undefined}
          data-test-subj='ctiFeedSyncStatus'
        >
          {content}
        </EuiBadge>
      </RedirectAppLinks>
    </EuiToolTip>
  );
};
