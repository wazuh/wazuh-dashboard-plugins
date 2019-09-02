/*
 * Wazuh app - React component for showing stats about agents.
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
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
import { EuiStat, EuiFlexItem, EuiFlexGroup } from '@elastic/eui';

export class Stats extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <div>
        <EuiFlexGroup>
          <EuiFlexItem />
          <EuiFlexItem>
            <EuiStat
              title={this.props.total}
              description="Total agents"
              titleColor="primary"
              textAlign="center"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={this.props.active}
              description="Active agents"
              titleColor="secondary"
              textAlign="center"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={this.props.disconnected}
              description="Disconnected agents"
              titleColor="danger"
              textAlign="center"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={this.props.neverConnected}
              description="Never connected agents"
              titleColor="subdued"
              textAlign="center"
            />
          </EuiFlexItem>
          <EuiFlexItem />
        </EuiFlexGroup>
      </div>
    );
  }
}

Stats.propTypes = {
  total: PropTypes.any,
  active: PropTypes.any,
  disconnected: PropTypes.any,
  neverConnected: PropTypes.any
};
