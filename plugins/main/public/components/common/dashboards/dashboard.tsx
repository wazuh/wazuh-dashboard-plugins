import React from 'react';
import {
  withDataSourceFetchSearchBar,
  withErrorBoundary,
  withInjectProps,
} from '../hocs';
import { getPlugins } from '../../../kibana-services';
import { LoadingSearchbarProgress } from '../loading-searchbar-progress/loading-searchbar-progress';
import { useReportingCommunicateSearchContext } from '../hooks/use-reporting-communicate-search-context';
import { WzSearchBar } from '../search-bar';
import { DiscoverNoResults } from '../no-results/no-results';
import { SampleDataWarning } from '../../visualize/components';
import { compose } from 'redux';
import { ViewMode } from '../../../../../../src/plugins/embeddable/public';
import DashboardContainer from './dashboard-container/dashboard-container';

const DashboardByRenderer =
  getPlugins().dashboard.DashboardContainerByValueRenderer;

export const Dashboard = props => {
  // This is not used by the SCA dashboard.
  useReportingCommunicateSearchContext({
    isSearching: props.dataSource.dataSource.isLoading,
    totalResults: props.dataSourceAction?.data?.hits?.total ?? 0,
    indexPattern: props.dataSource.dataSource?.indexPattern,
    filters: props.dataSource.fetchFilters,
    query: props.dataSource.query,
    time: {
      from: props.dataSource.searchBarProps.dateRangeFrom,
      to: props.dataSource.searchBarProps.dateRangeTo,
    },
  });

  return (
    <>
      <WzSearchBar
        appName='dashboard-searchbar'
        {...props.dataSource.searchBarProps}
        fixedFilters={props.dataSource.fixedFilters}
        showDatePicker={Boolean(
          props.dataSource.dataSource.indexPattern.timeFieldName,
        )}
        showQueryInput={true}
        showQueryBar={true}
      />
      {props.dataSourceAction?.data?.hits?.total === 0 ? (
        <DiscoverNoResults />
      ) : null}
      <div
        className={
          props.dataSourceAction?.data?.hits?.total > 0 ? '' : 'wz-no-display'
        }
      >
        {props.sampleDataWarningCategories && (
          <SampleDataWarning
            categoriesSampleData={props.sampleDataWarningCategories}
          />
        )}

        <div className='wz-dashboard-responsive'>
          {props.getDashboardPanels.map(
            ({
              dashboardId,
              id,
              title,
              description,
              hidePanelTitles = false,
              useMargins = true,
              className = '',
            }) => {
              const idComponent = id;
              const dashboard = <DashboardContainer 
                dashboardId={dashboardId}
                className={className}
                config={{
                  title: title,
                  description: description,
                  dataSource: props.dataSource,
                  useMargins: useMargins,
                  hidePanelTitles: hidePanelTitles,
                }}
              />

              if (className) {
                /* Add a wrapper div with the className to apply styles that allow to overwrite
                some styles using CSS selectors */
                return (
                  <div className={className} key={idComponent}>
                    {dashboard}
                  </div>
                );
              }

              return dashboard;
            },
          )}
        </div>
      </div>
    </>
  );
};

/**
 * Create a dashboard component using minimal dependencies: datasource, sample data warning
 * categories, dashboard panels creator and dashboard metadata.
 *
 * This renders a search bar with a dashboard. Communicate the state with Generate Report button
 * @param param0
 * @returns
 */
export const createDashboard = ({
  DataSource,
  DataSourceRepositoryCreator,
  sampleDataWarningCategories,
  getDashboardPanels,
}: {
  DataSource: any;
  DataSourceRepositoryCreator: any;
  sampleDataWarningCategories?: string[];
  getDashboardPanels: Array<{
    dashboardId: string;
    id: string;
    title: string;
    description: string;
    hidePanelTitles: boolean;
    useMargins?: boolean;
    /**
     * Class name to apply to the dashboard container
     */
    className?: string;
  }>;
}) =>
  compose(
    withErrorBoundary,
    withInjectProps({
      sampleDataWarningCategories,
      getDashboardPanels,
    }),
    withDataSourceFetchSearchBar({
      DataSource,
      DataSourceRepositoryCreator,
      nameProp: 'dataSource',
      mapRequestParams: ({ dataSource, dependencies }) => {
        const [, , query, dateRangeFrom, dateRangeTo] = dependencies;
        return {
          query: JSON.parse(query),
          // Add conditionally the date range if the index pattern has a time field
          ...(dataSource.dataSource.indexPattern.timeFieldName
            ? {
                dateRange: {
                  from: dateRangeFrom,
                  to: dateRangeTo,
                },
              }
            : {}),
        };
      },
      mapFetchActionDependencies: props => [
        JSON.stringify(props.dataSource.fetchFilters),
        JSON.stringify(props.dataSource.searchBarProps.query),
        props.dataSource.searchBarProps.dateRangeFrom,
        props.dataSource.searchBarProps.dateRangeTo,
        props.dataSource.fingerprint,
        props.dataSource.searchBarProps.autoRefreshFingerprint,
      ],
      LoadingDataSourceComponent: LoadingSearchbarProgress,
    }),
  )(Dashboard);
