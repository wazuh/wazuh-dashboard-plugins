import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButtonIcon,
  EuiFlexGrid,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiLink,
  EuiPanel,
  EuiSpacer,
  EuiStat,
  EuiText,
  EuiTitle,
  EuiToolTip,
} from '@elastic/eui';
import type {
  FeedContentCounts,
  FeedContentKey,
} from '../../services/cti-feed';
import { getCore } from '../../plugin-services';
import { RedirectAppLinks } from '../../../../../src/plugins/opensearch_dashboards_react/public';

/** Page a tile links to. */
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
 * unavailable and the tile is not linked.
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

interface ContentTile {
  key: FeedContentKey;
  label: string;
  iconType: string;
  /** Page that lists this content. */
  page?: ContentPage;
}

const CONTENT_TILES: ContentTile[] = [
  {
    key: 'rules',
    label: i18n.translate('wazuhCheckUpdates.ctiFeed.content.tiles.rules', {
      defaultMessage: 'Rules',
    }),
    iconType: 'securitySignal',
    page: RULESET_MANAGEMENT_PAGES.rules,
  },
  {
    key: 'decoders',
    label: i18n.translate('wazuhCheckUpdates.ctiFeed.content.tiles.decoders', {
      defaultMessage: 'Decoders',
    }),
    iconType: 'logstashFilter',
    page: RULESET_MANAGEMENT_PAGES.decoders,
  },
  {
    key: 'integrations',
    label: i18n.translate(
      'wazuhCheckUpdates.ctiFeed.content.tiles.integrations',
      { defaultMessage: 'Integrations' },
    ),
    iconType: 'integrationSecurity',
    page: RULESET_MANAGEMENT_PAGES.integrations,
  },
  {
    key: 'kvdbs',
    label: i18n.translate('wazuhCheckUpdates.ctiFeed.content.tiles.kvdbs', {
      defaultMessage: 'KVDBs',
    }),
    iconType: 'database',
    page: RULESET_MANAGEMENT_PAGES.kvdbs,
  },
  {
    key: 'iocs',
    label: i18n.translate('wazuhCheckUpdates.ctiFeed.content.tiles.iocs', {
      defaultMessage: 'Indicators of compromise',
    }),
    iconType: 'bug',
    page: CTI_EXPLORER_PAGES.iocs,
  },
  {
    key: 'vulnerabilities',
    label: i18n.translate(
      'wazuhCheckUpdates.ctiFeed.content.tiles.vulnerabilities',
      { defaultMessage: 'Vulnerabilities (CVEs)' },
    ),
    iconType: 'alert',
    page: CTI_EXPLORER_PAGES.vulnerabilities,
  },
];

const UNAVAILABLE_VALUE = '—';

const numberFormat = new Intl.NumberFormat();

const Tile: React.FC<{
  tile: ContentTile;
  value: number | null | undefined;
  loading: boolean;
}> = ({ tile, value, loading }) => {
  const unavailable = !loading && (value === null || value === undefined);
  const formatted = unavailable
    ? UNAVAILABLE_VALUE
    : numberFormat.format(value ?? 0);
  const title =
    tile.page && !unavailable && !loading ? (
      <EuiToolTip content={tile.page.tooltip}>
        <EuiLink
          href={getContentPageUrl(tile.page)}
          color='text'
          data-test-subj={`ctiFeedContentStat-${tile.key}-link`}
        >
          {formatted}
        </EuiLink>
      </EuiToolTip>
    ) : (
      formatted
    );

  const stat = (
    <EuiStat
      title={title}
      titleSize='m'
      titleColor={unavailable ? 'subdued' : 'default'}
      description={tile.label}
      isLoading={loading}
      reverse
      data-test-subj={`ctiFeedContentStat-${tile.key}`}
    />
  );

  return (
    <EuiPanel color='subdued' hasShadow={false} paddingSize='m'>
      <EuiFlexGroup gutterSize='m' alignItems='center' responsive={false}>
        <EuiFlexItem grow={false}>
          <span className='ctiFeed__feedIcon ctiFeed__feedIcon--large'>
            <EuiIcon type={tile.iconType} size='l' aria-hidden />
          </span>
        </EuiFlexItem>
        <EuiFlexItem>
          {unavailable ? (
            <EuiToolTip
              content={i18n.translate(
                'wazuhCheckUpdates.ctiFeed.content.unavailableTooltip',
                {
                  defaultMessage:
                    'This count is not available. The content may not be synced yet, or your user may lack access to it.',
                },
              )}
            >
              {stat}
            </EuiToolTip>
          ) : (
            stat
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};

export interface FeedContentPanelProps {
  counts: FeedContentCounts | null;
  loading: boolean;
  onRefresh: () => void;
}

export const FeedContentPanel: React.FC<FeedContentPanelProps> = ({
  counts,
  loading,
  onRefresh,
}) => (
  <EuiPanel hasBorder paddingSize='l' data-test-subj='ctiFeedContentPanel'>
    <EuiFlexGroup
      justifyContent='spaceBetween'
      alignItems='flexStart'
      responsive={false}
    >
      <EuiFlexItem>
        <EuiTitle size='xs'>
          <h2>
            {i18n.translate('wazuhCheckUpdates.ctiFeed.content.title', {
              defaultMessage: 'Feed content',
            })}
          </h2>
        </EuiTitle>
        <EuiText size='s' color='subdued'>
          {i18n.translate('wazuhCheckUpdates.ctiFeed.content.description', {
            defaultMessage:
              'What the feed has delivered to this environment. Content you create yourself is not counted.',
          })}
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          iconType='refresh'
          onClick={onRefresh}
          isDisabled={loading}
          aria-label={i18n.translate(
            'wazuhCheckUpdates.ctiFeed.content.refreshAriaLabel',
            { defaultMessage: 'Refresh feed content counts' },
          )}
          data-test-subj='ctiFeedContentRefresh'
        />
      </EuiFlexItem>
    </EuiFlexGroup>
    <EuiSpacer size='l' />
    <RedirectAppLinks application={getCore().application}>
      <EuiFlexGrid columns={3} gutterSize='m'>
        {CONTENT_TILES.map(tile => (
          <EuiFlexItem key={tile.key}>
            <Tile tile={tile} value={counts?.[tile.key]} loading={loading} />
          </EuiFlexItem>
        ))}
      </EuiFlexGrid>
    </RedirectAppLinks>
  </EuiPanel>
);
