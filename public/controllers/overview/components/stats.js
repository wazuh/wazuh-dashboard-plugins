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
import { EuiStat, EuiFlexItem, EuiFlexGroup, EuiPage, EuiToolTip } from '@elastic/eui';

export class Stats extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  goToAgents(status) {
    if(status){
      sessionStorage.setItem(
        'agents_preview_selected_options',
        JSON.stringify([{field: 'q', value: `status=${status}`}])
      );
    }else if(sessionStorage.getItem('agents_preview_selected_options')){
      sessionStorage.removeItem('agents_preview_selected_options');
    }
    window.location.href = '#/agents-preview';
  }

  renderTitle(total) {
    return <EuiToolTip position="top" content={`Go to all agents`}>
      <span>
        {total}
      </span>
    </EuiToolTip>
  }

  render() {
    return (
      <EuiPage>
        <EuiFlexGroup>
          <EuiFlexItem />
          <EuiFlexItem>
            <EuiStat
              title={
                <EuiToolTip position="top" content={`Go to all agents`}>
                  <span
                    className={ 'statWithLink' }
                    style={{ cursor: "pointer" }}
                    onClick={() => this.goToAgents(null)}
                  >
                    {this.props.total}
                  </span>
                </EuiToolTip>
              }
              description="Total agents"
              titleColor="primary"
              textAlign="center"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={
                <EuiToolTip position="top" content={`Go to active agents`}>
                  <span
                    onClick={() => this.goToAgents('active')}
                    className={ 'statWithLink' }
                    style={{ cursor: "pointer" }}
                  >
                    {this.props.active}
                  </span>
                </EuiToolTip>
              }
              description="Active agents"
              titleColor="secondary"
              textAlign="center"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={
                <EuiToolTip position="top" content={`Go to disconnected agents`}>
                  <span
                    onClick={() => this.goToAgents('disconnected')}
                    className={ 'statWithLink' }
                    style={{ cursor: "pointer" }}
                  >
                    {this.props.disconnected}
                  </span>
                </EuiToolTip>
              }
              description="Disconnected agents"
              titleColor="danger"
              textAlign="center"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={
                <EuiToolTip position="top" content={`Go to never connected agents`}>
                  <span
                    onClick={() => this.goToAgents('never_connected')}
                    className={ 'statWithLink' }
                    style={{ cursor: "pointer" }}
                  >
                    {this.props.neverConnected}
                  </span>
                </EuiToolTip>
              }
              description="Never connected agents"
              titleColor="subdued"
              textAlign="center"
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
