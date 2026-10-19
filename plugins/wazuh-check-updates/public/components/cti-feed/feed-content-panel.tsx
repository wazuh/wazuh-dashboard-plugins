import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButtonIcon,
  EuiFlexGrid,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
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

interface ContentTile {
  key: FeedContentKey;
  label: string;
  iconType: string;
}

const CONTENT_TILES: ContentTile[] = [
  {
    key: 'rules',
    label: i18n.translate('wazuhCheckUpdates.ctiFeed.content.tiles.rules', {
      defaultMessage: 'Rules',
    }),
    iconType: 'securitySignal',
  },
  {
    key: 'decoders',
    label: i18n.translate('wazuhCheckUpdates.ctiFeed.content.tiles.decoders', {
      defaultMessage: 'Decoders',
    }),
    iconType: 'logstashFilter',
  },
  {
    key: 'integrations',
    label: i18n.translate(
      'wazuhCheckUpdates.ctiFeed.content.tiles.integrations',
      { defaultMessage: 'Integrations' },
    ),
    iconType: 'integrationSecurity',
  },
  {
    key: 'kvdbs',
    label: i18n.translate('wazuhCheckUpdates.ctiFeed.content.tiles.kvdbs', {
      defaultMessage: 'KVDBs',
    }),
    iconType: 'database',
  },
  {
    key: 'iocs',
    label: i18n.translate('wazuhCheckUpdates.ctiFeed.content.tiles.iocs', {
      defaultMessage: 'Indicators of compromise',
    }),
    iconType: 'bug',
  },
  {
    key: 'vulnerabilities',
    label: i18n.translate(
      'wazuhCheckUpdates.ctiFeed.content.tiles.vulnerabilities',
      { defaultMessage: 'Vulnerabilities (CVEs)' },
    ),
    iconType: 'alert',
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
  const title = unavailable
    ? UNAVAILABLE_VALUE
    : numberFormat.format(value ?? 0);

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
    <EuiFlexGrid columns={3} gutterSize='m'>
      {CONTENT_TILES.map(tile => (
        <EuiFlexItem key={tile.key}>
          <Tile tile={tile} value={counts?.[tile.key]} loading={loading} />
        </EuiFlexItem>
      ))}
    </EuiFlexGrid>
  </EuiPanel>
);
