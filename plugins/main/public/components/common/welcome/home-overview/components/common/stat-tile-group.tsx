import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiLink, EuiText } from '@elastic/eui';
import { getCore } from '../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { WidgetGroupBody } from './widget-group';
import { StatTile } from './stat-tile';
import { TabNumber } from './tab-number';
import { DataGroupResult } from '../../interfaces/data-group';
import { KPI_LINK_STYLE } from '../../lib/constants';
import { HOME_OVERVIEW_CHROME } from '../../lib/theme-colors';

export interface StatTileSpec<K extends string> {
  key: K;
  label: string;
  testSubj: string;
  /** Present only for clickable tiles; reference-only tiles omit it. */
  onSelect?: () => string;
  /**
   * Caption shared by consecutive tiles with the same value. The strip draws its dividers between
   * groups, so a tile without a group stands on its own.
   */
  group?: string;
}

export interface StatTileGroupProps<K extends string> {
  tiles: ReadonlyArray<StatTileSpec<K>>;
  results: Record<K, DataGroupResult<number | undefined>>;
}

/** Matches the 1px `HOME_OVERVIEW_CHROME.hairline`. */
const DIVIDER_WIDTH = 1;
/** Keeps a loading skeleton, which has no width of its own, as wide as a short value. */
const TILE_MIN_WIDTH = 80;

interface TileCluster<K extends string> {
  label?: string;
  tiles: Array<StatTileSpec<K>>;
}

const clusterTiles = <K extends string>(
  tiles: ReadonlyArray<StatTileSpec<K>>,
): Array<TileCluster<K>> =>
  tiles.reduce<Array<TileCluster<K>>>((clusters, tile) => {
    const last = clusters[clusters.length - 1];
    if (tile.group && last?.label === tile.group) {
      last.tiles.push(tile);
    } else {
      clusters.push({ label: tile.group, tiles: [tile] });
    }
    return clusters;
  }, []);

/**
 * A row of plain KPIs split by hairline dividers, so the values sit on the card itself instead of
 * on nested panels.
 */
export function StatTileGroup<K extends string>({
  tiles,
  results,
}: StatTileGroupProps<K>) {
  const renderTile = (tile: StatTileSpec<K>) => {
    const result = results[tile.key];
    const value = result.status === 'available' ? result.data : undefined;
    const number = (
      <TabNumber
        value={value}
        errorTooltip={
          result.status === 'error'
            ? result.error?.message ??
              i18n.translate(
                'wazuh.common.homeOverviewStatTileGroup.loadError',
                {
                  defaultMessage: 'Could not load {label}',
                  values: { label: tile.label },
                },
              )
            : undefined
        }
        errorColor={
          result.error?.kind === 'permission-denied' ? 'warning' : 'danger'
        }
        infoTooltip={
          result.status === 'unavailable' ? result.error?.message : undefined
        }
      />
    );

    const tileNode = (
      <StatTile
        value={
          tile.onSelect ? (
            <EuiLink
              style={KPI_LINK_STYLE}
              href={tile.onSelect()}
              data-test-subj={`${tile.testSubj}-link`}
            >
              {number}
            </EuiLink>
          ) : (
            number
          )
        }
        label={tile.label}
        reverse
        data-test-subj={tile.testSubj}
      />
    );

    if (result.status === 'loading') {
      return <WidgetGroupBody status='loading'>{null}</WidgetGroupBody>;
    }
    return tile.onSelect ? (
      <RedirectAppLinks application={getCore().application}>
        {tileNode}
      </RedirectAppLinks>
    ) : (
      tileNode
    );
  };

  const clusters = clusterTiles(tiles);
  const hasCaptions = clusters.some(cluster => cluster.label);
  // Every group draws its left divider and the row is shifted left by the divider's width: the
  // wrapper clips the divider of whichever group starts a line, so a wrapped line never opens
  // with one.
  return (
    <div style={{ overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          rowGap: 16,
          marginLeft: -DIVIDER_WIDTH,
        }}
      >
        {clusters.map(cluster => (
          <div
            key={cluster.tiles[0].key}
            style={{
              // Grow by tile count; never shrink below the values, so a group wraps instead of
              // overflowing.
              flex: `${cluster.tiles.length} 1 auto`,
              padding: '0 8px',
              borderLeft: HOME_OVERVIEW_CHROME.hairline,
            }}
          >
            {hasCaptions && (
              <EuiText
                size='xs'
                color='subdued'
                textAlign='center'
                style={{ marginBottom: 8 }}
              >
                {cluster.label ?? '\u00a0'}
              </EuiText>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {cluster.tiles.map(tile => (
                <div
                  key={tile.key}
                  style={{ flex: '1 0 auto', minWidth: TILE_MIN_WIDTH }}
                >
                  {renderTile(tile)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
