/*
 * Wazuh app - React component for showing stats about agents.
 *
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
import { EuiStat, EuiFlexItem, EuiFlexGroup, EuiPage, EuiToolTip } from '@elastic/eui';
import { withErrorBoundary } from '../../../components/common/hocs';
import { UI_ORDER_AGENT_STATUS } from '../../../../common/constants';
import { agentStatusLabelByAgentStatus, agentStatusColorByAgentStatus } from '../../../../common/services/wz_agent_status';

export const Stats = withErrorBoundary (class Stats extends Component {
  constructor(props) {
    super(props);

    this.state = {};
    this.agentStatus = ['total', ...UI_ORDER_AGENT_STATUS].map(status => ({
      status,
      label: status !== 'total' ? agentStatusLabelByAgentStatus(status) : 'Total',
      onClick: () => this.goToAgents(status !== 'total' ? status : null),
      color: status !== 'total' ? agentStatusColorByAgentStatus(status) : 'primary'
    }));
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
            {this.agentStatus.map(({status, label, onClick, color}) => (
              <EuiFlexItem key={`agent-status-${status}`}>
                <EuiStat
                  title={
                    <EuiToolTip position="top" content={`Go to ${label.toLowerCase()} agents`}>
                      <span
                        className='statWithLink'
                        style={{ cursor: "pointer" }}
                        onClick={onClick}
                      >
                        {typeof this.props[status] !== 'undefined' ? this.props[status] : '-'}
                      </span>
                    </EuiToolTip>
                  }
                  description={`${label} agents`}
                  titleColor={color}
                  textAlign="center"
                />
              </EuiFlexItem>
            ))}
          <EuiFlexItem />
        </EuiFlexGroup>
      </EuiPage>
    );
  }
});

Stats.propTypes = {
  total: PropTypes.any,
  active: PropTypes.any,
  disconnected: PropTypes.any,
  pending: PropTypes.any,
  never_connected: PropTypes.any
};
