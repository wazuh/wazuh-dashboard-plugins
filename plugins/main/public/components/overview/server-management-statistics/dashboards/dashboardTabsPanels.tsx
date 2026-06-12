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
  EuiButtonGroup,
} from '@elastic/eui';
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
import { DashboardNormalizationPanel } from './dashboard_normalization_panel';
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
  const [selectedSubTab, setSelectedSubTab] = useState<string>('global');

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

  const selectedNodeFilter =
    clusterNodeSelected !== 'all'
      ? {
          meta: {
            removable: false,
            index: dataSource?.id,
            negate: false,
            disabled: false,
            alias: null,
            type: 'phrase',
            key: null,
            value: null,
            params: { query: null, type: 'phrase' },
          },
          query: {
            match: {
              'wazuh.cluster.node': clusterNodeSelected,
            },
          },
          $state: { store: 'appState' },
        }
      : null;

  const combinedFilters = selectedNodeFilter
    ? [...fetchFilters, selectedNodeFilter]
    : [...fetchFilters];

  return (
    <>
      {isDataSourceLoading && !dataSource ? (
        <LoadingSearchbarProgress />
      ) : (
        <EuiFlexGroup
          alignItems='center'
          justifyContent='spaceBetween'
          // WORKAROUND: This style aligns the search bar with the EuiCallOuts. The components should not include wrappers with margin/padding and this should be set by the layout instead
          style={{ margin: 0 }}
        >
          <EuiFlexItem grow={false}>
            {selectedTab === 'normalization' && (
              <EuiButtonGroup
                buttonSize='s'
                isFullWidth={false}
                color='primary'
                legend='Normalization view'
                options={[
                  { id: 'global', label: 'Global' },
                  { id: 'per-space-metrics', label: 'Per-Space' },
                ]}
                idSelected={selectedSubTab}
                onChange={id => setSelectedSubTab(id)}
              />
            )}
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup alignItems='center'>
              {!!(
                clusterNodes &&
                clusterNodes.length &&
                clusterNodeSelected
              ) && (
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
          </EuiFlexItem>
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
            <DashboardListenerEngineStatistics
              indexPatternId={dataSource?.id}
              searchBarProps={searchBarProps}
              lastReloadRequestTime={fingerprint}
              filters={combinedFilters}
            />
          )}
          {selectedTab === 'normalization' && !loadingNode && (
            <DashboardNormalizationPanel
              indexPattern={dataSource?.indexPattern as IndexPattern}
              searchBarProps={searchBarProps}
              lastReloadRequestTime={fingerprint}
              filters={combinedFilters}
              dataSourceId={dataSource?.id}
              selectedSubTab={selectedSubTab}
            />
          )}
        </>
      ) : null}
      {error && <PromptErrorInitializatingDataSource error={error} />}
    </>
  );
};
