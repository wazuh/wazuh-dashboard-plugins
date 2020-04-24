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
import { EuiStat, EuiFlexItem, EuiFlexGroup } from '@elastic/eui';

import { connect } from 'react-redux';

export class WzStatusStats extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentDidUpdate() {}

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const { stats } = this.props.state;
    const agentsCoverage = stats.agentsCoverity.toFixed(2) + '%';

    return (
      <div>
        <EuiFlexGroup>
          <EuiFlexItem />
          <EuiFlexItem>
            <EuiStat
              title={stats.agentsCountTotal}
              description="Total agents"
              titleColor="primary"
              textAlign="center"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={stats.agentsCountActive}
              description="Active"
              titleColor="secondary"
              textAlign="center"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={stats.agentsCountDisconnected}
              description="Disconnected"
              titleColor="danger"
              textAlign="center"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={stats.agentsCountNeverConnected}
              description="Never connected"
              titleColor="subdued"
              textAlign="center"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={agentsCoverage}
              description="Agents coverage"
              titleColor="accent"
              textAlign="center"
            />
          </EuiFlexItem>
          <EuiFlexItem />
        </EuiFlexGroup>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    state: state.statusReducers
  };
};

export default connect(mapStateToProps)(WzStatusStats);
