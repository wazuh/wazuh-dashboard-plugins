import { i18n } from '@osd/i18n';
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
  /**
   * `preparing`: no content of the new data source is live yet (`local_offset` 0), for
   * example while a plan change downloads a snapshot. The offsets say nothing about
   * its progress until the snapshot goes live.
   */
  | { kind: 'syncing'; progress: number | null; preparing: boolean }
  /**
   * The content is synced, but steps of the last sync (`pending_sync_phases`) failed and
   * are retried on the next one.
   */
  | { kind: 'retryPending'; phases: string[] }
  | { kind: 'failed' }
  | { kind: 'unknown'; rawStatus: string };

/**
 * Share of the remote content already synced, in [0, 1], or `null` when the
 * remote offset is unknown.
 */
export function getSyncProgress(consumer: CtiConsumer): number | null {
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
    return {
      kind: 'syncing',
      progress: getSyncProgress(consumer),
      preparing: consumer.local_offset === 0 && consumer.remote_offset > 0,
    };
  }
  if (consumer.status === CTI_CONSUMER_STATUS_FAILED) {
    return { kind: 'failed' };
  }
  if (consumer.status === CTI_CONSUMER_STATUS_READY) {
    // Synced, but some steps failed: a warning, whatever the offsets say.
    const phases = consumer.pending_sync_phases ?? [];
    if (phases.length > 0) {
      return { kind: 'retryPending', phases };
    }
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
  | 'retryPending'
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
  if (kinds.has('retryPending')) {
    return 'retryPending';
  }
  if (kinds.has('pending')) {
    return 'pending';
  }
  if (kinds.has('unknown')) {
    return 'unknown';
  }
  return 'upToDate';
}

/**
 * Steps of a sync, as `pending_sync_phases` names them: the ruleset syncs its
 * integrations, rules and detectors to Ruleset Management; the IOC feed loads the IOCs
 * into the engine (`ioc_load`).
 */
const SYNC_PHASE_LABELS: Record<string, string> = {
  integrations: i18n.translate(
    'wazuhCheckUpdates.ctiFeed.syncPhases.integrations',
    {
      defaultMessage: 'integrations',
    },
  ),
  rules: i18n.translate('wazuhCheckUpdates.ctiFeed.syncPhases.rules', {
    defaultMessage: 'rules',
  }),
  detectors: i18n.translate('wazuhCheckUpdates.ctiFeed.syncPhases.detectors', {
    defaultMessage: 'detectors',
  }),
  // eslint-disable-next-line camelcase -- the phase name the indexer stores
  ioc_load: i18n.translate('wazuhCheckUpdates.ctiFeed.syncPhases.iocLoad', {
    defaultMessage: 'loading the IOCs into the engine',
  }),
};

/**
 * The steps waiting to be retried, as a list in the dashboard language ("rules and
 * detectors"). A step this page does not know shows as the indexer names it.
 */
export function formatSyncPhases(phases: string[]): string {
  const labels = phases.map(phase => SYNC_PHASE_LABELS[phase] ?? phase);
  try {
    return new Intl.ListFormat(i18n.getLocale(), {
      style: 'long',
      type: 'conjunction',
    }).format(labels);
  } catch {
    return labels.join(', ');
  }
}
