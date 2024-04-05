import React, { useState, useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import { ViewMode } from '../../../../../../src/plugins/embeddable/public';
import { DashboardContainerInput } from '../../../../../../src/plugins/dashboard/public';
import { getCore, getDataPlugin, getPlugins } from '../../../kibana-services';
import useSearchBar from '../../common/search-bar/use-search-bar';
import { AppState, WzRequest } from '../../../react-services';
import { WzEmptyPromptNoPermissions } from '../../common/permissions/prompt';
import { ClusterDisabled } from './cluster-disabled';
import { compose } from 'redux';

import {
  EuiProgress,
  EuiPage,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiPanel,
  EuiButtonEmpty,
  EuiSpacer,
  EuiToolTip,
} from '@elastic/eui';
import { endpointSummary } from '../../../utils/applications';
import { ClusterTimelions } from './cluster-timelions';
import { withErrorBoundary } from '../../common/hocs';
import { getDashboardPanels } from './visualizations/visualization-panels';

const ClusterComponent: React.FC = () => {
  const DashboardByRenderer =
    getPlugins().dashboard.DashboardContainerByValueRenderer;
  const clusterEnabled =
    AppState.getClusterInfo() && AppState.getClusterInfo().status === 'enabled';
  const [authorized, setAuthorized] = useState(true);
  const [isClusterRunning, setIsClusterRunning] = useState(true);
  const [loading, setLoading] = useState(true);
  const [nodesCount, setNodesCount] = useState(0);
  const [configuration, setConfiguration] = useState({});
  const [version, setVersion] = useState('');
  const [agentsCount, setAgentsCount] = useState(0);

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

      setNodesCount(nodeList?.total_affected_items);
      setConfiguration(clusterConfig?.affected_items?.[0]);
      setVersion(api_version);
      setAgentsCount(agents?.total_affected_items - 1);

      nodeList.name = configuration?.name;
      nodeList.master_node = configuration?.node_name;

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

  const goConfiguration = () => {
    return console.log('first');
  };

  const goNodes = () => {
    return console.log('second');
  };

  const goAgents = () => {
    getCore().application.navigateToApp(endpointSummary.id, {
      path: '#/agents-preview',
    });
  };

  return (
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
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiPanel>
                  <EuiTitle size='s'>
                    <div
                      className='wz-flex'
                      style={{
                        justifyContent: 'left',
                        alignItems: 'center',
                      }}
                    >
                      <h1>Details</h1>
                      <EuiButtonEmpty size='xs' onClick={goConfiguration}>
                        <i className='fa fa-fw fa-pie-chart'></i>
                        View Overview
                      </EuiButtonEmpty>
                    </div>
                  </EuiTitle>
                  <EuiSpacer size='m' />
                  <div className='wz-padding-top-10 wz-flex'>
                    <span style={{ width: '25%' }}>IP address</span>
                    <span className='color-grey'>
                      {configuration?.nodes?.[0] || '-'}
                    </span>
                  </div>
                  <div className='wz-padding-top-10 wz-flex'>
                    <span style={{ width: '25%' }}>Running</span>
                    <span className='color-grey'>
                      {isClusterRunning ? 'yes' : 'no'}
                    </span>
                  </div>
                  <div className='wz-padding-top-10 wz-flex'>
                    <span style={{ width: '25%' }}>Version</span>
                    <span className='color-grey'> {version} </span>
                  </div>
                </EuiPanel>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiPanel>
                  <EuiTitle size='s'>
                    <h1>Information</h1>
                  </EuiTitle>
                  <div className='wz-padding-top-10 wz-flex'>
                    <EuiToolTip
                      position='left'
                      content='Click to open the list of nodes'
                    >
                      <EuiButtonEmpty onClick={goNodes}>Nodes</EuiButtonEmpty>
                    </EuiToolTip>
                    <EuiToolTip
                      position='right'
                      content='Click to open the list of nodes'
                    >
                      <EuiButtonEmpty onClick={goNodes}>
                        {nodesCount}
                      </EuiButtonEmpty>
                    </EuiToolTip>
                  </div>
                  <div className='wz-padding-top-10 wz-flex'>
                    <EuiToolTip
                      position='left'
                      content='Click to open the list of agents'
                    >
                      <EuiButtonEmpty onClick={goAgents}>Agents</EuiButtonEmpty>
                    </EuiToolTip>
                    <EuiToolTip
                      position='right'
                      content='Click to open the list of agents'
                    >
                      <EuiButtonEmpty onClick={goAgents}>
                        {agentsCount}
                      </EuiButtonEmpty>
                    </EuiToolTip>
                  </div>
                </EuiPanel>
              </EuiFlexItem>
            </EuiFlexGroup>
            <div className='aws-dashboard-responsive'>
              <DashboardByRenderer
                input={{
                  viewMode: ViewMode.VIEW,
                  panels: getDashboardPanels(AppState.getCurrentPattern()),
                  isFullScreenMode: false,
                  filters: searchBarProps.filters ?? [],
                  useMargins: true,
                  id: 'aws-dashboard-tab',
                  timeRange: {
                    from: searchBarProps.dateRangeFrom,
                    to: searchBarProps.dateRangeTo,
                  },
                  title: 'AWS dashboard',
                  description: 'Dashboard of the AWS',
                  query: searchBarProps.query,
                  refreshConfig: {
                    pause: false,
                    value: 15,
                  },
                  hidePanelTitles: false,
                }}
                onInputUpdated={handleFilterByVisualization}
              />
            </div>
            {/* <ClusterTimelions /> */}
          </>
        )}
      </EuiPage>
    </IntlProvider>
  );
};

export const Cluster = compose(withErrorBoundary)(ClusterComponent);
