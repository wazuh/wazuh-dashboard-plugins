import React, { useState, useEffect } from 'react';
import { getPlugins } from '../../../../kibana-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { SearchResponse } from '../../../../../../../src/core/server';
import { IndexPattern } from '../../../../../../../src/plugins/data/common';
import { getDashboardPanels } from './dashboard_panels';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import { getKPIsPanel } from './dashboard_panels_kpis';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../react-services/error-management';
import { withErrorBoundary } from '../../../common/hocs/error-boundary/with-error-boundary';
import { SampleDataWarning } from '../../../visualize/components/sample-data-warning';
import {
  AlertsDataSourceRepository,
  PatternDataSource,
  tParsedIndexPattern,
  useDataSource,
} from '../../../common/data-source';
import { LoadingSpinner } from '../../../common/loading-spinner/loading-spinner';
import { DiscoverNoResults } from '../../../common/no-results/no-results';
import { VirusTotalDataSource } from '../../../common/data-source/pattern/alerts/virustotal/virustotal-data-source';
import './virustotal_dashboard.scss';
import { useReportingCommunicateSearchContext } from '../../../common/hooks/use-reporting-communicate-search-context';
import { WzSearchBar } from '../../../common/search-bar';

const plugins = getPlugins();

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;
const DashboardVT: React.FC = () => {
  const {
    filters,
    dataSource,
    fetchFilters,
    isLoading: isDataSourceLoading,
    fetchData,
    setFilters,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    DataSource: VirusTotalDataSource,
    repository: new AlertsDataSourceRepository(),
  });

  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);

  const { searchBarProps } = useSearchBar({
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
    time: {
      from: dateRangeFrom,
      to: dateRangeTo,
    },
  });

  useEffect(() => {
    if (isDataSourceLoading) {
      return;
    }
    fetchData({
      query,
      dateRange: {
        from: dateRangeFrom,
        to: dateRangeTo,
      },
    })
      .then(results => {
        setResults(results);
      })
      .catch(error => {
        const searchError = ErrorFactory.create(HttpError, {
          error,
          message: 'Error fetching alerts',
        });
        ErrorHandler.handleError(searchError);
      });
  }, [
    isDataSourceLoading,
    JSON.stringify(fetchFilters),
    JSON.stringify(query),
    dateRangeFrom,
    dateRangeTo,
  ]);

  return (
    <I18nProvider>
      <>
        {isDataSourceLoading && !dataSource ? (
          <LoadingSpinner />
        ) : (
          <WzSearchBar
            appName='virustotal-searchbar'
            {...searchBarProps}
            showDatePicker={true}
            showQueryInput={true}
            showQueryBar={true}
            showSaveQuery={true}
          />
        )}
        {!isDataSourceLoading && dataSource && results?.hits?.total > 0 ? (
          <SampleDataWarning />
        ) : null}
        {dataSource && results?.hits?.total === 0 ? (
          <DiscoverNoResults />
        ) : null}
        {!isDataSourceLoading && dataSource && results?.hits?.total > 0 ? (
          <div className='virustotal-dashboard-responsive'>
            <DashboardByRenderer
              input={{
                viewMode: ViewMode.VIEW,
                panels: getKPIsPanel(dataSource?.id),
                isFullScreenMode: false,
                filters: fetchFilters ?? [],
                useMargins: true,
                id: 'kpis-virustotal-dashboard-tab',
                timeRange: {
                  from: dateRangeFrom,
                  to: dateRangeTo,
                },
                title: 'KPIs Virustotal dashboard',
                description: 'KPIs Dashboard of the Virustotal',
                query: query,
                refreshConfig: {
                  pause: false,
                  value: 15,
                },
                hidePanelTitles: true,
              }}
            />
            <DashboardByRenderer
              input={{
                viewMode: ViewMode.VIEW,
                panels: getDashboardPanels(
                  dataSource?.id,
                  dataSource.getPinnedAgentFilter().length > 0,
                ),
                isFullScreenMode: false,
                filters: fetchFilters ?? [],
                useMargins: true,
                id: 'virustotal-dashboard-tab',
                timeRange: {
                  from: dateRangeFrom,
                  to: dateRangeTo,
                },
                title: 'Virustotal dashboard',
                description: 'Dashboard of the Virustotal',
                query: query,
                refreshConfig: {
                  pause: false,
                  value: 15,
                },
                hidePanelTitles: false,
              }}
            />
          </div>
        ) : null}
      </>
    </I18nProvider>
  );
};

export const DashboardVirustotal = withErrorBoundary(DashboardVT);
