import React from 'react';
import { AlertsDataSourceRepository } from '../../data-source/pattern/alerts/alerts-data-source-repository';
import { getPlugins } from '../../../../kibana-services';
import { getDashboardPanels } from './dashboard_panels';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { useDataSource } from '../../data-source/hooks';
import { PatternDataSource, tParsedIndexPattern } from '../../data-source';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import { useTimeFilter } from '../../hooks';
import { LoadingSearchbarProgress } from '../../loading-searchbar-progress/loading-searchbar-progress';
import { EventsCountDataSource } from '../../data-source/pattern/alerts/events-count';

const plugins = getPlugins();
const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

export const EventsCount = () => {
  const {
    dataSource,
    fetchFilters,
    isLoading: isDataSourceLoading,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    DataSource: EventsCountDataSource,
    repository: new AlertsDataSourceRepository(),
  });

  const { timeFilter } = useTimeFilter();

  return (
    <EuiPanel paddingSize='m'>
      <EuiFlexGroup gutterSize='none'>
        <EuiFlexItem grow={false}>
          <EuiTitle size='s'>
            <h2>Events count evolution</h2>
          </EuiTitle>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size='m' />
      {!isDataSourceLoading && dataSource ? (
        <DashboardByRenderer
          input={{
            viewMode: ViewMode.VIEW,
            panels: getDashboardPanels(dataSource?.id),
            isFullScreenMode: false,
            filters: fetchFilters ?? [],
            useMargins: true,
            id: 'agent-events-count-evolution',
            timeRange: {
              from: timeFilter.from,
              to: timeFilter.to,
            },
            title: 'Events count evolution',
            description: 'Dashboard of Events count evolution',
            refreshConfig: {
              pause: false,
              value: 15,
            },
            hidePanelTitles: true,
          }}
        />
      ) : (
        <LoadingSearchbarProgress />
      )}
    </EuiPanel>
  );
};
