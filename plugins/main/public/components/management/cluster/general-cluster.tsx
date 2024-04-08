import React, { useState, useEffect } from 'react';
import { compose } from 'redux';
import { withErrorBoundary } from '../../common/hocs';
import { IntlProvider } from 'react-intl';
import { DashboardContainerInput } from '../../../../../../src/plugins/dashboard/public';
import { SearchResponse } from '../../../../../../src/core/server';
import { IndexPattern } from '../../../../../../src/plugins/data/common';
import { getPlugins } from '../../../kibana-services';
import useSearchBar from '../../common/search-bar/use-search-bar';
import { search } from '../../common/search-bar/search-bar-service';
import { AppState, ErrorHandler, WzRequest } from '../../../react-services';
import { WzEmptyPromptNoPermissions } from '../../common/permissions/prompt';
import { ClusterDisabled } from './cluster-disabled';
import { EuiProgress, EuiPage } from '@elastic/eui';
import {
  ErrorFactory,
  HttpError,
} from '../../../react-services/error-management';
import { Cluster } from './dashboard/cluster';
import { OverviewCluster } from './overview-cluster/overview-cluster';
import { NodeList } from './node-list';

const GeneralClusterComponent = () => {
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [showNodes, setShowNodes] = useState<boolean>(false);
  const DashboardByRenderer =
    getPlugins().dashboard.DashboardContainerByValueRenderer;
  const clusterEnabled =
    AppState.getClusterInfo() && AppState.getClusterInfo().status === 'enabled';
  const [authorized, setAuthorized] = useState<boolean>(true);
  const [isClusterRunning, setIsClusterRunning] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [nodesCount, setNodesCount] = useState<number>(0);
  const [queryTimelionNodesNames, setQueryTimelionNodesNames] =
    useState<string>('');
  const [queryTimelionCluster, setQueryTimelionCluster] = useState<string>('');
  const [configuration, setConfiguration] = useState<object>({});
  const [version, setVersion] = useState<string>('');
  const [agentsCount, setAgentsCount] = useState<number>(0);

  const SearchBar = getPlugins().data.ui.SearchBar;
  const { searchBarProps } = useSearchBar({
    defaultIndexPatternID: AppState.getCurrentPattern(),
    onMount: () => {}, // TODO: use data source
    onUpdate: () => {}, // TODO: use data source
    onUnMount: () => {}, // TODO: use data source
  });

  // Checks if the cluster is running, enabled and the user has permissions.
  useEffect(() => {
    async function clusterStatus() {
      try {
        const status = await WzRequest.apiReq('GET', '/cluster/status', {});
        if (status?.data?.data?.running === 'no') {
          setIsClusterRunning(false);
          setLoading(false);
        }
      } catch (error) {
        if (error === '3013 - Permission denied: Resource type: *:*') {
          setAuthorized(false);
          setLoading(false);
        }
      }
    }
    clusterStatus();
  }, []);

  useEffect(() => {
    async function getData() {
      const data = await Promise.all([
        WzRequest.apiReq('GET', '/cluster/nodes', {}),
        WzRequest.apiReq('GET', '/cluster/local/config', {}),
        WzRequest.apiReq('GET', '/', {}),
        WzRequest.apiReq('GET', '/agents', { limit: 1 }),
        WzRequest.apiReq('GET', '/cluster/healthcheck', {}),
      ]);

      const nodeList = data[0]?.data?.data || {};
      const clusterConfig = data[1]?.data?.data || {};
      const api_version = data[2]?.data?.data?.api_version || '';
      const agents = data[3]?.data?.data || {};

      const nodesNamesList = nodeList?.affected_items?.map(node => node.name);

      const clusterName = AppState.getClusterInfo().cluster;
      const indexPattern = AppState.getCurrentPattern();

      let queryTimelion = '';
      for (const nodeName of nodesNamesList) {
        queryTimelion += `.es(index=${indexPattern},q="cluster.name: ${clusterName} AND cluster.node: ${nodeName}").label("${nodeName}"),`;
      }
      queryTimelion = queryTimelion.substring(0, queryTimelion.length - 1);

      const queryTimelionClusterManager = `.es(index=${indexPattern},q="cluster.name: ${clusterName}").label("${clusterName} cluster")`;
      setQueryTimelionCluster(queryTimelionClusterManager);
      setQueryTimelionNodesNames(queryTimelion);
      setNodesCount(nodeList?.total_affected_items);
      setConfiguration(clusterConfig?.affected_items?.[0]);
      setVersion(api_version);
      setAgentsCount(agents?.total_affected_items - 1);

      setLoading(false);
    }

    getData();
  }, []);

  /* This function is responsible for updating the storage filters so that the
  filters between dashboard and inventory added using visualizations call to actions.
  Without this feature, filters added using visualizations call to actions are
  not maintained between dashboard and inventory tabs */
  const handleFilterByVisualization = (newInput: DashboardContainerInput) => {
    return; // TODO: adapt to the data source
    updateFiltersStorage(newInput.filters);
  };

  // TODO: add the hidden filters: allowed agents and hideManagerAlerts
  const fetchFilters = searchBarProps.filters;

  const { isLoading, query, indexPatterns } = searchBarProps;

  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);

  useEffect(() => {
    if (!isLoading) {
      search({
        indexPattern: indexPatterns?.[0] as IndexPattern,
        filters: fetchFilters,
        query,
      })
        .then(results => {
          setResults(results);
          setIsSearching(false);
        })
        .catch(error => {
          const searchError = ErrorFactory.create(HttpError, {
            error,
            message: 'Error fetching alerts',
          });
          ErrorHandler.handleError(searchError);
          setIsSearching(false);
        });
    }
  }, [JSON.stringify(searchBarProps), JSON.stringify(fetchFilters)]);

  return (
    <>
      <IntlProvider locale='en'>
        <EuiPage direction='column'>
          {loading && <EuiProgress size='xs' color='primary' />}
          {(!clusterEnabled || !isClusterRunning) && (
            <ClusterDisabled
              enabled={clusterEnabled}
              running={isClusterRunning}
            />
          )}
          {!authorized && (
            <WzEmptyPromptNoPermissions
              permissions={[{ action: 'cluster:status', resource: '*:*:*' }]}
            />
          )}
          {authorized && clusterEnabled && isClusterRunning && (
            <>
              <div className='monitoring-discover'>
                <SearchBar
                  appName='cluster'
                  {...searchBarProps}
                  showDatePicker={true}
                  showQueryInput={true}
                  showQueryBar={true}
                />
              </div>
              {!showConfig && !showNodes && (
                <Cluster
                  setShowConfig={setShowConfig}
                  setShowNodes={setShowNodes}
                  isClusterRunning={isClusterRunning}
                  searchBarProps={searchBarProps}
                  DashboardByRenderer={DashboardByRenderer}
                  configuration={configuration}
                  version={version}
                  handleFilterByVisualization={handleFilterByVisualization}
                  nodesCount={nodesCount}
                  agentsCount={agentsCount}
                  isLoading={isLoading}
                  isSearching={isSearching}
                  results={results}
                  queryTimelionNodesNames={queryTimelionNodesNames}
                  queryTimelionCluster={queryTimelionCluster}
                />
              )}
              {showConfig && (
                <OverviewCluster
                  setShowConfig={setShowConfig}
                  DashboardByRenderer={DashboardByRenderer}
                  searchBarProps={searchBarProps}
                  handleFilterByVisualization={handleFilterByVisualization}
                  configuration={configuration}
                />
              )}
              {showNodes && <NodeList goBack={() => setShowNodes(false)} />}
            </>
          )}
        </EuiPage>
      </IntlProvider>
    </>
  );
};

export const GeneralCluster = compose(withErrorBoundary)(
  GeneralClusterComponent,
);
