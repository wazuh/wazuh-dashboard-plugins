/*
* Wazuh app - React component for registering agents.
* Copyright (C) 2015-2020 Wazuh, Inc.
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 2 of the License, or
* (at your option) any later version.
*
* Find more information about this on the LICENSE file.
*/

import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";

import {
  EuiSelect
} from "@elastic/eui";

import { updateClusterNodes, updateClusterNodeSelected, updateLoadingStatus } from '../../../../../redux/actions/configurationActions';

import { connect } from 'react-redux';

class WzConfigurationClusterSelect extends Component{
  constructor(props){
    super(props);
  }
  onChange = (e) => {
    this.props.updateClusterNodeSelected(e.target.value);
    if(this.props.view !== ''){
      this.props.updateLoadingStatus(true);
      setTimeout(() => {this.props.updateLoadingStatus(false);},0) //TODO: ñapa
    }
  }
  render(){
    const options = this.props.clusterNodes.map((clusterNode) => ({ value: clusterNode.name, text: clusterNode.name }))
    return (
      <EuiSelect
        id="selectConfigurationClusterNode"
        options={options}
        value={this.props.clusterNodeSelected}
        onChange={this.onChange}
        aria-label="Select Configuration Cluster Node"
      />
    )
  }
}

const mapStateToProps = (state) => ({
  clusterNodeSelected: state.configurationReducers.clusterNodeSelected
});

const mapDispatchToProps = (dispatch) => ({
  updateClusterNodeSelected: (clusterNodeSelected) => dispatch(updateClusterNodeSelected(clusterNodeSelected)),
  updateLoadingStatus: (loadingStatus) => dispatch(updateLoadingStatus(loadingStatus))
});

export default connect(mapStateToProps,mapDispatchToProps)(WzConfigurationClusterSelect);