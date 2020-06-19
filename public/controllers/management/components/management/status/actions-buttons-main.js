/*
 * Wazuh app - React component of actions buttons for status.
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
import {
  EuiFlexItem,
  EuiButtonEmpty,
  EuiSelect,
  EuiOverlayMask,
  EuiConfirmModal
} from '@elastic/eui';

import { connect } from 'react-redux';

import {
  updateLoadingStatus,
  updateListDaemons,
  updateNodeInfo,
  updateSelectedNode
} from '../../../../../redux/actions/statusActions';

import StatusHandler from './utils/status-handler';
import { toastNotifications } from 'ui/notify';

class WzStatusActionButtons extends Component {
  _isMounted = false;

  constructor(props) {
    super(props);

    this.refreshTimeoutId = null;
    this.statusHandler = StatusHandler;
    this.state = {
      isModalVisible: false,
      isRestarting: false
    };
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentDidUpdate() {}

  componentWillUnmount() {
    this._isMounted = false;
  }

  /**
   * Restart cluster
   */
  async restartCluster() {
    this.setState({ isRestarting: true });
    try {
      const result = await this.statusHandler.restartCluster();
      this.setState({ isRestarting: false });
      this.showToast(
        'success',
        'Restarting cluster, it will take up to 30 seconds.',
        3000
      );
    } catch (error) {
      this.setState({ isRestarting: false });
      this.showToast('danger', `Error restarting cluster: ${error.message || error}`, 3000);
    }
  }

  /**
   * Restart manager
   */
  async restartManager() {
    this.setState({ isRestarting: true });
    try {
      await this.statusHandler.restartManager();
      this.setState({ isRestarting: false });
      this.showToast('success', 'Restarting manager.', 3000);
    } catch (error) {
      this.setState({ isRestarting: false });
      this.showToast('danger', `Error restarting manager: ${error.message || error}`, 3000);
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
  changeNode = async e => {
    try {
      const node = e.target.value;
      this.props.updateLoadingStatus(true);
      this.props.updateSelectedNode(node);

      const daemons = await this.statusHandler.clusterNodeStatus(node);
      const listDaemons = this.objToArr(daemons.data.data);
      this.props.updateListDaemons(listDaemons);

      const nodeInfo = await this.statusHandler.clusterNodeInfo(node);
      this.props.updateNodeInfo(nodeInfo.data.data);

      this.props.updateLoadingStatus(false);
    } catch (error) {
      this.props.updateLoadingStatus(false);
      this.showToast('danger', `Node ${node} is down`, 3000);
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
    toastNotifications.add({
      color: color,
      title: text,
      toastLifeTimeMs: time
    });
  };

  transforToOptions = listNodes => {
    let options = [];
    for (const node of listNodes) {
      options.push({
        value: node.name,
        text: `${node.name} (${node.type})`
      });
    }
    return options;
  };

  closeModal = () => {
    this.setState({ isModalVisible: false });
  };

  render() {
    const {
      isLoading,
      listNodes,
      selectedNode,
      clusterEnabled,
      isRestarting
    } = this.props.state;
    const { adminMode } = this.props;

    let options = this.transforToOptions(listNodes);

    // Select node
    const selectNode = (
      <EuiSelect
        id="selectNode"
        options={options}
        value={selectedNode}
        onChange={this.changeNode}
        disabled={isLoading || this.state.isRestarting}
        aria-label="Select node"
      />
    );

    // Restart button
    const restartButton = (
      <EuiButtonEmpty
        iconType="refresh"
        onClick={async () => this.setState({ isModalVisible: true })}
        isDisabled={isLoading}
        isLoading={this.state.isRestarting}
      >
        {clusterEnabled && 'Restart cluster'}
        {!clusterEnabled && 'Restart manager'}
      </EuiButtonEmpty>
    );

    let modal;

    if (this.state.isModalVisible) {
      modal = (
        <EuiOverlayMask>
          <EuiConfirmModal
            title={
              clusterEnabled
                ? 'Cluster will be restarted'
                : 'Manager will be restarted'
            }
            onCancel={this.closeModal}
            onConfirm={() => {
              if (clusterEnabled) {
                this.restartCluster();
              } else {
                this.restartManager();
              }
              this.setState({ isModalVisible: false });
            }}
            cancelButtonText="Cancel"
            confirmButtonText="Confirm"
            defaultFocusedButton="cancel"
          ></EuiConfirmModal>
        </EuiOverlayMask>
      );
    }

    return (
      <Fragment>
        {adminMode && selectedNode !== null && (
          <EuiFlexItem grow={false}>{restartButton}</EuiFlexItem>
        )}
        {selectedNode && <EuiFlexItem grow={false}>{selectNode}</EuiFlexItem>}
        {modal}
      </Fragment>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.statusReducers,
    adminMode: state.appStateReducers.adminMode
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateLoadingStatus: status => dispatch(updateLoadingStatus(status)),
    updateListDaemons: listDaemons => dispatch(updateListDaemons(listDaemons)),
    updateNodeInfo: nodeInfo => dispatch(updateNodeInfo(nodeInfo)),
    updateSelectedNode: selectedNode =>
      dispatch(updateSelectedNode(selectedNode))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WzStatusActionButtons);
