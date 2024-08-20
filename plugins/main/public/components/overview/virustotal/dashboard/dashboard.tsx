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
    DataSource: VirusTotalDataSource,
    repository: AlertsRepository,
  });

  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);

  const { searchBarProps } = useSearchBar({
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters,
    setFilters,
  });
  const { query, absoluteDateRange } = searchBarProps;

  useReportingCommunicateSearchContext({
    isSearching: isDataSourceLoading,
    totalResults: results?.hits?.total ?? 0,
    indexPattern: dataSource?.indexPattern,
    filters: fetchFilters,
    query: query,
    time: absoluteDateRange,
  });

  useEffect(() => {
    if (isDataSourceLoading) {
      return;
    }
    fetchData({
      query,
      dateRange: absoluteDateRange
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
    isDataSourceLoading,
    JSON.stringify(fetchFilters),
    JSON.stringify(query),
    JSON.stringify(absoluteDateRange),
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
            fixedFilters={fixedFilters}
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
        <div
          className={`virustotal-dashboard-responsive ${!isDataSourceLoading && dataSource && results?.hits?.total > 0
              ? ''
              : 'wz-no-display'
            }`}
        >
          <DashboardByRenderer
            input={{
              viewMode: ViewMode.VIEW,
              panels: getKPIsPanel(AlertsRepository.getStoreIndexPatternId()),
              isFullScreenMode: false,
              filters: fetchFilters ?? [],
              useMargins: true,
              id: 'kpis-virustotal-dashboard-tab',
              timeRange: absoluteDateRange,
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
                AlertsRepository.getStoreIndexPatternId(),
                Boolean(dataSource?.getPinnedAgentFilter().length),
              ),
              isFullScreenMode: false,
              filters: fetchFilters ?? [],
              useMargins: true,
              id: 'virustotal-dashboard-tab',
              timeRange: absoluteDateRange,
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
      </>
    </I18nProvider>
  );
};

export const DashboardVirustotal = withErrorBoundary(DashboardVT);
