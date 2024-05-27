/*
 * Wazuh app - React component for building the agents preview section.
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
import { EuiPage, EuiFlexItem, EuiSpacer } from '@elastic/eui';
import { AgentsTable } from './table/agents-table';
import WzReduxProvider from '../../redux/wz-redux-provider';
import { WazuhConfig } from '../../react-services/wazuh-config';
import {
  withGlobalBreadcrumb,
  withUserAuthorizationPrompt,
  withErrorBoundary,
} from '../common/hocs';
import { compose } from 'redux';
import { endpointSummary } from '../../utils/applications';
import './endpoints-summary.scss';
import { EndpointsSummaryDashboard } from './dashboard/endpoints-summary-dashboard';
import { getOutdatedAgents } from './services';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../react-services/common-services';

export const EndpointsSummary = compose(
  withErrorBoundary,
  withGlobalBreadcrumb([{ text: endpointSummary.breadcrumbLabel }]),
  withUserAuthorizationPrompt([
    [
      { action: 'agent:read', resource: 'agent:id:*' },
      { action: 'agent:read', resource: 'agent:group:*' },
    ],
  ]),
)(
  class EndpointsSummary extends Component {
    _isMount = false;
    constructor() {
      super();
      this.state = {
        agentTableFilters: {},
        reload: 0,
        outdatedAgents: 0,
        isLoadingOutdatedAgents: true,
        showOnlyOutdatedAgents: false,
      };
      this.wazuhConfig = new WazuhConfig();
      this.filterAgentByStatus = this.filterAgentByStatus.bind(this);
      this.filterAgentByOS = this.filterAgentByOS.bind(this);
      this.filterAgentByGroup = this.filterAgentByGroup.bind(this);
      this.filterByOutdatedAgent = this.filterByOutdatedAgent.bind(this);
    }

    getOutdatedAgents = async () => {
      try {
        this.setState({ isLoadingOutdatedAgents: true });
        const { total_affected_items } = await getOutdatedAgents({ limit: 1 });
        this.setState({ outdatedAgents: total_affected_items });
      } catch (error) {
        const options = {
          context: `EndpointsSummary.getOutdatedAgents`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          error: {
            error,
            message: error.message || error,
            title: `Could not get outdated agents`,
          },
        };
        getErrorOrchestrator().handleError(options);
      } finally {
        this.setState({ isLoadingOutdatedAgents: false });
      }
    };

    setReload = (newValue: number) => {
      this.setState({
        reload: newValue,
      });
      this.getOutdatedAgents();
    };

    setShowOnlyOutdatedAgents = (newValue: boolean) => {
      this.setState({ showOnlyOutdatedAgents: newValue });
    };

    async componentDidMount() {
      this._isMount = true;
      this.getOutdatedAgents();
    }

    componentWillUnmount() {
      this._isMount = false;
    }

    groupBy = function (arr) {
      return arr.reduce(function (prev, item) {
        if (item in prev) prev[item]++;
        else prev[item] = 1;
        return prev;
      }, {});
    };

    filterAgentByStatus(item: any) {
      this._isMount &&
        this.setState({
          agentTableFilters: { q: `id!=000;status=${item.status}` },
        });
    }

    filterAgentByOS(item: any) {
      const query =
        item.label === 'N/A'
          ? 'id!=000;os.name=null'
          : `id!=000;os.name~${item.label}`;
      this._isMount &&
        this.setState({
          agentTableFilters: { q: query },
        });
    }

    filterAgentByGroup(item: any) {
      const query =
        item.label === 'N/A'
          ? 'id!=000;group=null'
          : `id!=000;group=${item.label}`;
      this._isMount &&
        this.setState({
          agentTableFilters: { q: query },
        });
    }

    filterByOutdatedAgent() {
      this._isMount && this.setShowOnlyOutdatedAgents(true);
    }

    render() {
      return (
        <EuiPage className='flex-column'>
          <EuiFlexItem>
            <EndpointsSummaryDashboard
              filterAgentByStatus={this.filterAgentByStatus}
              filterAgentByOS={this.filterAgentByOS}
              filterAgentByGroup={this.filterAgentByGroup}
              outdatedAgents={this.state.outdatedAgents}
              isLoadingOutdatedAgents={this.state.isLoadingOutdatedAgents}
              filterByOutdatedAgent={this.filterByOutdatedAgent}
              reloadDashboard={this.state.reload}
            />
            <EuiSpacer size='m' />
            <WzReduxProvider>
              <AgentsTable
                filters={this.state.agentTableFilters}
                externalReload={this.state.reload}
                setExternalReload={this.setReload}
                showOnlyOutdated={this.state.showOnlyOutdatedAgents}
                setShowOnlyOutdated={this.setShowOnlyOutdatedAgents}
                totalOutdated={this.state.outdatedAgents}
              />
            </WzReduxProvider>
          </EuiFlexItem>
        </EuiPage>
      );
    }
  },
);
