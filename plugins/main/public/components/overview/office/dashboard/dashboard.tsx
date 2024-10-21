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
import { getKPIsPanel } from './dashboard_panels_kpis';
import {
  AlertsDataSourceRepository,
  PatternDataSource,
  tParsedIndexPattern,
  useDataSource,
} from '../../../common/data-source';
import { Office365DataSource } from '../../../common/data-source/pattern/alerts/office-365/office-365-data-source';
import { DiscoverNoResults } from '../../../common/no-results/no-results';
import { LoadingSearchbarProgress } from '../../../common/loading-searchbar-progress/loading-searchbar-progress';
import { useReportingCommunicateSearchContext } from '../../../common/hooks/use-reporting-communicate-search-context';
import { WzSearchBar } from '../../../common/search-bar';

const plugins = getPlugins();

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

const DashboardOffice365Component: React.FC = () => {
  const AlertsRepository = new AlertsDataSourceRepository();
  const {
    filters,
    dataSource,
    fetchFilters,
    fixedFilters,
    isLoading: isDataSourceLoading,
    fetchData,
    setFilters,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    DataSource: Office365DataSource,
    repository: AlertsRepository,
  });

  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);
  const { searchBarProps, fingerprint, autoRefreshFingerprint } = useSearchBar({
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters,
    setFilters,
  });
  const { query, dateRangeFrom, dateRangeTo } = searchBarProps;

  useReportingCommunicateSearchContext({
    isSearching: isDataSourceLoading,
    totalResults: results?.hits?.total ?? 0,
    indexPattern: dataSource?.indexPattern,
    filters: fetchFilters,
    query: query,
    time: { from: dateRangeFrom, to: dateRangeTo },
  });

  useEffect(() => {
    if (isDataSourceLoading) {
      return;
    }
    fetchData({
      query,
      dateRange: { from: dateRangeFrom, to: dateRangeTo },
    })
      .then(results => {
        setResults(results);
      })
      .catch(error => {
        const searchError = ErrorFactory.create(HttpError, {
          error,
          message: 'Error fetching data',
        });
        ErrorHandler.handleError(searchError);
      });
  }, [
    JSON.stringify(fetchFilters),
    JSON.stringify(query),
    dateRangeFrom,
    dateRangeTo,
    fingerprint,
    autoRefreshFingerprint,
  ]);

  return (
    <>
      <I18nProvider>
        {isDataSourceLoading && !dataSource ? (
          <LoadingSearchbarProgress />
        ) : (
          <>
            <WzSearchBar
              appName='google-cloud-searchbar'
              {...searchBarProps}
              fixedFilters={fixedFilters}
              showDatePicker={true}
              showQueryInput={true}
              showQueryBar={true}
              showSaveQuery={true}
            />
            {dataSource && results?.hits?.total === 0 ? (
              <DiscoverNoResults />
            ) : null}

            <div
              className={`office-365-dashboard-responsive ${
                dataSource && results?.hits?.total > 0 ? '' : 'wz-no-display'
              }`}
            >
              <SampleDataWarning />
              <DashboardByRenderer
                input={{
                  viewMode: ViewMode.VIEW,
                  panels: getKPIsPanel(
                    AlertsRepository.getStoreIndexPatternId(),
                  ),
                  isFullScreenMode: false,
                  filters: fetchFilters ?? [],
                  useMargins: true,
                  id: 'kpis-th-dashboard-tab',
                  timeRange: { from: dateRangeFrom, to: dateRangeTo },
                  title: 'KPIs Office 365 dashboard',
                  description: 'KPIs Dashboard of the Office 365',
                  query: searchBarProps.query,
                  refreshConfig: {
                    pause: false,
                    value: 15,
                  },
                  hidePanelTitles: true,
                  lastReloadRequestTime: fingerprint,
                }}
              />
              <DashboardByRenderer
                input={{
                  viewMode: ViewMode.VIEW,
                  panels: getDashboardPanels(
                    AlertsRepository.getStoreIndexPatternId(),
                  ),
                  isFullScreenMode: false,
                  filters: fetchFilters ?? [],
                  useMargins: true,
                  id: 'office-365-detector-dashboard-tab',
                  timeRange: { from: dateRangeFrom, to: dateRangeTo },
                  title: 'Office 365 detector dashboard',
                  description: 'Dashboard of the Office 365',
                  query: searchBarProps.query,
                  refreshConfig: {
                    pause: false,
                    value: 15,
                  },
                  hidePanelTitles: false,
                  lastReloadRequestTime: fingerprint,
                }}
              />
            </div>
          </>
        )}
      </I18nProvider>
    </>
  );
};

export const DashboardOffice365 = compose(withErrorBoundary)(
  DashboardOffice365Component,
);
