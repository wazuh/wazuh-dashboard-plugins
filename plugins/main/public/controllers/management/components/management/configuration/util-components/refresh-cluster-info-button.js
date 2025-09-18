/*
 * Wazuh app - React component for render button to refresh cluster nodes info.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { EuiButtonEmpty } from '@elastic/eui';

import { connect } from 'react-redux';
import {
  updateClusterNodes,
  updateClusterNodeSelected,
  updateRefreshTime,
} from '../../../../../../redux/actions/configurationActions';
import { clusterNodes } from '../utils/wz-fetch';
import { UI_LOGGER_LEVELS } from '../../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../../react-services/common-services';

class WzRefreshClusterInfoButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
    };
  }
  async refreshClusterNodes() {
    try {
      this.setState({ isLoading: true });
      const nodes = await clusterNodes();
      this.props.updateClusterNodes(nodes.data.data.affected_items);
      const existsClusterCurrentNodeSelected =
        nodes.data.data.affected_items.find(
          node => node.name === this.props.clusterNodeSelected,
        );
      this.props.updateClusterNodeSelected(
        existsClusterCurrentNodeSelected
          ? existsClusterCurrentNodeSelected.name
          : nodes.data.data.affected_items.find(node => node.type === 'master')
              .name,
      );
    } catch (error) {
      // do nothing if it isn't a cluster
      this.props.updateClusterNodes(false);
      this.props.updateClusterNodeSelected(false);
      const options = {
        context: `${WzRefreshClusterInfoButton.name}.${this.refreshClusterNodes.name}`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
    this.setState({ isLoading: false });
    this.props.updateRefreshTime();
  }
  render() {
    return (
      <EuiButtonEmpty
        iconType='refresh'
        isLoading={this.state.isLoading}
        onClick={() => this.refreshClusterNodes()}
        isDisabled={this.state.isLoading}
      >
        Refresh
      </EuiButtonEmpty>
    );
  }
}

const mapStateToProps = state => ({
  clusterNodeSelected: state.configurationReducers.clusterNodeSelected,
});

const mapDispatchToProps = dispatch => ({
  updateClusterNodes: clusterNodes =>
    dispatch(updateClusterNodes(clusterNodes)),
  updateClusterNodeSelected: clusterNodeSelected =>
    dispatch(updateClusterNodeSelected(clusterNodeSelected)),
  updateRefreshTime: () => dispatch(updateRefreshTime()),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(WzRefreshClusterInfoButton);
