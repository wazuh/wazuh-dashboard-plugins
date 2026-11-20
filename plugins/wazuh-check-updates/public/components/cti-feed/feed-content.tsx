import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiLink,
  EuiLoadingContent,
  EuiText,
  EuiTextColor,
  EuiToolTip,
} from '@elastic/eui';
import type {
  FeedContentCounts,
  FeedContentKey,
} from '../../services/cti-feed';
import { getCore } from '../../plugin-services';
import { formatCtiNumber } from '../../services/cti-number-format';

/** Page a count links to. */
interface ContentPage {
  appId: string;
  /** Hash path in the app. */
  path: string;
  /** Names the destination (and the space it opens on). */
  tooltip: string;
}

/**
 * The counts only cover the content the feed delivers, which lives in the
 * Standard space, so the pages open on it instead of the last space visited.
 */
const STANDARD_SPACE = 'standard';

const rulesetPath = (route: string) => `#${route}?space=${STANDARD_SPACE}`;

/**
 * Pages of the Ruleset Management dashboards plugin, by the app ids the Home page
 * links its tiles to. Kept as literals: that plugin is a separate repository. Its
 * counts come from its own API, so when it is not installed the count is
 * unavailable and not linked.
 */
const RULESET_MANAGEMENT_PAGES: Record<string, ContentPage> = {
  rules: {
    appId: 'rules',
    path: rulesetPath('/rules'),
    tooltip: i18n.translate('wazuhCheckUpdates.ctiFeed.content.links.rules', {
      defaultMessage: 'View the Standard rules in Ruleset Management',
    }),
  },
  decoders: {
    appId: 'decoders',
    path: rulesetPath('/decoders'),
    tooltip: i18n.translate(
      'wazuhCheckUpdates.ctiFeed.content.links.decoders',
      {
        defaultMessage: 'View the Standard decoders in Ruleset Management',
      },
    ),
  },
  integrations: {
    appId: 'sa-integrations',
    path: rulesetPath('/integrations'),
    tooltip: i18n.translate(
      'wazuhCheckUpdates.ctiFeed.content.links.integrations',
      {
        defaultMessage: 'View the Standard integrations in Ruleset Management',
      },
    ),
  },
  kvdbs: {
    appId: 'kvdbs',
    path: rulesetPath('/kvdbs'),
    tooltip: i18n.translate('wazuhCheckUpdates.ctiFeed.content.links.kvdbs', {
      defaultMessage: 'View the Standard KVDBs in Ruleset Management',
    }),
  },
};

/**
 * The CTI Explorer app of the main plugin, which lists the IOCs and the
 * vulnerability records. Its id is a literal for the same reason as above: the
 * main plugin depends on this one, not the other way around.
 */
const CTI_EXPLORER_APP_ID = 'cti-explorer';

const CTI_EXPLORER_PAGES: Record<string, ContentPage> = {
  iocs: {
    appId: CTI_EXPLORER_APP_ID,
    path: '#/cti-explorer/?tab=iocs',
    tooltip: i18n.translate('wazuhCheckUpdates.ctiFeed.content.links.iocs', {
      defaultMessage: 'Browse the indicators of compromise in CTI Explorer',
    }),
  },
  vulnerabilities: {
    appId: CTI_EXPLORER_APP_ID,
    path: '#/cti-explorer/?tab=vulnerabilities',
    tooltip: i18n.translate(
      'wazuhCheckUpdates.ctiFeed.content.links.vulnerabilities',
      { defaultMessage: 'Browse the vulnerability records in CTI Explorer' },
    ),
  },
};

const getContentPageUrl = ({ appId, path }: ContentPage) =>
  getCore().application.getUrlForApp(appId, { path });

interface ContentItem {
  key: FeedContentKey;
  /** Name of the content, for a count that is not available. */
  label: string;
  /**
   * The count with its noun, pluralized ("603 rules"). The number follows the number
   * format of the advanced settings; the plural follows the count itself.
   */
  formatCount: (count: number) => string;
  page: ContentPage;
}

