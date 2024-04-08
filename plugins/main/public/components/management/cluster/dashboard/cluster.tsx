import React from 'react';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { SearchResponse } from '../../../../../../../src/core/server';
import { getCore } from '../../../../kibana-services';
import { AppState } from '../../../../react-services';
import { compose } from 'redux';

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiPanel,
  EuiButtonEmpty,
  EuiSpacer,
  EuiToolTip,
  EuiCallOut,
} from '@elastic/eui';
import { endpointSummary } from '../../../../utils/applications';
import { withErrorBoundary } from '../../../common/hocs';
import { getDashboardPanels } from '../visualizations/visualization-panels';
import { ConfigurationsInfo } from '../common/configurations-info';

interface ClusterComponentProps {
  setShowNodes: Function;
  setShowConfig: Function;
  isClusterRunning: boolean;
  searchBarProps: any;
  DashboardByRenderer: any;
  configuration: object;
  version: string;
  handleFilterByVisualization: Function;
  nodesCount: number;
  agentsCount: number;
  isLoading: boolean;
  isSearching: boolean;
  results: SearchResponse;
  queryTimelionNodesNames: string;
  queryTimelionCluster: string;
}

const ClusterComponent: React.FC<ClusterComponentProps> = props => {
  const {
    setShowNodes,
    setShowConfig,
    isClusterRunning,
    searchBarProps,
    DashboardByRenderer,
    configuration,
    version,
    handleFilterByVisualization,
    nodesCount,
    agentsCount,
    isLoading,
    isSearching,
    results,
    queryTimelionNodesNames,
    queryTimelionCluster,
  } = props;

  const goConfiguration = () => {
    setShowConfig(true);
  };

  const goNodes = () => {
    setShowNodes(true);
  };

  const goAgents = () => {
    getCore().application.navigateToApp(endpointSummary.id, {
      path: '#/agents-preview',
    });
  };

  return (
    <>
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
            <ConfigurationsInfo
              keyValue='IP address'
              value={configuration?.nodes?.[0] || '-'}
            />
            <ConfigurationsInfo
              keyValue='Running'
              value={isClusterRunning ? 'yes' : 'no'}
            />
            <ConfigurationsInfo keyValue='Version' value={version || '-'} />
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
                <EuiButtonEmpty onClick={goNodes}>{nodesCount}</EuiButtonEmpty>
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
      {!isLoading && !isSearching && results?.hits?.total === 0 ? (
        <EuiCallOut
          title='There are no results for selected time range. Try another one.'
          color='warning'
          iconType='help'
        ></EuiCallOut>
      ) : null}

      {!isLoading && !isSearching && results?.hits?.total > 0 && (
        <div className='cluster-visualizations'>
          <DashboardByRenderer
            input={{
              viewMode: ViewMode.VIEW,
              panels: getDashboardPanels(
                AppState.getCurrentPattern(),
                queryTimelionNodesNames,
                queryTimelionCluster,
              ),
              isFullScreenMode: false,
              filters: searchBarProps.filters ?? [],
              useMargins: true,
              id: 'cluster-tab',
              timeRange: {
                from: searchBarProps.dateRangeFrom,
                to: searchBarProps.dateRangeTo,
              },
              title: 'Cluster',
              description: 'Cluster',
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
      )}
    </>
  );
};

export const Cluster = compose(withErrorBoundary)(ClusterComponent);
