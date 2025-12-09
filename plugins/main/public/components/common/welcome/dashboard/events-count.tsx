import React from 'react';
import { EventsDataSourceRepository } from '../../data-source/pattern/events/events-data-source-repository';
import { getPlugins } from '../../../../kibana-services';
import { getDashboardPanels } from './dashboard_panels';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { EuiPanel, EuiFlexGroup, EuiFlexItem, EuiSpacer } from '@elastic/eui';
import { Typography } from '../../typography/typography';
import { useTimeFilter } from '../../hooks';
import { LoadingSearchbarProgress } from '../../loading-searchbar-progress/loading-searchbar-progress';
import {
  withDataSource,
  withDataSourceInitiated,
  withDataSourceLoading,
} from '../../hocs';
import { compose } from 'redux';
import { EventsCountDataSource } from '../../data-source/pattern/events/events-count';

const plugins = getPlugins();
const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

const EventsDashboard = compose(
  withDataSource({
    // FIXME: This data source has no the filter related to the server API context
    DataSource: EventsCountDataSource,
    DataSourceRepositoryCreator: EventsDataSourceRepository,
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
    <EuiPanel paddingSize='m'>
      <EuiFlexGroup gutterSize='none'>
        <EuiFlexItem grow={false}>
          <Typography level='section'>Events count evolution</Typography>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size='m' />
      <EventsDashboard timeFilter={timeFilter}></EventsDashboard>
    </EuiPanel>
  );
};