const CONTENT_ITEMS: Record<FeedContentKey, ContentItem> = {
  rules: {
    key: 'rules',
    label: i18n.translate('wazuhCheckUpdates.ctiFeed.content.tiles.rules', {
      defaultMessage: 'Rules',
    }),
    formatCount: count =>
      i18n.translate('wazuhCheckUpdates.ctiFeed.content.counts.rules', {
        defaultMessage: '{formatted} {count, plural, one {rule} other {rules}}',
        values: { count, formatted: formatCtiNumber(count) },
      }),
    page: RULESET_MANAGEMENT_PAGES.rules,
  },
  decoders: {
    key: 'decoders',
    label: i18n.translate('wazuhCheckUpdates.ctiFeed.content.tiles.decoders', {
      defaultMessage: 'Decoders',
    }),
    formatCount: count =>
      i18n.translate('wazuhCheckUpdates.ctiFeed.content.counts.decoders', {
        defaultMessage:
          '{formatted} {count, plural, one {decoder} other {decoders}}',
        values: { count, formatted: formatCtiNumber(count) },
      }),
    page: RULESET_MANAGEMENT_PAGES.decoders,
  },
  integrations: {
    key: 'integrations',
    label: i18n.translate(
      'wazuhCheckUpdates.ctiFeed.content.tiles.integrations',
      { defaultMessage: 'Integrations' },
    ),
    formatCount: count =>
      i18n.translate('wazuhCheckUpdates.ctiFeed.content.counts.integrations', {
        defaultMessage:
          '{formatted} {count, plural, one {integration} other {integrations}}',
        values: { count, formatted: formatCtiNumber(count) },
      }),
    page: RULESET_MANAGEMENT_PAGES.integrations,
  },
  kvdbs: {
    key: 'kvdbs',
    label: i18n.translate('wazuhCheckUpdates.ctiFeed.content.tiles.kvdbs', {
      defaultMessage: 'KVDBs',
    }),
    formatCount: count =>
      i18n.translate('wazuhCheckUpdates.ctiFeed.content.counts.kvdbs', {
        defaultMessage: '{formatted} {count, plural, one {KVDB} other {KVDBs}}',
        values: { count, formatted: formatCtiNumber(count) },
      }),
    page: RULESET_MANAGEMENT_PAGES.kvdbs,
  },
  iocs: {
    key: 'iocs',
    label: i18n.translate('wazuhCheckUpdates.ctiFeed.content.tiles.iocs', {
      defaultMessage: 'Indicators of compromise',
    }),
    formatCount: count =>
      i18n.translate('wazuhCheckUpdates.ctiFeed.content.counts.iocs', {
        defaultMessage: '{formatted} {count, plural, one {IOC} other {IOCs}}',
        values: { count, formatted: formatCtiNumber(count) },
      }),
    page: CTI_EXPLORER_PAGES.iocs,
  },
  vulnerabilities: {
    key: 'vulnerabilities',
    label: i18n.translate(
      'wazuhCheckUpdates.ctiFeed.content.tiles.vulnerabilities',
      { defaultMessage: 'Vulnerabilities (CVEs)' },
    ),
    formatCount: count =>
      i18n.translate(
        'wazuhCheckUpdates.ctiFeed.content.counts.vulnerabilities',
        {
          defaultMessage: '{formatted} {count, plural, one {CVE} other {CVEs}}',
          values: { count, formatted: formatCtiNumber(count) },
        },
      ),
    page: CTI_EXPLORER_PAGES.vulnerabilities,
  },
};

/** The content each feed delivers, by the consumer `type`. */
const FEED_CONTENT: Record<string, FeedContentKey[]> = {
  'cti:catalog:consumer:ruleset': [
    'rules',
    'decoders',
    'integrations',
    'kvdbs',
  ],
  'cti:catalog:consumer:iocs': ['iocs'],
  'cti:catalog:consumer:vulnerabilities': ['vulnerabilities'],
};

/** Whether the feed of this consumer `type` has content to count. */
export const hasFeedContent = (feedType: string): boolean =>
  Boolean(FEED_CONTENT[feedType]);

const UNAVAILABLE_TOOLTIP = i18n.translate(
  'wazuhCheckUpdates.ctiFeed.content.unavailableTooltip',
  {
    defaultMessage:
      'This count is not available. The content may not be synced yet, or your user may lack access to it.',
  },
);

const ContentCount: React.FC<{
  item: ContentItem;
  count: number | null | undefined;
}> = ({ item, count }) => {
  if (count === null || count === undefined) {
    return (
      <EuiToolTip content={UNAVAILABLE_TOOLTIP}>
        <EuiTextColor
          color='subdued'
          data-test-subj={`ctiFeedContentCount-${item.key}`}
        >
          {i18n.translate('wazuhCheckUpdates.ctiFeed.content.unavailable', {
            defaultMessage: '{label}: —',
            values: { label: item.label },
          })}
        </EuiTextColor>
      </EuiToolTip>
    );
  }
  return (
    <EuiToolTip content={item.page.tooltip}>
      <EuiLink
        href={getContentPageUrl(item.page)}
        data-test-subj={`ctiFeedContentCount-${item.key}`}
      >
        {item.formatCount(count)}
      </EuiLink>
    </EuiToolTip>
  );
};

export interface FeedContentLineProps {
  /** The consumer `type` of the feed. */
  feedType: string;
  counts: FeedContentCounts | null;
  loading: boolean;
}

/**
 * What a feed has delivered to this environment, each count linking to the page that
 * lists that content. Renders nothing for a feed with no known content.
 */
export const FeedContentLine: React.FC<FeedContentLineProps> = ({
  feedType,
  counts,
  loading,
}) => {
  const keys = FEED_CONTENT[feedType];
  if (!keys) {
    return null;
  }
  return (
    <EuiText size='s' data-test-subj={`ctiFeedContent-${feedType}`}>
      {loading && !counts ? (
        <EuiLoadingContent lines={1} data-test-subj='ctiFeedContentLoading' />
      ) : (
        <p>
          <EuiTextColor color='subdued'>
            {i18n.translate('wazuhCheckUpdates.ctiFeed.content.delivered', {
              defaultMessage: 'Delivered:',
            })}
          </EuiTextColor>{' '}
          {keys.map((key, index) => (
            <React.Fragment key={key}>
              {index > 0 ? (
                <EuiTextColor color='subdued' aria-hidden>
                  {' · '}
                </EuiTextColor>
              ) : null}
              <ContentCount item={CONTENT_ITEMS[key]} count={counts?.[key]} />
            </React.Fragment>
          ))}
        </p>
      )}
    </EuiText>
  );
};
