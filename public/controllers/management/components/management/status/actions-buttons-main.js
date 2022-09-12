/*
 * Wazuh app - React component of actions buttons for status.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component, Fragment } from 'react';
// Eui components
import { EuiFlexItem, EuiSelect, EuiOverlayMask, EuiConfirmModal } from '@elastic/eui';

import { connect } from 'react-redux';

import {
  updateLoadingStatus,
  updateListDaemons,
  updateNodeInfo,
  updateSelectedNode,
  updateStats,
  updateAgentInfo,
} from '../../../../../redux/actions/statusActions';

import StatusHandler from './utils/status-handler';
import { getToasts } from '../../../../../kibana-services';
import { WzButtonPermissions } from '../../../../../components/common/permissions/button';

import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';
import { RestartHandler } from '../../../../../react-services/wz-restart';
import {
  updateRestartStatus,
  updateRestartNodesInfo,
} from '../../../../../redux/actions/restartActions';
import { RestartModal } from '../../../../../components/common/restart-modal/restart-modal';
import { ENUM_RESTART_STATES } from '../../../../../react-services/interfaces/wz-restart.interface';

class WzStatusActionButtons extends Component {
  _isMounted = false;

  constructor(props) {
    super(props);

    this.refreshTimeoutId = null;
    this.statusHandler = StatusHandler;
    this.state = {
      isModalVisible: false,
      isRestarting: false,
      timeoutRestarting: false,
    };
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  /**
   * Restart cluster or manager
   */
  async restartWazuh() {
    this.setState({ isRestarting: true, timeoutRestarting: true });
    try {
      const updateRedux = {
        updateRestartStatus: this.props.updateRestartStatus,
        updateRestartNodesInfo: this.props.updateRestartNodesInfo
      };
      await RestartHandler.restartWazuh(updateRedux);
      this.setState({ isRestarting: false });
    } catch (error) {
      this.setState({ isRestarting: false });
      const options = {
        context: `${WzStatusActionButtons.name}.restartWazuh`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: `${error.name}: Error restarting Wazuh`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  objToArr(obj) {
    const arr = [];
    for (const key in obj) arr.push({ key, value: obj[key] });
    return arr;
  }

  /**
   * This change to a selected node
   * @param {String} node
   */
  changeNode = async (e) => {
    try {
      const node = e.target.value;
      this.props.updateLoadingStatus(true);
      this.props.updateSelectedNode(node);

      const [{connection: agentsCount}, agentsCountByManagerNodes] = (await Promise.all([
        this.statusHandler.agentsSummary(),
        this.statusHandler.clusterAgentsCount()
      ])).map(response => response?.data?.data);

      this.props.updateStats({
        agentsCountByManagerNodes: agentsCountByManagerNodes.nodes,
        agentsCount,
        agentsCoverage: agentsCount.total
          ? ((agentsCount.active / agentsCount.total) * 100).toFixed(2)
          : 0,
      });

      const daemons = await this.statusHandler.clusterNodeStatus(node);
      const listDaemons = this.objToArr(daemons.data.data.affected_items[0]);
      this.props.updateListDaemons(listDaemons);

      const nodeInfo = await this.statusHandler.clusterNodeInfo(node);
      this.props.updateNodeInfo(nodeInfo.data.data.affected_items[0]);

      const lastAgentRaw = await this.statusHandler.lastAgentRaw();
      const [lastAgent] = lastAgentRaw.data.data.affected_items;

      this.props.updateAgentInfo(lastAgent);

      this.props.updateLoadingStatus(false);
    } catch (error) {
      this.props.updateLoadingStatus(false);
      const options = {
        context: `${WzStatusActionButtons.name}.changeNode`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: `${error.name}: Node ${node} is down`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
    return;
  };

  onRefreshLoading() {
    clearInterval(this.refreshTimeoutId);

    this.props.updateLoadingStatus(true);
    this.refreshTimeoutId = setInterval(() => {
      if (!this.props.state.isProcessing) {
        this.props.updateLoadingStatus(false);
        clearInterval(this.refreshTimeoutId);
      }
    }, 100);
  }

  showToast = (color, text, time) => {
    getToasts().add({
      color: color,
      title: text,
      toastLifeTimeMs: time,
    });
  };

  transforToOptions = (listNodes) => {
    let options = [];
    for (const node of listNodes) {
      options.push({
        value: node.name,
        text: `${node.name} (${node.type})`,
      });
    }
    return options;
  };

  closeModal = () => {
    this.setState({ isModalVisible: false });
  };

  render() {
    const { isLoading, listNodes, selectedNode, clusterEnabled } = this.props.state;

    const { isRestarting, isModalVisible, timeoutRestarting } = this.state;

    let options = this.transforToOptions(listNodes);

    // Select node
    const selectNode = (
      <EuiSelect
        id="selectNode"
        options={options}
        value={selectedNode}
        onChange={this.changeNode}
        disabled={isLoading || isRestarting}
        aria-label="Select node"
      />
    );

    // Restart button
    const restartButton = (
      <WzButtonPermissions
        buttonType="empty"
        permissions={[
          clusterEnabled
            ? { action: 'cluster:restart', resource: 'node:id:*' }
            : { action: 'manager:restart', resource: '*:*:*' },
        ]}
        iconType="refresh"
        onClick={async () => this.setState({ isModalVisible: true })}
        isDisabled={isLoading}
        isLoading={isRestarting}
      >
        Restart {clusterEnabled ? 'cluster' : 'manager'}
      </WzButtonPermissions>
    );

    let modal;

    if (isModalVisible) {
      modal = (
        <EuiOverlayMask>
          <EuiConfirmModal
            title={clusterEnabled ? 'Cluster will be restarted' : 'Manager will be restarted'}
            onCancel={this.closeModal}
            onConfirm={() => {
              this.props.updateRestartStatus(ENUM_RESTART_STATES.RESTARTING);
              this.restartWazuh();
              this.setState({ isModalVisible: false });
            }}
            cancelButtonText="Cancel"
            confirmButtonText="Confirm"
            defaultFocusedButton="cancel"
          />
        </EuiOverlayMask>
      );
    }

    let restarting;

    if (timeoutRestarting && this.props.restartStatus !== ENUM_RESTART_STATES.RESTARTED) {
      restarting = <RestartModal />;
    }

    return (
      <Fragment>
        {selectedNode !== null && <EuiFlexItem grow={isRestarting}>{restartButton}</EuiFlexItem>}
        {selectedNode && <EuiFlexItem grow={false}>{selectNode}</EuiFlexItem>}
        {modal}
        {restarting}
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    state: state.statusReducers,
    restartStatus: state.restartWazuhReducers.restartStatus,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateLoadingStatus: (status) => dispatch(updateLoadingStatus(status)),
    updateListDaemons: (listDaemons) => dispatch(updateListDaemons(listDaemons)),
    updateNodeInfo: (nodeInfo) => dispatch(updateNodeInfo(nodeInfo)),
    updateSelectedNode: (selectedNode) => dispatch(updateSelectedNode(selectedNode)),
    updateStats: (stats) => dispatch(updateStats(stats)),
    updateAgentInfo: (agentInfo) => dispatch(updateAgentInfo(agentInfo)),
    updateRestartStatus: (restartStatus) => dispatch(updateRestartStatus(restartStatus)),
    updateRestartNodesInfo: (restartNodesInfo) =>
      dispatch(updateRestartNodesInfo(restartNodesInfo)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(WzStatusActionButtons);
