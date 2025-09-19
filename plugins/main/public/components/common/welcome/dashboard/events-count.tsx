import React from 'react';
import { AlertsDataSourceRepository } from '../../data-source/pattern/alerts/alerts-data-source-repository';
import { getPlugins } from '../../../../kibana-services';
import { getDashboardPanels } from './dashboard_panels';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import {
  EuiPanel,
  EuiFlexItem,
  EuiFlexGroup,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { useTimeFilter } from '../../hooks';
import { LoadingSearchbarProgress } from '../../loading-searchbar-progress/loading-searchbar-progress';
import {
  withDataSource,
  withDataSourceInitiated,
  withDataSourceLoading,
} from '../../hocs';
import { compose } from 'redux';
import { EventsCountDataSource } from '../../data-source/pattern/alerts/events-count';

const plugins = getPlugins();
const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

const EventsDashboard = compose(
  withDataSource({
    // FIXME: This data source has no the filter related to the server API context
    DataSource: EventsCountDataSource,
    DataSourceRepositoryCreator: AlertsDataSourceRepository,
  }),
  withDataSourceLoading({
    isLoadingNameProp: 'dataSource.isLoading',
    LoadingComponent: LoadingSearchbarProgress,
  }),
  withDataSourceInitiated({
    dataSourceNameProp: 'dataSource.dataSource',
    isLoadingNameProp: 'dataSource.isLoading',
    dataSourceErrorNameProp: 'dataSource.error',
  }),
)(({ dataSource: dataSourceInitiation, timeFilter }) => {
  const { dataSource, fetchFilters } = dataSourceInitiation;
  return (
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
  );
});

export const EventsCount = () => {
  const { timeFilter } = useTimeFilter();

  return (
    <EuiPanel paddingSize='s'>
      <EuiFlexItem>
        <EuiFlexGroup>
          <EuiFlexItem>
            <h2 className='embPanel__title wz-headline-title'>
              <EuiText size='xs'>
                <h2>Events count evolution</h2>
              </EuiText>
            </h2>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size='s' />
        <EventsDashboard timeFilter={timeFilter}></EventsDashboard>
      </EuiFlexItem>
    </EuiPanel>
  );
};
