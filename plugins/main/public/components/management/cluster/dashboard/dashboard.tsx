import React, { useState, useEffect } from 'react';
import { getCore, getPlugins } from '../../../../kibana-services';
import { SearchResponse } from '../../../../../../../src/core/server';
import { IndexPattern } from '../../../../../../../src/plugins/data/common';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import { WAZUH_ALERTS_PATTERN } from '../../../../../common/constants';
import { search } from '../../../common/search-bar/search-bar-service';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../react-services/error-management';
import { LoadingSpinner } from '../../../overview/vulnerabilities/common/components/loading_spinner';
import { withErrorBoundary } from '../../../common/hocs/error-boundary/with-error-boundary';
import { EuiSpacer, EuiFlexItem } from '@elastic/eui';

import { OverviewCards } from '../components/overview_cards';
import { endpointSummary } from '../../../../utils/applications';
import { WzRequest } from '../../../../react-services';
import { ConfigurationCards } from '../components/configuration_cards';
import { NodeList } from '../node-list';

const SearchBar = getPlugins().data.ui.SearchBar;

interface DashboardCTProps {
  statusRunning: string;
}

interface ClusterDashboardState {
  showConfig: boolean;
  showNodes: boolean;
  nodeList: any;
  configuration: any;
  version: any;
  nodesCount: number;
  agentsCount: number;
}

const DashboardCT: React.FC<DashboardCTProps> = ({ statusRunning }) => {
  /* TODO: Analyze whether to use the new index pattern handler https://github.com/wazuh/wazuh-dashboard-plugins/issues/6434
  Replace WAZUH_ALERTS_PATTERN with appState.getCurrentPattern... */
  const CT_INDEX_PATTERN_ID = WAZUH_ALERTS_PATTERN;

  const { searchBarProps } = useSearchBar({
    defaultIndexPatternID: CT_INDEX_PATTERN_ID,
  });

  const { isLoading, query, indexPatterns } = searchBarProps;
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [state, setState] = useState<ClusterDashboardState>({
    showConfig: false,
    showNodes: false,
    nodeList: [],
    configuration: undefined,
    version: undefined,
    nodesCount: 0,
    agentsCount: 0,
  });

  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);

  const setBooleans = (component: string | null) => {
    setState({
      ...state,
      showConfig: component === 'showConfig',
      showNodes: component === 'showNodes',
    });
  };

  const goAgents = () => {
    getCore().application.navigateToApp(endpointSummary.id, {
      path: '#/agents-preview',
    });
  };

  const goBack = () => {
    setBooleans(null);
  };

  const goNodes = () => {
    setBooleans('showNodes');
  };

  const goConfiguration = () => {
    setBooleans('showConfig');
  };

  useEffect(() => {
    if (!isLoading) {
      search({
        indexPattern: indexPatterns?.[0] as IndexPattern,
        filters: searchBarProps.filters ?? [],
        query,
        dateRange: {
          from: searchBarProps.dateRangeFrom,
          to: searchBarProps.dateRangeTo,
        },
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

  useEffect(() => {
    const getData = async () => {
      const data = await Promise.all([
        WzRequest.apiReq('GET', '/cluster/nodes', {}),
        WzRequest.apiReq('GET', '/cluster/local/config', {}),
        WzRequest.apiReq('GET', '/', {}),
        WzRequest.apiReq('GET', '/agents', { limit: 1 }),
        WzRequest.apiReq('GET', '/cluster/healthcheck', {}),
      ]);

      const nodeList = ((data[0] || {}).data || {}).data || {} || false;
      const clusterConfig = ((data[1] || {}).data || {}).data || {} || false;
      const agents = ((data[3] || {}).data || {}).data || {} || false;
      setState({
        ...state,
        configuration: clusterConfig.affected_items[0],
        version: (((data[2] || {}).data || {}).data || {}).api_version || false,
        nodesCount: nodeList.total_affected_items,
        agentsCount: agents.total_affected_items - 1,
        nodeList: nodeList?.affected_items ?? [],
      });
    };

    getData();
  }, []);

  return (
    <I18nProvider>
      <EuiFlexItem style={{ padding: '0 16px' }}>
        {isLoading ? <LoadingSpinner /> : null}
        {!isLoading && !state.showNodes ? (
          <SearchBar
            appName='ct-searchbar'
            {...searchBarProps}
            showDatePicker={true}
            showQueryInput={true}
            showQueryBar={true}
          />
        ) : null}
        {isSearching ? <LoadingSpinner /> : null}
        <EuiSpacer size='m' />
        {!isLoading && !isSearching && !state.showConfig && !state.showNodes ? (
          <OverviewCards
            goNodes={goNodes}
            goAgents={goAgents}
            goConfiguration={goConfiguration}
            status={statusRunning}
            configuration={state?.configuration}
            version={state?.version}
            nodesCount={state?.nodesCount}
            nodeList={state?.nodeList}
            clusterName={state.configuration?.name}
            agentsCount={state?.agentsCount}
            searchBarProps={searchBarProps}
            results={results}
            indexPatternId={CT_INDEX_PATTERN_ID}
          />
        ) : null}
        {state.showConfig ? (
          <ConfigurationCards
            goBack={goBack}
            configuration={state?.configuration}
            searchBarProps={searchBarProps}
            results={results}
            indexPatternId={CT_INDEX_PATTERN_ID}
          />
        ) : null}
        {state.showNodes ? <NodeList goBack={goBack} /> : null}
      </EuiFlexItem>
    </I18nProvider>
  );
};

export const ClusterDashboard = withErrorBoundary(DashboardCT);
