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
import { LoadingSearchbarProgress } from '../../../../../public/components/common/loading-searchbar-progress/loading-searchbar-progress';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../react-services/error-management';
import { compose } from 'redux';

import {
  PatternDataSource,
  tParsedIndexPattern,
  SystemInventoryStatesDataSource,
  SystemInventoryStatesDataSourceRepository,
} from '../../../common/data-source';
import { useDataSource } from '../../../common/data-source/hooks';
import { IndexPattern } from '../../../../../../../src/plugins/data/public';
import { WzSearchBar } from '../../../common/search-bar';
import { withSystemInventoryDataSource } from '../common/hocs/validate-system-inventory-index-pattern';
import { useReportingCommunicateSearchContext } from '../../../common/hooks/use-reporting-communicate-search-context';
import { getDashboardKPIs } from './dashboard-kpi';
import { getDashboardTables } from './dashboard-tables';

const plugins = getPlugins();
const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

/* The vulnerabilities dashboard is made up of 3 dashboards because the filters need
a wrapper for visual adjustments, while the Kpi, the Open vs Close visualization and
the rest of the visualizations have different configurations at the dashboard level. */

interface DashboardITHygieneProps {
  indexPattern: IndexPattern;
}

const DashboardITHygieneComponent: React.FC<DashboardITHygieneProps> = ({
  indexPattern,
}) => {
  const {
    filters,
    dataSource,
    fetchFilters,
    fixedFilters,
    isLoading: isDataSourceLoading,
    fetchData,
    setFilters,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    DataSource: SystemInventoryStatesDataSource,
    repository: new SystemInventoryStatesDataSourceRepository(),
  });

  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);

  const { searchBarProps, fingerprint } = useSearchBar({
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters,
    setFilters,
  });
  const { query } = searchBarProps;

  useReportingCommunicateSearchContext({
    isSearching: isDataSourceLoading,
    totalResults: results?.hits?.total ?? 0,
    indexPattern: dataSource?.indexPattern,
    filters: fetchFilters,
    query: query,
  });

  useEffect(() => {
    if (isDataSourceLoading) {
      return;
    }
    fetchData({ query })
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
  }, [JSON.stringify(fetchFilters), JSON.stringify(query)]);

  return (
    <>
      <I18nProvider>
        <>
          {isDataSourceLoading && !dataSource ? (
            <LoadingSearchbarProgress />
          ) : (
            <>
              <WzSearchBar
                appName='it-hygiene-searchbar'
                {...searchBarProps}
                filters={filters}
                fixedFilters={fixedFilters}
                showDatePicker={false}
                showQueryInput={true}
                showQueryBar={true}
                showSaveQuery={true}
              />

              {dataSource && results?.hits?.total === 0 ? (
                <DiscoverNoResults />
              ) : null}
              <div
                className={`wz-dashboard-responsive wz-dashboard-hide-tables-pagination-export-csv-controls ${
                  dataSource && results?.hits?.total > 0 ? '' : 'wz-no-display'
                }`}
              >
                <DashboardByRenderer
                  input={{
                    viewMode: ViewMode.VIEW,
                    // Try to use the index pattern that the dataSource has
                    // but if it is undefined use the index pattern of the hoc
                    // because the first executions of the dataSource are undefined
                    // and embeddables need index pattern.
                    panels: getDashboardKPIs(
                      dataSource?.id || indexPattern?.id,
                    ),
                    isFullScreenMode: false,
                    filters: fetchFilters ?? [],
                    useMargins: true,
                    id: 'kpis-vulnerability-detector-dashboard-tab',
                    timeRange: {
                      from: searchBarProps.dateRangeFrom,
                      to: searchBarProps.dateRangeTo,
                    },
                    title: 'KPIs Vulnerability detector dashboard',
                    description: 'KPIs Dashboard of the Vulnerability detector',
                    query: searchBarProps.query,
                    refreshConfig: {
                      pause: false,
                      value: 15,
                    },
                    hidePanelTitles: true,
                    lastReloadRequestTime: fingerprint,
                  }}
                />
                <div className='it-hygiene-filters-wrapper'>
                  <DashboardByRenderer
                    input={{
                      viewMode: ViewMode.VIEW,
                      // Try to use the index pattern that the dataSource has
                      // but if it is undefined use the index pattern of the hoc
                      // because the first executions of the dataSource are undefined
                      // and embeddables need index pattern.
                      panels: getDashboardTables(
                        dataSource?.id || indexPattern?.id,
                      ),
                      isFullScreenMode: false,
                      filters: fetchFilters ?? [],
                      useMargins: false,
                      id: 'it-hygiene-dashboard-tab-filters',
                      timeRange: {
                        from: searchBarProps.dateRangeFrom,
                        to: searchBarProps.dateRangeTo,
                      },
                      title: 'IT Hygiene dashboard filters',
                      description: 'Dashboard of the IT Hygiene filters',
                      query: searchBarProps.query,
                      refreshConfig: {
                        pause: false,
                        value: 15,
                      },
                      hidePanelTitles: true,
                      lastReloadRequestTime: fingerprint,
                    }}
                  />
                </div>

                <DashboardByRenderer
                  input={{
                    viewMode: ViewMode.VIEW,
                    // Try to use the index pattern that the dataSource has
                    // but if it is undefined use the index pattern of the hoc
                    // because the first executions of the dataSource are undefined
                    // and embeddables need index pattern.
                    panels: getDashboardPanels(
                      dataSource?.id || indexPattern?.id,
                      Boolean(dataSource?.getPinnedAgentFilter()?.length),
                    ),
                    isFullScreenMode: false,
                    filters: fetchFilters ?? [],
                    useMargins: true,
                    id: 'it-hygiene-dashboard-tab',
                    timeRange: {
                      from: searchBarProps.dateRangeFrom,
                      to: searchBarProps.dateRangeTo,
                    },
                    title: 'IT Hygiene dashboard',
                    description: 'Dashboard of the IT Hygiene',
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
        </>
      </I18nProvider>
    </>
  );
};

export const DashboardITHygiene = compose(
  withErrorBoundary,
  withSystemInventoryDataSource,
)(DashboardITHygieneComponent);
