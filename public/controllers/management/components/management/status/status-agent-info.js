/*
 * Wazuh app - React component for building the status stats
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
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiIcon
} from '@elastic/eui';

import { connect } from 'react-redux';

export class WzStatusAgentInfo extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const { agentInfo } = this.props.state;
    const status = agentInfo.status;
    let operatingSystem = false;
    if (status !== 'Never connected' && agentInfo.os) {
      operatingSystem = agentInfo.os.name
        ? agentInfo.os.name + agentInfo.os.version
        : agentInfo.os.uname
        ? agentInfo.os.uname
        : '-';
    }

    const greyStyle = {
      color: 'grey'
    };

    return (
      <EuiPanel>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiTitle size="m">
                  <h2>Last registered agent</h2>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>Name</EuiFlexItem>
          <EuiFlexItem style={greyStyle}>{agentInfo.name}</EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>ID</EuiFlexItem>
          <EuiFlexItem style={greyStyle}>{agentInfo.id}</EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>Status</EuiFlexItem>
          <EuiFlexItem style={greyStyle}>{agentInfo.status}</EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>IP Address</EuiFlexItem>
          <EuiFlexItem style={greyStyle}>{agentInfo.ip}</EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>Date add</EuiFlexItem>
          <EuiFlexItem style={greyStyle}>{agentInfo.dateAdd}</EuiFlexItem>
        </EuiFlexGroup>
        {status !== 'Never connected' && (
          <div>
            <EuiFlexGroup>
              <EuiFlexItem>Version</EuiFlexItem>
              <EuiFlexItem style={greyStyle}>{agentInfo.version}</EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup>
              <EuiFlexItem>Last keep alive</EuiFlexItem>
              <EuiFlexItem style={greyStyle}>
                {agentInfo.lastKeepAlive}
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup>
              <EuiFlexItem>Operating system</EuiFlexItem>
              <EuiFlexItem style={greyStyle}>
                {operatingSystem || '-'}
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
        )}
      </EuiPanel>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.statusReducers
  };
};

export default connect(mapStateToProps)(WzStatusAgentInfo);
