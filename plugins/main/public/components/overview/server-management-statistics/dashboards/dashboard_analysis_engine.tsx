import React, { useEffect, useState } from 'react';
import { getPlugins } from '../../../../kibana-services';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import { withErrorBoundary } from '../../../common/hocs/error-boundary/with-error-boundary';
import { getDashboardPanelsAnalysisEngine } from './dashboard_panels_analysis_engine';
import {
  EuiFlexItem,
  EuiFlexGroup,
  EuiSelect,
  EuiSpacer,
  EuiCallOut,
  EuiPanel,
} from '@elastic/eui';
import './statistics_dashboard.scss';
import {
  PatternDataSource,
  tParsedIndexPattern,
  useDataSource,
} from '../../../common/data-source';
import { IndexPattern } from '../../../../../../../src/plugins/data/public';
import { SearchResponse } from '../../../../../../../src/core/server';
import {
  StatisticsDataSource,
  StatisticsDataSourceRepository,
} from '../../../common/data-source/pattern/statistics';
import { LoadingSpinner } from '../../../common/loading-spinner/loading-spinner';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../react-services/error-management';
import { DiscoverNoResults } from '../../../common/no-results/no-results';

const plugins = getPlugins();

const SearchBar = getPlugins().data.ui.SearchBar;

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

interface DashboardStatisticsProps {
  isClusterMode: boolean;
  clusterNodes: any[];
  clusterNodeSelected: any;
  onSelectNode: any;
}

const DashboardStatistics: React.FC<DashboardStatisticsProps> = ({
  isClusterMode,
  clusterNodes,
  clusterNodeSelected,
  onSelectNode,
}) => {
  const {
    filters,
    fetchFilters,
    dataSource,
    fetchData,
    setFilters,
    isLoading: isDataSourceLoading,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    DataSource: StatisticsDataSource,
    repository: new StatisticsDataSourceRepository(),
  });

  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);

  const selectedNodeFilter = {
    meta: {
      removable: false,
      index: dataSource?.id,
      negate: false,
      disabled: false,
      alias: null,
      type: 'phrase',
      key: null,
      value: null,
      params: {
        query: null,
        type: 'phrase',
      },
    },
    query: {
      match: {
        nodeName: clusterNodeSelected,
      },
    },
    $state: {
      store: 'appState',
    },
  };

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
          message: 'Error fetching statistics',
        });
        ErrorHandler.handleError(searchError);
      });
  }, [
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
          <EuiFlexGroup alignItems='center' justifyContent='flexEnd'>
            {!!(clusterNodes && clusterNodes.length && clusterNodeSelected) && (
              <EuiFlexItem grow={false}>
                <EuiSelect
                  id='selectNode'
                  options={clusterNodes}
                  value={clusterNodeSelected}
                  onChange={onSelectNode}
                  aria-label='Select node'
                />
              </EuiFlexItem>
            )}
            <SearchBar
              appName='analysis-engine-statistics-searchbar'
              {...searchBarProps}
              showDatePicker={true}
              showQueryInput={false}
              showQueryBar={true}
              showFilterBar={false}
            />
          </EuiFlexGroup>
        )}
        <EuiSpacer size={'m'} />
        <EuiPanel hasBorder={false} hasShadow={false} color='transparent'>
          <EuiCallOut
            title={
              'Remoted statistics are cumulative, this means that the information shown is since the data exists.'
            }
            iconType='iInCircle'
          />
        </EuiPanel>

        {dataSource && results?.hits?.total === 0 ? (
          <DiscoverNoResults />
        ) : null}
        {!isDataSourceLoading && dataSource && results?.hits?.total > 0 ? (
          <div className='server-management-statistics-dashboard-responsive'>
            <DashboardByRenderer
              input={{
                viewMode: ViewMode.VIEW,
                panels: getDashboardPanelsAnalysisEngine(
                  dataSource?.id!,
                  isClusterMode,
                ),
                isFullScreenMode: false,
                filters:
                  clusterNodeSelected !== 'all'
                    ? [...fetchFilters, selectedNodeFilter]
                    : [...(fetchFilters ?? [])],
                useMargins: true,
                id: 'analysis-engine-statistics-dashboard',
                timeRange: {
                  from: searchBarProps.dateRangeFrom,
                  to: searchBarProps.dateRangeTo,
                },
                title: 'Analysis Engine Statistics dashboard',
                description: 'Dashboard of the Analysis Engine Statistics',
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
      </>
    </I18nProvider>
  );
};

export const DashboardAnalysisEngineStatistics =
  withErrorBoundary(DashboardStatistics);
