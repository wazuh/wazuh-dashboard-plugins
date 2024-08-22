import React from 'react';
import { getPlugins } from '../../../../plugin-services';
import { getDashboardPanels } from './dashboard_panels';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import {
  EuiPanel,
  EuiFlexItem,
  EuiFlexGroup,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';

export interface EventsCountProps {
  AlertsDataSource: any;
  AlertsDataSourceRepository: any;
  useDataSource: any;
  useTimeFilter: any;
  LoadingSpinner: any;
}
export const EventsCount = ({
  useDataSource,
  AlertsDataSource,
  AlertsDataSourceRepository,
  useTimeFilter,
  LoadingSpinner,
}: EventsCountProps) => {
  const {
    dataSource,
    fetchFilters,
    isLoading: isDataSourceLoading,
  } = useDataSource({
    DataSource: AlertsDataSource,
    repository: new AlertsDataSourceRepository(),
  });

  const plugins = getPlugins();
  const DashboardByRenderer =
    plugins.dashboard.DashboardContainerByValueRenderer;

  const { timeFilter } = useTimeFilter();

  return !isDataSourceLoading && dataSource ? (
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
      }}
    />
  ) : (
    <LoadingSpinner />
  );
};
