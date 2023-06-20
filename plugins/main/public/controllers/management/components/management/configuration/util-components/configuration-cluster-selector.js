/*
 * Wazuh app - React component for cluster node selector.
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

import { EuiSelect } from '@elastic/eui';

import {
  updateClusterNodeSelected
} from '../../../../../../redux/actions/configurationActions';

import { connect } from 'react-redux';

class WzConfigurationClusterSelect extends Component {
  constructor(props) {
    super(props);
  }
  onChange = e => {
    this.props.updateClusterNodeSelected(e.target.value);
  };
  render() {
    const options = this.props.clusterNodes.map(clusterNode => ({
      value: clusterNode.name,
      text: `${clusterNode.name} (${clusterNode.type})`
    }));
    return (
      <EuiSelect
        id="selectConfigurationClusterNode"
        options={options}
        value={this.props.clusterNodeSelected}
        onChange={this.onChange}
        aria-label="Select Configuration Cluster Node"
        fullWidth={true}
      />
    );
  }
}

const mapStateToProps = state => ({
  clusterNodes: state.configurationReducers.clusterNodes,
  clusterNodeSelected: state.configurationReducers.clusterNodeSelected
});

const mapDispatchToProps = dispatch => ({
  updateClusterNodeSelected: clusterNodeSelected =>
    dispatch(updateClusterNodeSelected(clusterNodeSelected))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WzConfigurationClusterSelect);
