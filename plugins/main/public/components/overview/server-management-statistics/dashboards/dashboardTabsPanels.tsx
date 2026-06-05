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
import {
  MetricsNormalizationDataSource,
  MetricsNormalizationDataSourceRepository,
} from '../../../common/data-source/pattern/metrics-normalization';
import { LoadingSearchbarProgress } from '../../../common/loading-searchbar-progress/loading-searchbar-progress';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../react-services/error-management';
import { DiscoverNoResults } from '../../../common/no-results/no-results';
// TODO: DashboardAnalysisEngineStatistics is commented out until analysisd metrics have a new data stream
// import { DashboardAnalysisEngineStatistics } from './dashboard_analysis_engine';
import { DashboardListenerEngineStatistics } from './dashboard_listener_engine';
import { DashboardNormalizationStatistics } from './dashboard_engine_health';
import { SampleDataWarning } from '../../../visualize/components';
import {
  WAZUH_SAMPLE_METRICS_COMMS,
  WAZUH_SAMPLE_METRICS_NORMALIZATION,
} from '../../../../../common/constants';
import { PromptErrorInitializatingDataSource } from '../../../common/hocs';

const SearchBar = getPlugins().data.ui.SearchBar;

interface DashboardTabsPanelsProps {
  selectedTab: string;
  loadingNode: boolean;
  clusterNodes: any[];
  clusterNodeSelected: any;
  onSelectNode: (event: any) => void;
}

export const DashboardTabsPanels = ({
  selectedTab,
  loadingNode,
  clusterNodes,
  clusterNodeSelected,
  onSelectNode,
}: DashboardTabsPanelsProps) => {
  const remotedDataSource = useDataSource<
    tParsedIndexPattern,
    PatternDataSource
  >({
    DataSource: StatisticsDataSource,
    repository: new StatisticsDataSourceRepository(),
  });

  const NormalizationDataSource = useDataSource<
    tParsedIndexPattern,
    PatternDataSource
  >({
    DataSource: MetricsNormalizationDataSource,
    repository: new MetricsNormalizationDataSourceRepository(),
  });

  const statisticsDataSource =
    selectedTab === 'normalization'
      ? NormalizationDataSource
      : remotedDataSource;

  const {
    filters,
    fetchFilters,
    dataSource,
    fetchData,
    setFilters,
    isLoading: isDataSourceLoading,
    error,
  } = statisticsDataSource;

  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);

  const infoMessage: Record<string, string> = {
    remoted:
      'Statistics are cumulative, this means that the information shown is since the data exists.',
    // TODO: analysisd tab is commented out until analysisd metrics have a new data stream
    // analysisd:
    //   "Analysisd statistics refer to the data stored from the period indicated in the variable 'analysisd.state_interval'.",
  };

  const { searchBarProps, fingerprint, autoRefreshFingerprint } = useSearchBar({
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
          message: 'Error fetching data',
        });
        ErrorHandler.handleError(searchError);
      });
  }, [
    selectedTab,
    dataSource?.id,
    isDataSourceLoading,
    JSON.stringify(fetchFilters),
    JSON.stringify(query),
    dateRangeFrom,
    dateRangeTo,
    fingerprint,
    autoRefreshFingerprint,
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
        'wazuh.cluster.node': clusterNodeSelected,
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
        <EuiFlexGroup
          alignItems='center'
          justifyContent='flexEnd'
          // WORKAROUND: This style aligns the search bar with the EuiCallOuts. The components should not include wrappers with margin/padding and this should be set by the layout instead
          style={{ margin: 0 }}
        >
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
      <div
        // WORKAROUND: This style mitigates the include styles in the DiscoverNoResults component to align with the SampleDataWarning component and the EuiCallOut with information about the tab. The components should not include wrappers with margin/padding and this should be set by the layout instead
        style={{ margin: '0 8px 16px 8px' }}
      >
        {infoMessage[selectedTab] && (
          <EuiCallOut title={infoMessage[selectedTab]} iconType='iInCircle' />
        )}
      </div>

      {dataSource && results?.hits?.total === 0 ? (
        <div
          // WORKAROUND: This style mitigates the include styles in the DiscoverNoResults component to align with the SampleDataWarning component and the EuiCallOut with information about the tab. The components should not include wrappers with margin/padding and this should be set by the layout instead
          style={{ margin: '-8px' }}
        >
          <DiscoverNoResults />
        </div>
      ) : null}
      {!isDataSourceLoading && dataSource && results?.hits?.total > 0 ? (
        <>
          <SampleDataWarning
            categoriesSampleData={
              selectedTab === 'normalization'
                ? [WAZUH_SAMPLE_METRICS_NORMALIZATION]
                : [WAZUH_SAMPLE_METRICS_COMMS]
            }
          />
          {selectedTab === 'remoted' && !loadingNode && (
            <div>
              <DashboardListenerEngineStatistics
                indexPatternId={dataSource?.id}
                searchBarProps={searchBarProps}
                lastReloadRequestTime={fingerprint}
                filters={
                  clusterNodeSelected !== 'all'
                    ? [...fetchFilters, selectedNodeFilter]
                    : [...(fetchFilters ?? [])]
                }
              />
            </div>
          )}
          {selectedTab === 'normalization' && !loadingNode && (
            <div>
              <DashboardNormalizationStatistics
                indexPatternId={dataSource?.id}
                searchBarProps={searchBarProps}
                lastReloadRequestTime={fingerprint}
                filters={
                  clusterNodeSelected !== 'all'
                    ? [...fetchFilters, selectedNodeFilter]
                    : [...(fetchFilters ?? [])]
                }
              />
            </div>
          )}
          {/* TODO: analysisd tab is commented out until analysisd metrics have a new data stream
          {selectedTab === 'analysisd' && !loadingNode && (
            <DashboardAnalysisEngineStatistics
              indexPatternId={dataSource?.id}
              searchBarProps={searchBarProps}
              lastReloadRequestTime={fingerprint}
              filters={
                clusterNodeSelected !== 'all'
                  ? [...fetchFilters, selectedNodeFilter]
                  : [...(fetchFilters ?? [])]
              }
            />
          )}
          */}
        </>
      ) : null}
      {error && <PromptErrorInitializatingDataSource error={error} />}
    </>
  );
};
