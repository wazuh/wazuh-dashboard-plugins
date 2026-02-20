import React, { useState, useEffect } from 'react';
import { SearchResponse } from '../../../../../../../src/core/server';
import { IndexPattern } from '../../../../../../../src/plugins/data/common';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../react-services/error-management';
import { LoadingSearchbarProgress } from '../../../common/loading-searchbar-progress/loading-searchbar-progress';
import { withErrorBoundary } from '../../../common/hocs/error-boundary/with-error-boundary';
import { EuiSpacer, EuiFlexItem } from '@elastic/eui';

import { OverviewCards } from '../components/overview_cards';
import { endpointSummary } from '../../../../utils/applications';
import { WzRequest } from '../../../../react-services';
import { ConfigurationCards } from '../components/configuration_cards';
import { NodeList } from '../node-list';
import {
  ClusterDataSource,
  EventsDataSourceRepository,
  PatternDataSource,
  tParsedIndexPattern,
  useDataSource,
} from '../../../common/data-source';
import { WzSearchBar } from '../../../common/search-bar';
import NavigationService from '../../../../react-services/navigation-service';
import {
  withDataSourceInitiated,
  withDataSourceLoading,
} from '../../../common/hocs';
import { compose } from 'redux';
import { useRouterSearch } from '../../../common/hooks';

interface ClusterDashboardState {
  nodeList: any;
  configuration: any;
  version: any;
  nodesCount: number;
  agentsCount: number;
}

const DashboardCTMainView = compose(
  withDataSourceLoading({
    isLoadingNameProp: 'isDataSourceLoading',
    LoadingComponent: LoadingSearchbarProgress,
  }),
  withDataSourceInitiated({
    isLoadingNameProp: 'isDataSourceLoading',
    dataSourceNameProp: 'dataSource',
    dataSourceErrorNameProp: 'error',
  }),
)(
  ({
    goNodes,
    goAgents,
    goConfiguration,
    state,
    searchBarProps,
    results,
    dataSource,
    fetchFilters,
    fingerprint,
  }) => (
    <OverviewCards
      goNodes={goNodes}
      goAgents={goAgents}
      goConfiguration={goConfiguration}
      configuration={state?.configuration}
      version={state?.version}
      nodesCount={state?.nodesCount}
      nodeList={state?.nodeList}
      clusterName={state.configuration?.name}
      agentsCount={state?.agentsCount}
      searchBarProps={searchBarProps}
      results={results}
      indexPattern={dataSource?.indexPattern}
      filters={fetchFilters ?? []}
      lastReloadRequestTime={fingerprint}
    />
  ),
);

const DashboardCT: React.FC<DashboardCTProps> = () => {
  const navigationService = NavigationService.getInstance();
  const {
    filters,
    dataSource,
    fetchFilters,
    fixedFilters,
    isLoading: isDataSourceLoading,
    fetchData,
    setFilters,
    error,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    DataSource: ClusterDataSource,
    repository: new EventsDataSourceRepository(),
  });
  const { tabView } = useRouterSearch();
  const showNodes = tabView === 'nodes';
  const showConfig = tabView === 'config';

  const [state, setState] = useState<ClusterDashboardState>({
    nodeList: [],
    configuration: undefined,
    version: undefined,
    nodesCount: 0,
    agentsCount: 0,
  });

  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);

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
    JSON.stringify(fetchFilters),
    JSON.stringify(query),
    dateRangeFrom,
    dateRangeTo,
    fingerprint,
    autoRefreshFingerprint,
  ]);

  const switchClusterSubTab = (subTab: 'nodes' | 'config' | null) =>
    navigationService.updateAndNavigateSearchParams({
      tabView: subTab,
    });

  const goAgents = () => {
    navigationService.navigateToApp(endpointSummary.id, {
      path: '#/agents-preview',
    });
  };

  const goBack = () => {
    switchClusterSubTab(null);
  };

  const goNodes = () => {
    switchClusterSubTab('nodes');
  };

  const goConfiguration = () => {
    switchClusterSubTab('config');
  };

  useEffect(() => {
    const getData = async () => {
      const data = await Promise.all([
        WzRequest.apiReq('GET', '/cluster/nodes', {}),
        WzRequest.apiReq('GET', '/cluster/local/config', {}),
        WzRequest.apiReq('GET', '/', {}),
        WzRequest.apiReq('GET', '/agents', {
          params: { limit: 1 },
        }),
        WzRequest.apiReq('GET', '/cluster/healthcheck', {}),
      ]);

      const nodeList = data[0]?.data?.data || {} || false;
      const clusterConfig = data[1]?.data?.data || {} || false;
      const agents = data[3]?.data?.data || {} || false;
      setState(prevState => ({
        ...prevState,
        configuration: clusterConfig.affected_items[0],
        version: data[2]?.data?.data?.api_version || false,
        nodesCount: nodeList.total_affected_items,
        agentsCount: Number(agents.total_affected_items ?? 0),
        nodeList: nodeList?.affected_items ?? [],
      }));
    };

    getData();
  }, []);

  return (
    <I18nProvider>
      <EuiFlexItem style={{ padding: '0 16px' }}>
        {dataSource && !showNodes && (
          <WzSearchBar
            appName='ct-searchbar'
            {...searchBarProps}
            fixedFilters={fixedFilters}
          />
        )}
        <EuiSpacer size='m' />
        {!showConfig && !showNodes ? (
          <DashboardCTMainView
            goNodes={goNodes}
            goAgents={goAgents}
            goConfiguration={goConfiguration}
            state={state}
            searchBarProps={searchBarProps}
            results={results}
            dataSource={dataSource}
            fetchFilters={fetchFilters ?? []}
            lastReloadRequestTime={fingerprint}
            isDataSourceLoading={isDataSourceLoading}
            error={error}
          />
        ) : null}
        {showConfig ? (
          <ConfigurationCards
            goBack={goBack}
            configuration={state?.configuration}
            searchBarProps={searchBarProps}
            results={results}
            indexPatternId={dataSource?.id}
            filters={fetchFilters ?? []}
            lastReloadRequestTime={fingerprint}
          />
        ) : null}
        {showNodes ? <NodeList goBack={goBack} /> : null}
      </EuiFlexItem>
    </I18nProvider>
  );
};

export const ClusterDashboard = withErrorBoundary(DashboardCT);
