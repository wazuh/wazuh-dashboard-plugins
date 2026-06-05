import React from 'react';
import { FindingsDataSourceRepository } from '../../data-source/pattern/events/findings-data-source-repository';
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

const FindingsDashboard = compose(
  withDataSource({
    // FIXME: This data source has no the filter related to the server API context
    DataSource: EventsCountDataSource,
    DataSourceRepositoryCreator: FindingsDataSourceRepository,
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
        id: 'agent-findings-count-evolution',
        timeRange: {
          from: timeFilter.from,
          to: timeFilter.to,
        },
        title: 'Findings count evolution',
        description: 'Dashboard of Findings count evolution',
        refreshConfig: {
          pause: false,
          value: 15,
        },
        hidePanelTitles: true,
      }}
    />
  );
});

export const FindingsCount = () => {
  const { timeFilter } = useTimeFilter();

  return (
    <EuiPanel paddingSize='m'>
      <EuiFlexGroup gutterSize='none'>
        <EuiFlexItem grow={false}>
          <Typography level='section'>Findings count evolution</Typography>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size='m' />
      <FindingsDashboard timeFilter={timeFilter}></FindingsDashboard>
    </EuiPanel>
  );
};
