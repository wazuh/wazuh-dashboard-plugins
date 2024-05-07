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
  EuiCard,
  EuiFlexItem,
  EuiFlexGroup,
  EuiPage,
  EuiToolTip,
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
import { VisualizationBasic } from '../../../components/common/charts/visualizations/basic';
import './stats.scss';
export const Stats = withErrorBoundary(
  class Stats extends Component {
    constructor(props) {
      super(props);

      this.state = {
        agentStatusSummary: {
          active: '-',
          disconnected: '-',
          total: '-',
          pending: '-',
          never_connected: '-',
        },
      };
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
      const hasResults = this.agentStatus.some(
        ({ status }) => this.props[status],
      );
      return (
        <EuiPage>
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiCard betaBadgeLabel='Agents summary' title=''>
                <VisualizationBasic
                  isLoading={this.state.loadingSummary}
                  type='donut'
                  size={{ width: '100%', height: '150px' }}
                  showLegend
                  data={
                    hasResults &&
                    this.agentStatus.map(
                      ({ status, label, color, onClick }) => ({
                        onClick,
                        label,
                        value:
                          typeof this.props[status] !== 'undefined'
                            ? this.props[status]
                            : 0,
                        color,
                      }),
                    )
                  }
                  noDataTitle='No results'
                  noDataMessage='No results were found.'
                />
              </EuiCard>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiCard betaBadgeLabel='Last 24 hours alerts' title=''>
                <EuiFlexGroup className='vulnerabilites-summary-card' wrap>
                  <LastAlertsStat severity='critical' />
                  <LastAlertsStat severity='high' />
                  <LastAlertsStat severity='medium' />
                  <LastAlertsStat severity='low' />
                </EuiFlexGroup>
              </EuiCard>
            </EuiFlexItem>
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
