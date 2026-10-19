import type { CtiConsumer } from '../../common/cti-consumers';

// `status` has no validated enum — the server route passes it through
// verbatim. 'ready', 'running' and 'failed' are the only literal values given
// meaning here (see plugins/wazuh-ai-assistant/server/tools/catalog/get-cti-status.ts
// for 'ready'); anything else falls back to the raw value.
const CTI_CONSUMER_STATUS_READY = 'ready';
const CTI_CONSUMER_STATUS_RUNNING = 'running';
const CTI_CONSUMER_STATUS_FAILED = 'failed';

export type ConsumerSyncState =
  | { kind: 'upToDate' }
  | { kind: 'pending' }
  | { kind: 'syncing'; progress: number | null }
  | { kind: 'failed' }
  | { kind: 'unknown'; rawStatus: string };

/**
 * Share of the remote content already synced, in [0, 1], or `null` when the
 * remote offset is unknown.
 */
function getSyncProgress(consumer: CtiConsumer): number | null {
  if (consumer.remote_offset <= 0) {
    return null;
  }
  return Math.min(
    1,
    Math.max(0, consumer.local_offset / consumer.remote_offset),
  );
}

export function getConsumerSyncState(consumer: CtiConsumer): ConsumerSyncState {
  if (consumer.status === CTI_CONSUMER_STATUS_RUNNING) {
    return { kind: 'syncing', progress: getSyncProgress(consumer) };
  }
  if (consumer.status === CTI_CONSUMER_STATUS_FAILED) {
    return { kind: 'failed' };
  }
  if (consumer.status === CTI_CONSUMER_STATUS_READY) {
    // Ready but behind: the remote has content the next sync will bring.
    return consumer.local_offset < consumer.remote_offset
      ? { kind: 'pending' }
      : { kind: 'upToDate' };
  }
  return { kind: 'unknown', rawStatus: consumer.status };
}

export type FeedSyncSummary =
  | 'empty'
  | 'upToDate'
  | 'pending'
  | 'syncing'
  | 'failed'
  | 'unknown';

/** Overall sync state of the feed, led by the state that most needs attention. */
export function getFeedSyncSummary(consumers: CtiConsumer[]): FeedSyncSummary {
  if (consumers.length === 0) {
    return 'empty';
  }
  const kinds = new Set(
    consumers.map(consumer => getConsumerSyncState(consumer).kind),
  );
  if (kinds.has('failed')) {
    return 'failed';
  }
  if (kinds.has('syncing')) {
    return 'syncing';
  }
  if (kinds.has('pending')) {
    return 'pending';
  }
  if (kinds.has('unknown')) {
    return 'unknown';
  }
  return 'upToDate';
}

/** Whether the sync is still moving, so its state is worth polling. */
export function isFeedSyncInProgress(summary: FeedSyncSummary): boolean {
  return summary === 'syncing' || summary === 'pending';
}
