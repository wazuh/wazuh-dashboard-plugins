import React, { useState, useEffect } from 'react';
import { getPlugins } from '../../../../kibana-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { SearchResponse } from '../../../../../../../src/core/server';
import { IndexPattern } from '../../../../../../../src/plugins/data/common';
import { getDashboardPanelsListenerEngine } from './dashboard_panels_listener_engine';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import { WAZUH_STATISTICS_PATTERN } from '../../../../../common/constants';
import { search } from '../../../common/search-bar/search-bar-service';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../react-services/error-management';
import { LoadingSpinner } from '../../vulnerabilities/common/components/loading_spinner';
import { DiscoverNoResults } from '../components/no_results';
import { withErrorBoundary } from '../../../common/hocs/error-boundary/with-error-boundary';
import './statistics_dashboard.scss';

const plugins = getPlugins();

const SearchBar = getPlugins().data.ui.SearchBar;

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

interface DashboardStatisticsProps {
  isClusterMode: boolean;
}

const DashboardStatistics: React.FC<DashboardStatisticsProps> = ({
  isClusterMode,
}) => {
  /* TODO: Analyze whether to use the new index pattern handler https://github.com/wazuh/wazuh-dashboard-plugins/issues/6434
  Replace WAZUH_ALERTS_PATTERN with appState.getCurrentPattern... */
  const STATISTICS_INDEX_PATTERN_ID = WAZUH_STATISTICS_PATTERN;

  const { searchBarProps } = useSearchBar({
    defaultIndexPatternID: STATISTICS_INDEX_PATTERN_ID,
  });

  const { isLoading, query, indexPatterns } = searchBarProps;
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);

  useEffect(() => {
    if (!isLoading) {
      search({
        indexPattern: indexPatterns?.[0] as IndexPattern,
        filters: searchBarProps.filters ?? [],
        query,
      })
        .then(results => {
          setResults(results);
          setIsSearching(false);
        })
        .catch(error => {
          const searchError = ErrorFactory.create(HttpError, {
            error,
            message: 'Error fetching results',
          });
          ErrorHandler.handleError(searchError);
          setIsSearching(false);
        });
    }
  }, [JSON.stringify(searchBarProps)]);

  return (
    <>
      <I18nProvider>
        {isLoading ? <LoadingSpinner /> : null}
        {!isLoading ? (
          <SearchBar
            appName='listener-engine-statistics-searchbar'
            {...searchBarProps}
            showDatePicker={true}
            showQueryInput={false}
            showQueryBar={true}
          />
        ) : null}
        {isSearching ? <LoadingSpinner /> : null}
        {!isLoading && !isSearching && results?.hits?.total === 0 ? (
          <DiscoverNoResults />
        ) : null}
        {!isLoading && !isSearching && results?.hits?.total > 0 ? (
          <div className='server-management-statistics-dashboard-responsive'>
            <DashboardByRenderer
              input={{
                viewMode: ViewMode.VIEW,
                panels: getDashboardPanelsListenerEngine(
                  STATISTICS_INDEX_PATTERN_ID,
                ),
                isFullScreenMode: false,
                filters: [],
                useMargins: true,
                id: 'listener-engine-statistics-dashboard',
                timeRange: {
                  from: searchBarProps.dateRangeFrom,
                  to: searchBarProps.dateRangeTo,
                },
                title: 'Listener Engine Statistics dashboard',
                description: 'Dashboard of the Listener Engine Statistics',
                query: searchBarProps.query,
                refreshConfig: {
                  pause: false,
                  value: 15,
                },
                hidePanelTitles: false,
              }}
            />
          </div>
        ) : null}
      </I18nProvider>
    </>
  );
};

export const DashboardListenerEngineStatistics =
  withErrorBoundary(DashboardStatistics);
