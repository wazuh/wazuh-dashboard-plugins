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
import {
  EuiStat,
  EuiFlexItem,
  EuiFlexGroup,
  EuiPage,
  EuiToolTip,
  EuiLink,
} from '@elastic/eui';
import { withErrorBoundary } from '../../../components/common/hocs';
import { API_NAME_AGENT_STATUS } from '../../../../common/constants';
import {
  agentStatusLabelByAgentStatus,
  agentStatusColorByAgentStatus,
} from '../../../../common/services/wz_agent_status';
import { getCore } from '../../../kibana-services';
import { endpointSummary } from '../../../utils/applications';
import { LastAlertsStat } from './last-alerts-stat';

export const Stats = withErrorBoundary(
  class Stats extends Component {
    constructor(props) {
      super(props);

      this.state = {};
      this.agentStatus = [
        API_NAME_AGENT_STATUS.ACTIVE,
        API_NAME_AGENT_STATUS.DISCONNECTED,
      ].map(status => ({
        status,
        label: agentStatusLabelByAgentStatus(status),
        onClick: () => this.goToAgents(status),
        color: agentStatusColorByAgentStatus(status),
      }));
    }

    goToAgents(status) {
      if (status) {
        sessionStorage.setItem(
          'wz-agents-overview-table-filter',
          JSON.stringify({ q: `id!=000;status=${status}` }),
        );
      } else if (sessionStorage.getItem('wz-agents-overview-table-filter')) {
        sessionStorage.removeItem('wz-agents-overview-table-filter');
      }
      getCore().application.navigateToApp(endpointSummary.id, {
        path: `#${endpointSummary.redirectTo()}`,
      });
    }

    renderTitle(total) {
      return (
        <EuiToolTip position='top' content={`Go to all agents`}>
          <span>{total}</span>
        </EuiToolTip>
      );
    }

    render() {
      return (
        <EuiPage>
          <EuiFlexGroup>
            <EuiFlexItem />
            {this.agentStatus.map(({ status, label, onClick, color }) => (
              <EuiFlexItem key={`agent-status-${status}`}>
                <EuiStat
                  title={
                    <EuiToolTip
                      position='top'
                      content={`Go to ${label.toLowerCase()} agents`}
                    >
                      <EuiLink
                        className='statWithLink'
                        style={{ fontWeight: 'normal', color }}
                        onClick={onClick}
                      >
                        {typeof this.props[status] !== 'undefined'
                          ? this.props[status]
                          : '-'}
                      </EuiLink>
                    </EuiToolTip>
                  }
                  description={`${label} agents`}
                  titleColor={color}
                  textAlign='center'
                />
              </EuiFlexItem>
            ))}
            <LastAlertsStat />
            <EuiFlexItem />
          </EuiFlexGroup>
        </EuiPage>
      );
    }
  },
);

Stats.propTypes = {
  active: PropTypes.any,
  disconnected: PropTypes.any,
};
