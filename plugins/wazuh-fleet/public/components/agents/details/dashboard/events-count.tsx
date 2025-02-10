import React from 'react';
import { getPlugins } from '../../../../plugin-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
// import {
//   EuiPanel,
//   EuiFlexItem,
//   EuiFlexGroup,
//   EuiSpacer,
//   EuiText,
// } from '@elastic/eui';
import { useTimeFilter } from '../../../common/table-indexer/components/search-bar/hooks/use-time-filter';
import { getDashboardPanels } from './dashboard_panels';

export interface EventsCountProps {
  AlertsDataSource: any;
  AlertsDataSourceRepository: any;
  useDataSource: any;
  useTimeFilter: any;
  LoadingSpinner: any;
  indexPattern: any;
}

export const EventsCount = ({
  // useDataSource,
  // AlertsDataSource,
  // AlertsDataSourceRepository,
  LoadingSpinner,
  indexPattern,
}: EventsCountProps) => {
  // const {
  //   dataSource,
  //   fetchFilters,
  //   isLoading: isDataSourceLoading,
  // } = useDataSource({
  //   DataSource: AlertsDataSource,
  //   repository: new AlertsDataSourceRepository(),
  // });

  const plugins = getPlugins();
  const DashboardByRenderer =
    plugins.dashboard.DashboardContainerByValueRenderer;
  const { timeFilter } = useTimeFilter();

  return indexPattern ? (
    <DashboardByRenderer
      input={{
        viewMode: ViewMode.VIEW,
        panels: getDashboardPanels(indexPattern.id),
        isFullScreenMode: false,
        filters: [],
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
      }}
    />
  ) : (
    <LoadingSpinner />
  );
};
