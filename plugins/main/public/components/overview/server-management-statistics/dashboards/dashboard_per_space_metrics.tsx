import React, { useEffect, useState } from 'react';
import {
  EuiPanel,
  EuiTitle,
  EuiSpacer,
  EuiSelect,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
} from '@elastic/eui';
import DashboardRenderer from '../../../common/dashboards/dashboard-renderer/dashboard-renderer';
import { withErrorBoundary } from '../../../common/hocs/error-boundary/with-error-boundary';
import { tFilter } from '../../../common/data-source';
import { IndexPattern } from '../../../../../../../src/plugins/data/public';
import { search } from '../../../common/search-bar/search-bar-service';

interface DashboardPerSpaceMetricsProps {
  indexPattern: IndexPattern;
  filters: tFilter[];
  searchBarProps: any;
  lastReloadRequestTime: number;
}

const PerSpaceMetrics: React.FC<DashboardPerSpaceMetricsProps> = ({
  indexPattern,
  filters,
  searchBarProps,
  lastReloadRequestTime,
}) => {
  const [spaces, setSpaces] = useState<string[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string>('');

  useEffect(() => {
    if (!indexPattern) return;
    let cancelled = false;

    (async () => {
      try {
        const res: any = await search({
          indexPattern,
          aggs: {
            spaces: { terms: { field: 'wazuh.space.name', size: 50 } },
          },
        } as any);

        if (cancelled) return;
        const buckets = res?.aggregations?.spaces?.buckets ?? [];
        const names: string[] = buckets
          .map((b: any) => b.key)
          .filter((k: any) => typeof k === 'string' && k.length > 0);
        setSpaces(names);
        setSelectedSpace(prev =>
          prev && names.includes(prev) ? prev : names[0] ?? '',
        );
      } catch {
        /* ignore — selector will stay empty */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [indexPattern?.id]);

  const spaceFilter: tFilter | null = selectedSpace
    ? ({
        meta: {
          alias: null,
          disabled: false,
          index: indexPattern?.id,
          negate: false,
          key: 'wazuh.space.name',
          value: selectedSpace,
          type: 'phrase',
          params: { query: selectedSpace, type: 'phrase' },
        },
        query: { match_phrase: { 'wazuh.space.name': selectedSpace } },
        $state: { store: 'appState' },
      } as unknown as tFilter)
    : null;

  const combinedFilters = spaceFilter ? [...filters, spaceFilter] : filters;

  return (
    <EuiPanel paddingSize='m' style={{ marginTop: 16 }}>
      <EuiTitle size='s'>
        <h3>Per-Space Metrics</h3>
      </EuiTitle>
      <EuiSpacer size='s' />
      <EuiFlexGroup alignItems='center' gutterSize='s' responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiText size='s'>Space:</EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false} style={{ minWidth: 200 }}>
          <EuiSelect
            options={spaces.map(s => ({ value: s, text: s }))}
            value={selectedSpace}
            onChange={e => setSelectedSpace(e.target.value)}
            disabled={!spaces.length}
            aria-label='Select space'
            compressed
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size='m' />
      <DashboardRenderer
        dashboardId='wz-dashboard-server-statistics-per-space-metrics'
        hasPinnedAgent={false}
        config={{
          dataSource: {
            fetchFilters: combinedFilters,
            searchBarProps,
            fingerprint: lastReloadRequestTime,
          },
        }}
      />
    </EuiPanel>
  );
};

export const DashboardPerSpaceMetrics = withErrorBoundary(PerSpaceMetrics);
