/*
 * Wazuh app - React component for showing stats about agents.
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
import PropTypes from 'prop-types';
import { EuiStat, EuiFlexItem, EuiFlexGroup, EuiPage } from '@elastic/eui';

export class Stats extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  goToAgents(status) {
    let selectedOptions = [];

    if (status !== null) {
      selectedOptions = [
        {
          className: 'wzFilterBarOperator',
          group: 'status',
          label: 'status:' + status,
          label_: status,
          type: 'AND'
        }
      ];
    }

    sessionStorage.setItem(
      'agents_preview_selected_options',
      JSON.stringify(selectedOptions)
    );
    window.location.href = '#/agents-preview';
  }

  render() {
    return (
      <EuiPage>
        <EuiFlexGroup>
          <EuiFlexItem />
          <EuiFlexItem>
            <EuiStat
              title={this.props.total}
              description="Total agents"
              titleColor="primary"
              textAlign="center"
              style={{ cursor: 'pointer' }}
              onClick={() => this.goToAgents(null)}
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={this.props.active}
              description="Active agents"
              titleColor="secondary"
              textAlign="center"
              style={{ cursor: 'pointer' }}
              onClick={() => this.goToAgents('Active')}
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={this.props.disconnected}
              description="Disconnected agents"
              titleColor="danger"
              textAlign="center"
              style={{ cursor: 'pointer' }}
              onClick={() => this.goToAgents('Disconnected')}
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={this.props.neverConnected}
              description="Never connected agents"
              titleColor="subdued"
              textAlign="center"
              style={{ cursor: 'pointer' }}
              onClick={() => this.goToAgents('Never connected')}
            />
          </EuiFlexItem>
          <EuiFlexItem />
        </EuiFlexGroup>
      </EuiPage>
    );
  }
}

Stats.propTypes = {
  total: PropTypes.any,
  active: PropTypes.any,
  disconnected: PropTypes.any,
  neverConnected: PropTypes.any
};
