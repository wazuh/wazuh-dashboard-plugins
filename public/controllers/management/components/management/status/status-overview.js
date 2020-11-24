/*
 * Wazuh app - React component for building the status view
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import {
  EuiFlexItem,
  EuiFlexGroup,
  EuiPanel,
  EuiTitle,
  EuiProgress,
  EuiPage,
  EuiSpacer,
  EuiFlexGrid,
  EuiButton
} from '@elastic/eui';

import { connect } from 'react-redux';
import {
  updateLoadingStatus,
  updateListNodes,
  updateSelectedNode,
  updateListDaemons,
  updateStats,
  updateNodeInfo,
  updateAgentInfo,
  updateClusterEnabled,
  cleanInfo
} from '../../../../../redux/actions/statusActions';
import StatusHandler from './utils/status-handler';

// Wazuh components
import WzStatusActionButtons from './actions-buttons-main';
import WzStatusDaemons from './status-daemons';
import WzStatusStats from './status-stats';
import WzStatusNodeInfo from './status-node-info';
import WzStatusAgentInfo from './status-agent-info';

import { toastNotifications } from 'ui/notify';

import { withUserAuthorizationPrompt, withGlobalBreadcrumb } from '../../../../../components/common/hocs';
import { compose } from 'redux';
import { ToastNotifications } from '../../../../../react-services/toast-notifications';

export class WzStatusOverview extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);

    this.statusHandler = StatusHandler;

    this.state = {
      isLoading: false
    };
  }

  componentDidMount() {
    this._isMounted = true;
    this.fetchData();
  }

  componentDidUpdate() { }

  componentWillUnmount() {
    this._isMounted = false;
    this.props.cleanInfo();
  }

  objToArr(obj) {
    const arr = [];
    for (const key in obj) arr.push({ key, value: obj[key] });
    return arr;
  }

  /**
   * Fetchs all required data
   */
  async fetchData() {
    try {
      this.props.updateLoadingStatus(true);

      const agSumm = await this.statusHandler.agentsSummary();
      const clusStat = await this.statusHandler.clusterStatus();
      const manInfo = await this.statusHandler.managerInfo();
      const agentsCountResponse = await this.statusHandler.clusterAgentsCount();

      const data = [];
      data.push(agSumm);
      data.push(clusStat);
      data.push(manInfo);
      data.push(agentsCountResponse);

      const parsedData = data.map(
        item => ((item || {}).data || {}).data || false
      );
      const [stats, clusterStatus, managerInfo, agentsCount] = parsedData;

      // Once Wazuh core fixes agent 000 issues, this should be adjusted
      const active = stats.active;
      const total = stats.total;

      this.props.updateStats({
        agentsCount: agentsCount.nodes,
        agentsCountActive: active,
        agentsCountDisconnected: stats.disconnected,
        agentsCountNeverConnected: stats.never_connected,
        agentsCountTotal: total,
        agentsCoverity: total ? (active / total) * 100 : 0
      });

      this.props.updateClusterEnabled(
        clusterStatus && clusterStatus.enabled === 'yes'
      );

      if (
        clusterStatus &&
        clusterStatus.enabled === 'yes' &&
        clusterStatus.running === 'yes'
      ) {
        const nodes = await this.statusHandler.clusterNodes();
        const listNodes = nodes.data.data.affected_items;
        this.props.updateListNodes(listNodes);
        const masterNode = nodes.data.data.affected_items.filter(item => item.type === 'master')[0];
        this.props.updateSelectedNode(masterNode.name);
        const daemons = await this.statusHandler.clusterNodeStatus(masterNode.name);
        const listDaemons = this.objToArr(daemons.data.data.affected_items[0]);
        this.props.updateListDaemons(listDaemons);
        const nodeInfo = await this.statusHandler.clusterNodeInfo(masterNode.name);
        this.props.updateNodeInfo(nodeInfo.data.data.affected_items[0]);
      } else {
        if (
          clusterStatus &&
          clusterStatus.enabled === 'yes' &&
          clusterStatus.running === 'no'
        ) {
          this.showToast(
            'danger',
            `Cluster is enabled but it's not running, please check your cluster health.`,
            3000
          );
        } else {
          const daemons = await this.statusHandler.managerStatus();
          const listDaemons = this.objToArr(daemons.data.data.affected_items[0]);
          this.props.updateListDaemons(listDaemons);
          this.props.updateSelectedNode(false);
          this.props.updateNodeInfo((managerInfo.affected_items || [])[0] || {});
        }
      }
      const lastAgentRaw = await this.statusHandler.lastAgentRaw();
      const [lastAgent] = lastAgentRaw.data.data.affected_items;

      this.props.updateAgentInfo(lastAgent);
    } catch (error) {
      ToastNotifications.error('management:status:overview.fetchData', error);
    }
    this.props.updateLoadingStatus(false);
  }

  showToast = (color, text, time) => {
    toastNotifications.add({
      color: color,
      title: text,
      toastLifeTimeMs: time
    });
  };

  render() {
    const {
      isLoading,
      listDaemons,
      stats,
      nodeInfo,
      agentInfo
    } = this.props.state;

    return (
      <EuiPage style={{ background: 'transparent' }}>
        <EuiPanel>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiTitle>
                    <h2>Status</h2>
                  </EuiTitle>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
            <WzStatusActionButtons />
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              {isLoading && <EuiProgress size="xs" color="primary" />}
              {!isLoading && listDaemons && <WzStatusDaemons />}
              <EuiSpacer size="l" />
              {!isLoading && stats && <WzStatusStats />}
              <EuiSpacer size="l" />
              {!isLoading && (
                <EuiFlexGrid columns={2}>
                  {nodeInfo && (
                    <EuiFlexItem>
                      <WzStatusNodeInfo />
                    </EuiFlexItem>
                  )}
                  {agentInfo && (
                    <EuiFlexItem>
                      <WzStatusAgentInfo />
                    </EuiFlexItem>
                  )}
                </EuiFlexGrid>
              )}
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </EuiPage>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.statusReducers
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateLoadingStatus: status => dispatch(updateLoadingStatus(status)),
    updateListNodes: listNodes => dispatch(updateListNodes(listNodes)),
    updateSelectedNode: selectedNode =>
      dispatch(updateSelectedNode(selectedNode)),
    updateListDaemons: listDaemons => dispatch(updateListDaemons(listDaemons)),
    updateStats: stats => dispatch(updateStats(stats)),
    updateNodeInfo: nodeInfo => dispatch(updateNodeInfo(nodeInfo)),
    updateAgentInfo: agentInfo => dispatch(updateAgentInfo(agentInfo)),
    updateClusterEnabled: clusterEnabled =>
      dispatch(updateClusterEnabled(clusterEnabled)),
    cleanInfo: () => dispatch(cleanInfo())
  };
};

export default compose(
  withGlobalBreadcrumb([
    { text: '' },
    { text: 'Management', href: '/app/wazuh#/manager' },
    { text: 'Status' }
  ]),
  withUserAuthorizationPrompt([{ action: 'agent:read', resource: 'agent:id:*' }, { action: 'manager:read', resource: '*:*:*' }, { action: 'cluster:read', resource: 'node:id:*' }]),
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(WzStatusOverview);
