import React, { useEffect, useState } from 'react';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import { compose } from 'redux';
import { getPlugins } from '../../../../kibana-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanels } from './dashboard_panels';
import { I18nProvider } from '@osd/i18n/react';
import { SearchResponse } from '../../../../../../../src/core/server';
import './styles.scss';
import { withErrorBoundary } from '../../../common/hocs';
import { IndexPattern } from '../../../../../../../src/plugins/data/common';
import { SampleDataWarning } from '../../../visualize/components';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../react-services/error-management';
import {
  AlertsDataSourceRepository,
  PatternDataSource,
  tParsedIndexPattern,
  useDataSource,
  AWSDataSource,
} from '../../../common/data-source';
import { DiscoverNoResults } from '../../../common/no-results/no-results';
import { LoadingSearchbarProgress } from '../../../common/loading-searchbar-progress/loading-searchbar-progress';
import { useReportingCommunicateSearchContext } from '../../../common/hooks/use-reporting-communicate-search-context';
import { WzSearchBar } from '../../../common/search-bar';
import { WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY } from '../../../../../common/constants';

const plugins = getPlugins();

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

const DashboardAWSComponents: React.FC = ({}) => {
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
    DataSource: AWSDataSource,
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
      .then(results => setResults(results))
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
              appName='aws-searchbar'
              {...searchBarProps}
              fixedFilters={fixedFilters}
            />
            {dataSource && results?.hits?.total === 0 ? (
              <DiscoverNoResults />
            ) : null}
            <div
              className={
                !isDataSourceLoading && dataSource && results?.hits?.total > 0
                  ? ''
                  : 'wz-no-display'
              }
            >
              <SampleDataWarning
                categoriesSampleData={[WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY]}
              />
              <div className='aws-dashboard-responsive'>
                <DashboardByRenderer
                  input={{
                    viewMode: ViewMode.VIEW,
                    panels: getDashboardPanels(
                      AlertsRepository.getStoreIndexPatternId(),
                      Boolean(dataSource?.getPinnedAgentFilter()?.length),
                    ),
                    isFullScreenMode: false,
                    filters: fetchFilters || [],
                    useMargins: true,
                    id: 'aws-dashboard-tab',
                    timeRange: { from: dateRangeFrom, to: dateRangeTo },
                    title: 'AWS dashboard',
                    description: 'Dashboard of the AWS',
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

export const DashboardAWS = compose(withErrorBoundary)(DashboardAWSComponents);
