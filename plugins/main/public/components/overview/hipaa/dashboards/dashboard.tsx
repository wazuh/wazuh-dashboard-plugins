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
import {
  AlertsDataSourceRepository,
  PatternDataSource,
  tParsedIndexPattern,
  useDataSource,
} from '../../../common/data-source';
import { HIPAADataSource } from '../../../common/data-source/pattern/alerts/hipaa/hipaa-data-source';
import { useReportingCommunicateSearchContext } from '../../../common/hooks/use-reporting-communicate-search-context';
import { WzSearchBar } from '../../../common/search-bar';
import { WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY } from '../../../../../common/constants';

const plugins = getPlugins();

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

const DashboardHIPAAComponent: React.FC = () => {
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
    DataSource: HIPAADataSource,
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
              appName='hipaa-searchbar'
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
              <SampleDataWarning
                categoriesSampleData={[WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY]}
              />
              <div className='hipaa-dashboard-responsive'>
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
                    id: 'hipaa-dashboard-tab',
                    timeRange: { from: dateRangeFrom, to: dateRangeTo },
                    title: 'HIPAA dashboard',
                    description: 'Dashboard of the HIPAA',
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
            </div>
          </>
        )}
      </I18nProvider>
    </>
  );
};

export const DashboardHIPAA = compose(withErrorBoundary)(
  DashboardHIPAAComponent,
);
