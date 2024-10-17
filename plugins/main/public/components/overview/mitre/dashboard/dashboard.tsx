import React, { useState, useEffect } from 'react';
import { getPlugins } from '../../../../kibana-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanels } from './dashboard-panels';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import { SampleDataWarning } from '../../../visualize/components';
import { IndexPattern } from '../../../../../../../src/plugins/data/common';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../react-services/error-management';
import { DiscoverNoResults } from '../../../common/no-results/no-results';
import { LoadingSearchbarProgress } from '../../../common/loading-searchbar-progress/loading-searchbar-progress';
import { SearchResponse } from '../../../../../../../src/core/server';
import './mitre_dashboard_filters.scss';
import {
  AlertsDataSourceRepository,
  MitreAttackDataSource,
  PatternDataSource,
  tParsedIndexPattern,
  useDataSource,
} from '../../../common/data-source';
import { useReportingCommunicateSearchContext } from '../../../common/hooks/use-reporting-communicate-search-context';
import { WzSearchBar } from '../../../common/search-bar';

const plugins = getPlugins();
const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

export const DashboardMITRE: React.FC = () => {
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
    DataSource: MitreAttackDataSource,
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
              appName='mitre-detector-searchbar'
              {...searchBarProps}
              fixedFilters={fixedFilters}
              showQueryInput={true}
              showQueryBar={true}
              showSaveQuery={true}
            />
            {dataSource && results?.hits?.total === 0 ? (
              <DiscoverNoResults />
            ) : null}
            <div
              className={`mitre-dashboard-responsive ${
                dataSource && results?.hits?.total > 0 ? '' : 'wz-no-display'
              }`}
            >
              <SampleDataWarning />
              <div className='mitre-dashboard-filters-wrapper'>
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
                    id: 'mitre-dashboard-tab-filters',
                    timeRange: { from: dateRangeFrom, to: dateRangeTo },
                    title: 'MITRE dashboard filters',
                    description: 'Dashboard of the MITRE filters',
                    query: query,
                    refreshConfig: {
                      pause: false,
                      value: 15,
                    },
                    hidePanelTitles: false,
                    lastReloadRequestTime: fingerprint,
                  }}
                />
              </div>
            </div>
          </>
        )}
      </I18nProvider>
    </>
  );
};
