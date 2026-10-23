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
