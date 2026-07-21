import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiPanel } from '@elastic/eui';
import { WidgetGroupBody } from './widget-group';
import { StatTile } from './stat-tile';
import { TabNumber } from './tab-number';
import { DataGroupResult } from '../../interfaces/data-group';

export interface StatTileSpec<K extends string> {
  key: K;
  label: string;
  testSubj: string;
  /** Present only for clickable tiles; reference-only tiles omit it. */
  onSelect?: () => void;
}

export interface StatTileGroupProps<K extends string> {
  tiles: ReadonlyArray<StatTileSpec<K>>;
  results: Record<K, DataGroupResult<number>>;
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
        if (result.status === 'unavailable') {
          return null;
        }
        return (
          <EuiFlexItem key={tile.key}>
            <WidgetGroupBody
              status={result.status}
              errorLabel={`Could not load ${tile.label}`}
            >
              {result.data !== undefined &&
                (bordered ? (
                  <EuiPanel
                    paddingSize='s'
                    hasBorder
                    onClick={tile.onSelect}
                    data-test-subj={tile.testSubj}
                  >
                    <StatTile
                      value={<TabNumber value={result.data} />}
                      label={tile.label}
                      reverse
                    />
                  </EuiPanel>
                ) : (
                  <StatTile
                    value={<TabNumber value={result.data} />}
                    label={tile.label}
                    reverse
                    data-test-subj={tile.testSubj}
                  />
                ))}
            </WidgetGroupBody>
          </EuiFlexItem>
        );
      })}
    </EuiFlexGroup>
  );
}
