/*
 * Wazuh app - React component for registering agents.
 * Copyright (C) 2015-2019 Wazuh, Inc.
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
import { EuiFlexItem, EuiButtonEmpty, EuiSelect } from '@elastic/eui';

import { connect } from 'react-redux';

import {
  updateLoadingStatus,
  updateIsProcessing,
  updateListDaemons,
  updateNodeInfo,
  updateSelectedNode,
} from '../../../../../redux/actions/statusActions';

import StatusHandler from './utils/status-handler';
import { toastNotifications } from 'ui/notify';

class WzStatusActionButtons extends Component {
  _isMounted = false;

  constructor(props) {
    super(props);

    this.refreshTimeoutId = null;
    this.statusHandler = StatusHandler;
    this.state = {};
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentDidUpdate() {}

  componentWillUnmount() {
    this._isMounted = false;
  }

  /**
   * Restart manager
   */
  async restart() {
    try {
      this.props.updateIsProcessing(true);
      this.onRefreshLoading();
    } catch (error) {
      return Promise.reject(error);
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
      this.clusterError = `Node ${node} is down`; // TODO: errors
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

  showToast = (color, title, text, time) => {
    toastNotifications.add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time,
    });
  };

  transforToOptions = listNodes => {
    let options = [];
    for (const node of listNodes) {
      options.push({
        value: node.name,
        text: node.name,
      });
    }
    return options;
  };

  render() {
    const { isLoading, listNodes, selectedNode } = this.props.state;
    let options = this.transforToOptions(listNodes);
    // Select node
    const selectNode = (
      <EuiSelect
        id="selectNode"
        options={options}
        value={selectedNode}
        onChange={this.changeNode}
        disabled={isLoading}
        aria-label="Select node"
      />
    );

    // Restart button
    const restartButton = (
      <EuiButtonEmpty
        iconType="refresh"
        onClick={async () => await this.restart()}
        isDisabled={isLoading}
      >
        Restart cluster
      </EuiButtonEmpty>
    );

    return (
      <Fragment>
        <EuiFlexItem grow={false}>{selectNode}</EuiFlexItem>
        <EuiFlexItem grow={false}>{restartButton}</EuiFlexItem>
      </Fragment>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.statusReducers,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateLoadingStatus: status => dispatch(updateLoadingStatus(status)),
    updateIsProcessing: isProcessing => dispatch(updateIsProcessing(isProcessing)),
    updateListDaemons: listDaemons => dispatch(updateListDaemons(listDaemons)),
    updateNodeInfo: nodeInfo => dispatch(updateNodeInfo(nodeInfo)),
    updateSelectedNode: selectedNode => dispatch(updateSelectedNode(selectedNode)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(WzStatusActionButtons);
