import React from 'react';
import {
  EuiPanel,
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
import { DiscoverNoResults } from '../../../common/no-results/no-results';

interface DashboardPerSpaceMetricsProps {
  indexPattern: IndexPattern;
  filters: tFilter[];
  searchBarProps: any;
  lastReloadRequestTime: number;
  spaces: string[];
  selectedSpace: string;
  onSelectSpace: (space: string) => void;
}

const PerSpaceMetrics: React.FC<DashboardPerSpaceMetricsProps> = ({
  indexPattern,
  filters,
  searchBarProps,
  lastReloadRequestTime,
  spaces,
  selectedSpace,
  onSelectSpace,
}) => {
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

  if (!spaces.length) {
    return <DiscoverNoResults />;
  }

  return (
    <EuiPanel paddingSize='m' style={{ marginTop: 16 }}>
      <EuiFlexGroup alignItems='center' gutterSize='s' responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiText size='s'>Space:</EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false} style={{ minWidth: 200 }}>
          <EuiSelect
            options={spaces.map(s => ({ value: s, text: s }))}
            value={selectedSpace}
            onChange={e => onSelectSpace(e.target.value)}
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
