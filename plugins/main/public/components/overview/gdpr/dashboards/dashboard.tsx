import React, { useState, useEffect } from 'react';
import { SearchResponse } from '../../../../../../../src/core/server';
import { getPlugins } from '../../../../kibana-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanels } from './dashboard-panels';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import './styles.scss';
import { withErrorBoundary } from '../../../common/hocs';
import { DiscoverNoResults } from '../../../common/no-results/no-results';
import { LoadingSearchbarProgress } from '../../../common/loading-searchbar-progress/loading-searchbar-progress';
import { IndexPattern } from '../../../../../../../src/plugins/data/common';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../react-services/error-management';
import { compose } from 'redux';
import { SampleDataWarning } from '../../../visualize/components';
import { GDPRDataSource } from '../../../common/data-source/pattern/alerts/gdpr/gdpr-data-source';
import {
  AlertsDataSourceRepository,
  PatternDataSource,
  tParsedIndexPattern,
  useDataSource,
} from '../../../common/data-source';
import { useReportingCommunicateSearchContext } from '../../../common/hooks/use-reporting-communicate-search-context';
import { WzSearchBar } from '../../../common/search-bar';

const plugins = getPlugins();

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

const DashboardGDPRComponent: React.FC = () => {
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
    DataSource: GDPRDataSource,
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
      dateRange: absoluteDateRange,
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
    JSON.stringify(absoluteDateRange),
  ]);

  return (
    <>
      <I18nProvider>
        {isDataSourceLoading && !dataSource ? (
          <LoadingSearchbarProgress />
        ) : (
          <>
            <WzSearchBar
              appName='gdpr-searchbar'
              {...searchBarProps}
              fixedFilters={fixedFilters}
              showDatePicker={true}
              showQueryInput={true}
              showQueryBar={true}
            />
            {dataSource && results?.hits?.total === 0 ? (
              <DiscoverNoResults />
            ) : null}
            <div
              className={
                dataSource && results?.hits?.total > 0 ? '' : 'wz-no-display'
              }
            >
              <SampleDataWarning />
              <div className='gdpr-dashboard-responsive'>
                <DashboardByRenderer
                  input={{
                    viewMode: ViewMode.VIEW,
                    panels: getDashboardPanels(
                      AlertsRepository.getStoreIndexPatternId(),
                      Boolean(dataSource?.getPinnedAgentFilter()?.length),
                    ),
                    isFullScreenMode: false,
                    filters: fetchFilters ?? [],
                    useMargins: true,
                    id: 'gdpr-dashboard-tab',
                    timeRange: absoluteDateRange,
                    title: 'GDPR dashboard',
                    description: 'Dashboard of the GDPR',
                    query: searchBarProps.query,
                    refreshConfig: {
                      pause: false,
                      value: 15,
                    },
                    hidePanelTitles: false,
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

export const DashboardGDPR = compose(withErrorBoundary)(DashboardGDPRComponent);
