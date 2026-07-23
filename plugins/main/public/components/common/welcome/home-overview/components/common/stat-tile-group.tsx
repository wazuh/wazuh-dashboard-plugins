import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiPanel, EuiLink } from '@elastic/eui';
import { getCore } from '../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { WidgetGroupBody } from './widget-group';
import { StatTile } from './stat-tile';
import { TabNumber } from './tab-number';
import { DataGroupResult } from '../../interfaces/data-group';

export interface StatTileSpec<K extends string> {
  key: K;
  label: string;
  testSubj: string;
  /** Present only for clickable tiles; reference-only tiles omit it. */
  onSelect?: () => string;
}

export interface StatTileGroupProps<K extends string> {
  tiles: ReadonlyArray<StatTileSpec<K>>;
  results: Record<K, DataGroupResult<number | undefined>>;
}

export function StatTileGroup<K extends string>({
  tiles,
  results,
}: StatTileGroupProps<K>) {
  const bordered = tiles.some(tile => tile.onSelect);
  return (
    <EuiFlexGroup gutterSize='m' responsive={false} wrap>
      {tiles.map(tile => {
        const result = results[tile.key];
        const value = result.status === 'available' ? result.data : undefined;
        const number = <TabNumber value={value} />;

        let tileNode: React.ReactNode;
        if (tile.onSelect) {
          tileNode = (
            <EuiPanel paddingSize='s' hasBorder data-test-subj={tile.testSubj}>
              <RedirectAppLinks application={getCore().application}>
                <StatTile
                  value={
                    <EuiLink
                      style={{ fontWeight: 'normal' }}
                      href={tile.onSelect()}
                      color='text'
                      data-test-subj={`${tile.testSubj}-link`}
                    >
                      {number}
                    </EuiLink>
                  }
                  label={tile.label}
                  reverse
                  data-test-subj={tile.testSubj}
                />
              </RedirectAppLinks>
            </EuiPanel>
          );
        } else if (bordered) {
          tileNode = (
            <EuiPanel paddingSize='s' hasBorder data-test-subj={tile.testSubj}>
              <StatTile value={number} label={tile.label} reverse />
            </EuiPanel>
          );
        } else {
          tileNode = (
            <StatTile
              value={number}
              label={tile.label}
              reverse
              data-test-subj={tile.testSubj}
            />
          );
        }

        return (
          <EuiFlexItem key={tile.key}>
            {result.status === 'loading' ? (
              <WidgetGroupBody status='loading'>{null}</WidgetGroupBody>
            ) : (
              tileNode
            )}
          </EuiFlexItem>
        );
      })}
    </EuiFlexGroup>
  );
}
