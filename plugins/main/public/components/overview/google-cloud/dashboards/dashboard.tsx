import React, { useState, useEffect } from 'react';
import { SearchResponse } from '../../../../../../../src/core/server';
import { getPlugins } from '../../../../kibana-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanels } from './dashboard_panels';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import { withErrorBoundary } from '../../../common/hocs';
import { IndexPattern } from '../../../../../../../src/plugins/data/common';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../react-services/error-management';
import { compose } from 'redux';
import { SampleDataWarning } from '../../../visualize/components';
import {
  AlertsDataSourceRepository,
  PatternDataSource,
  tParsedIndexPattern,
  useDataSource,
} from '../../../common/data-source';
import { GoogleCloudDataSource } from '../../../common/data-source/pattern/alerts/google-cloud/google-cloud-data-source';
import { DiscoverNoResults } from '../../../common/no-results/no-results';
import { LoadingSpinner } from '../../../common/loading-spinner/loading-spinner';

const plugins = getPlugins();

const SearchBar = getPlugins().data.ui.SearchBar;

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

const DashboardGoogleCloudComponent: React.FC = () => {
  const {
    filters,
    dataSource,
    fetchFilters,
    isLoading: isDataSourceLoading,
    fetchData,
    setFilters,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    DataSource: GoogleCloudDataSource,
    repository: new AlertsDataSourceRepository(),
  });

  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);

  const { searchBarProps } = useSearchBar({
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters,
    setFilters,
  });

  const { query, dateRangeFrom, dateRangeTo } = searchBarProps;

  useEffect(() => {
    if (isDataSourceLoading) {
      return;
    }
    fetchData({
      query,
      dateRange: {
        to: dateRangeTo,
        from: dateRangeFrom,
      },
    })
      .then(results => setResults(results))
      .catch(error => {
        const searchError = ErrorFactory.create(HttpError, {
          error,
          message: 'Error fetching alerts',
        });
        ErrorHandler.handleError(searchError);
      });
  }, [
    JSON.stringify(fetchFilters),
    JSON.stringify(query),
    JSON.stringify(dateRangeFrom),
    JSON.stringify(dateRangeTo),
  ]);

  return (
    <>
      <I18nProvider>
        <>
          {isDataSourceLoading && !dataSource ? (
            <LoadingSpinner />
          ) : (
              <div className='wz-search-bar hide-filter-control'>
                <SearchBar
                  appName='google-cloud-searchbar'
                  {...searchBarProps}
                  showDatePicker={true}
                  showQueryInput={true}
                  showQueryBar={true}
                  showSaveQuery={true}
                />
              </div>
            )}
          {dataSource && results?.hits?.total === 0 ? (
            <DiscoverNoResults />
          ) : null}
          {dataSource && results?.hits?.total > 0 ? (
            <>
              <SampleDataWarning />
              <div className='google-cloud-dashboard-responsive'>
                <DashboardByRenderer
                  input={{
                    viewMode: ViewMode.VIEW,
                    panels: getDashboardPanels(
                      dataSource?.id,
                      Boolean(dataSource?.getPinnedAgentFilter()?.length),
                    ),
                    isFullScreenMode: false,
                    filters: fetchFilters ?? [],
                    useMargins: true,
                    id: 'google-cloud-detector-dashboard-tab',
                    timeRange: {
                      from: searchBarProps.dateRangeFrom,
                      to: searchBarProps.dateRangeTo,
                    },
                    title: 'Google Cloud detector dashboard',
                    description: 'Dashboard of the Google Cloud',
                    query: searchBarProps.query,
                    refreshConfig: {
                      pause: false,
                      value: 15,
                    },
                    hidePanelTitles: false,
                  }}
                />
              </div>
            </>
          ) : null}
        </>
      </I18nProvider>
    </>
  );
};

export const DashboardGoogleCloud = compose(withErrorBoundary)(
  DashboardGoogleCloudComponent,
);
