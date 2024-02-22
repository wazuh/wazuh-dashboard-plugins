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
import {
  EuiPage,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiFlexGrid,
} from '@elastic/eui';
import { AgentsTable } from './table/agents-table';
import WzReduxProvider from '../../redux/wz-redux-provider';
import { VisFactoryHandler } from '../../react-services/vis-factory-handler';
import { AppState } from '../../react-services/app-state';
import { FilterHandler } from '../../utils/filter-handler';
import { TabVisualizations } from '../../factories/tab-visualizations';
import { WazuhConfig } from '../../react-services/wazuh-config';
import {
  withReduxProvider,
  withGlobalBreadcrumb,
  withUserAuthorizationPrompt,
  withErrorBoundary,
} from '../common/hocs';
import { compose } from 'redux';
import { endpointSummary } from '../../utils/applications';
import { ShareAgent } from '../../factories/share-agent';
import './endpoints-summary.scss';
import OutdatedAgentsCard from './dashboard/components/outdated-agents-card';
import DonutCard from './dashboard/components/donut-card';
import { getSummaryAgentsStatus } from './services/get-summary-agents-status';
import { getAgentsByOs } from './services/get-agents-by-os';
import { getAgentsByGroup } from './services/get-agents-by-group';
import { EndpointsSummaryDashboard } from './dashboard/endpoints-summary-dashboard';

export const EndpointsSummary = compose(
  withErrorBoundary,
  withReduxProvider,
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
      };
      this.wazuhConfig = new WazuhConfig();
      this.shareAgent = new ShareAgent();
      this.filterAgentByStatus = this.filterAgentByStatus.bind(this);
      this.filterAgentByOS = this.filterAgentByOS.bind(this);
      this.filterAgentByGroup = this.filterAgentByGroup.bind(this);
      this.filterByOutdatedAgent = this.filterByOutdatedAgent.bind(this);
    }

    async componentDidMount() {
      this._isMount = true;
      if (this.wazuhConfig.getConfig()['wazuh.monitoring.enabled']) {
        const tabVisualizations = new TabVisualizations();
        tabVisualizations.removeAll();
        tabVisualizations.setTab('general');
        tabVisualizations.assign({
          general: 1,
        });
        const filterHandler = new FilterHandler(AppState.getCurrentPattern());
        await VisFactoryHandler.buildOverviewVisualizations(
          filterHandler,
          'general',
          null,
        );
      }
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
      this._isMount &&
        this.setState({
          agentTableFilters: { q: `id!=000;os.name~${item.label}` },
        });
    }

    filterAgentByGroup(item: any) {
      const groups: string = item?.label
        ?.split(',')
        .map((groupLabel: string) => `group=${groupLabel}`)
        .join(';');
      this._isMount &&
        this.setState({
          agentTableFilters: { q: `id!=000;${groups}` },
        });
    }

    filterByOutdatedAgent(outdatedAgents: any) {
      const ids: string = outdatedAgents
        .map((agent: any) => `id=${agent.id}`)
        .join(',');
      this._isMount &&
        this.setState({
          agentTableFilters: { q: `id!=000;${ids}` },
        });
    }

    render() {
      return (
        <EuiPage className='flex-column'>
          <EuiFlexItem>
            <EndpointsSummaryDashboard
              filterAgentByStatus={this.filterAgentByStatus}
              filterAgentByOS={this.filterAgentByOS}
              filterAgentByGroup={this.filterAgentByGroup}
              filterByOutdatedAgent={this.filterByOutdatedAgent}
            />
            <EuiSpacer size='m' />
            <WzReduxProvider>
              <AgentsTable filters={this.state.agentTableFilters} />
            </WzReduxProvider>
          </EuiFlexItem>
        </EuiPage>
      );
    }
  },
);
