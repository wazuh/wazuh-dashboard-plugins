import { i18n } from '@osd/i18n';
import type { CtiConsumer } from '../../../common/cti-consumers';

interface FeedMetadata {
  label: string;
  description: string;
  iconType: string;
  order: number;
}

/**
 * Feeds keyed by the consumer `type`, which is stable across content versions
 * (the `name` and `context` fields carry the version).
 */
const FEEDS: Record<string, FeedMetadata> = {
  'cti:catalog:consumer:ruleset': {
    label: i18n.translate('wazuhCheckUpdates.ctiFeed.feeds.ruleset.label', {
      defaultMessage: 'Ruleset',
    }),
    description: i18n.translate(
      'wazuhCheckUpdates.ctiFeed.feeds.ruleset.description',
      { defaultMessage: 'Rules, decoders, integrations and KVDBs' },
    ),
    iconType: 'securitySignal',
    order: 0,
  },
  'cti:catalog:consumer:iocs': {
    label: i18n.translate('wazuhCheckUpdates.ctiFeed.feeds.iocs.label', {
      defaultMessage: 'Indicators of compromise',
    }),
    description: i18n.translate(
      'wazuhCheckUpdates.ctiFeed.feeds.iocs.description',
      {
        defaultMessage: 'Malicious domains, URLs, connections and file hashes',
      },
    ),
    iconType: 'bug',
    order: 1,
  },
  'cti:catalog:consumer:vulnerabilities': {
    label: i18n.translate(
      'wazuhCheckUpdates.ctiFeed.feeds.vulnerabilities.label',
      { defaultMessage: 'Vulnerabilities' },
    ),
    description: i18n.translate(
      'wazuhCheckUpdates.ctiFeed.feeds.vulnerabilities.description',
      { defaultMessage: 'CVE records used by vulnerability detection' },
    ),
    iconType: 'alert',
    order: 2,
  },
};

const UNKNOWN_FEED_ORDER = Number.MAX_SAFE_INTEGER;

export function getFeedMetadata(consumer: CtiConsumer): FeedMetadata {
  return (
    FEEDS[consumer.type] ?? {
      label: consumer.name,
      description: consumer.context,
      iconType: 'document',
      order: UNKNOWN_FEED_ORDER,
    }
  );
}

/** Known feeds first, in a fixed order, then any other feed by name. */
export function sortFeeds(consumers: CtiConsumer[]): CtiConsumer[] {
  return [...consumers].sort(
    (a, b) =>
      getFeedMetadata(a).order - getFeedMetadata(b).order ||
      a.name.localeCompare(b.name),
  );
}

interface SyncPhaseMetadata {
  label: string;
  /** What the step does; missing for steps this page does not know yet. */
  description?: string;
}

/**
 * Sync steps the indexer retries when they fail, keyed by the names it stores
 * in `pending_sync_phases`.
 */
const SYNC_PHASES: Record<string, SyncPhaseMetadata> = {
  integrations: {
    label: i18n.translate(
      'wazuhCheckUpdates.ctiFeed.syncPhases.integrations.label',
      { defaultMessage: 'Integrations' },
    ),
    description: i18n.translate(
      'wazuhCheckUpdates.ctiFeed.syncPhases.integrations.description',
      { defaultMessage: 'Apply the integrations to Ruleset Management' },
    ),
  },
  rules: {
    label: i18n.translate('wazuhCheckUpdates.ctiFeed.syncPhases.rules.label', {
      defaultMessage: 'Rules',
    }),
    description: i18n.translate(
      'wazuhCheckUpdates.ctiFeed.syncPhases.rules.description',
      { defaultMessage: 'Apply the rules to Ruleset Management' },
    ),
  },
  detectors: {
    label: i18n.translate(
      'wazuhCheckUpdates.ctiFeed.syncPhases.detectors.label',
      { defaultMessage: 'Detectors' },
    ),
    description: i18n.translate(
      'wazuhCheckUpdates.ctiFeed.syncPhases.detectors.description',
      { defaultMessage: 'Create the threat detectors for the integrations' },
    ),
  },
  // eslint-disable-next-line camelcase -- the step name the indexer stores
  ioc_load: {
    label: i18n.translate(
      'wazuhCheckUpdates.ctiFeed.syncPhases.iocLoad.label',
      { defaultMessage: 'Indicator load' },
    ),
    description: i18n.translate(
      'wazuhCheckUpdates.ctiFeed.syncPhases.iocLoad.description',
      { defaultMessage: 'Load the indicators of compromise into the engine' },
    ),
  },
};

/** A step the indexer adds later still shows, under its stored name. */
export function getSyncPhaseMetadata(phase: string): SyncPhaseMetadata {
  return SYNC_PHASES[phase] ?? { label: phase };
}
