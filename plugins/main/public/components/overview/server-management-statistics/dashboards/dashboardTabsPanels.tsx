import React, { useEffect, useState } from 'react';
import { getPlugins } from '../../../../kibana-services';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import {
  EuiFlexItem,
  EuiFlexGroup,
  EuiSelect,
  EuiSpacer,
  EuiCallOut,
  EuiPanel,
} from '@elastic/eui';
import {
  PatternDataSource,
  tFilter,
  tParsedIndexPattern,
  useDataSource,
} from '../../../common/data-source';
import { IndexPattern } from '../../../../../../../src/plugins/data/public';
import { SearchResponse } from '../../../../../../../src/core/server';
import {
  StatisticsDataSource,
  StatisticsDataSourceRepository,
} from '../../../common/data-source/pattern/statistics';
import { LoadingSearchbarProgress } from '../../../common/loading-searchbar-progress/loading-searchbar-progress';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../react-services/error-management';
import { DiscoverNoResults } from '../../../common/no-results/no-results';
import { DashboardAnalysisEngineStatistics } from './dashboard_analysis_engine';
import { DashboardListenerEngineStatistics } from './dashboard_listener_engine';

const SearchBar = getPlugins().data.ui.SearchBar;

interface DashboardTabsPanelsProps {
  selectedTab: string;
  loadingNode: boolean;
  isClusterMode: boolean;
  clusterNodes: any[];
  clusterNodeSelected: any;
  onSelectNode: (event: any) => void;
}

export const DashboardTabsPanels = ({
  selectedTab,
  loadingNode,
  isClusterMode,
  clusterNodes,
  clusterNodeSelected,
  onSelectNode,
}: DashboardTabsPanelsProps) => {
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

  const infoMessage = {
    remoted:
      'Remoted statistics are cumulative, this means that the information shown is since the data exists.',
    analysisd:
      "Analysisd statistics refer to the data stored from the period indicated in the variable 'analysisd.state_interval'.",
  };

  const { searchBarProps } = useSearchBar({
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters,
    setFilters,
  });

  const { query, absoluteDateRange } = searchBarProps;

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

  const selectedNodeFilter: tFilter = {
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
  return (
    <>
      {isDataSourceLoading && !dataSource ? (
        <LoadingSearchbarProgress />
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
            appName='statistics-searchbar'
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
        <EuiCallOut title={infoMessage[selectedTab]} iconType='iInCircle' />
      </EuiPanel>
      {dataSource && results?.hits?.total === 0 ? <DiscoverNoResults /> : null}
      {!isDataSourceLoading && dataSource && results?.hits?.total > 0 ? (
        <>
          {selectedTab === 'remoted' && !loadingNode && (
            <div>
              <DashboardListenerEngineStatistics
                indexPatternId={dataSource?.id}
                searchBarProps={searchBarProps}
                filters={
                  clusterNodeSelected !== 'all'
                    ? [...fetchFilters, selectedNodeFilter]
                    : [...(fetchFilters ?? [])]
                }
              />
            </div>
          )}
          {selectedTab === 'analysisd' && !loadingNode && (
            <DashboardAnalysisEngineStatistics
              isClusterMode={isClusterMode}
              indexPatternId={dataSource?.id}
              searchBarProps={searchBarProps}
              filters={
                clusterNodeSelected !== 'all'
                  ? [...fetchFilters, selectedNodeFilter]
                  : [...(fetchFilters ?? [])]
              }
            />
          )}
        </>
      ) : null}
    </>
  );
};
