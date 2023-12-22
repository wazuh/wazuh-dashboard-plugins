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
  EuiStat,
  EuiSpacer,
  EuiToolTip,
  EuiCard,
  EuiLink,
  EuiText,
} from '@elastic/eui';
import { AgentsTable } from './table/agents-table';
import { WzRequest } from '../../react-services/wz-request';
import WzReduxProvider from '../../redux/wz-redux-provider';
import { VisFactoryHandler } from '../../react-services/vis-factory-handler';
import { AppState } from '../../react-services/app-state';
import { FilterHandler } from '../../utils/filter-handler';
import { TabVisualizations } from '../../factories/tab-visualizations';
import { WazuhConfig } from '../../react-services/wazuh-config.js';
import {
  withReduxProvider,
  withGlobalBreadcrumb,
  withUserAuthorizationPrompt,
  withErrorBoundary,
} from '../common/hocs';
import { formatUIDate } from '../../../public/react-services/time-service';
import { compose } from 'redux';
import {
  UI_LOGGER_LEVELS,
  UI_ORDER_AGENT_STATUS,
} from '../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../react-services/common-services';
import { VisualizationBasic } from '../common/charts/visualizations/basic';
import {
  agentStatusColorByAgentStatus,
  agentStatusLabelByAgentStatus,
} from '../../../common/services/wz_agent_status';
import { endpointSumary, itHygiene } from '../../utils/applications';
import { ShareAgent } from '../../factories/share-agent';
import { getCore } from '../../kibana-services';
import './endpoints-summary.scss';
import { RedirectAppLinks } from '../../../../../src/plugins/opensearch_dashboards_react/public';

export const EndpointsSummary = compose(
  withErrorBoundary,
  withReduxProvider,
  withGlobalBreadcrumb([{ text: endpointSumary.title }]),
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
        loadingSummary: true,
        loadingLastRegisteredAgent: true,
        agentTableFilters: [],
        agentStatusSummary: [],
        agentsActiveCoverage: undefined,
      };
      this.wazuhConfig = new WazuhConfig();
      this.agentStatus = UI_ORDER_AGENT_STATUS.map(agentStatus => ({
        status: agentStatus,
        label: agentStatusLabelByAgentStatus(agentStatus),
        color: agentStatusColorByAgentStatus(agentStatus),
      }));
      this.shareAgent = new ShareAgent();
    }

    async componentDidMount() {
      this._isMount = true;
      this.getSummary();
      this.fetchLastRegisteredAgent();
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

    async getSummary() {
      try {
        this.setState({ loadingSummary: true });

        const {
          data: {
            data: {
              connection: agentStatusSummary,
              configuration: agentConfiguration,
            },
          },
        } = await WzRequest.apiReq('GET', '/agents/summary/status', {});

        const agentsActiveCoverage = (
          (agentStatusSummary?.active / agentStatusSummary?.total) *
          100
        ).toFixed(2);

        this.setState({
          loadingSummary: false,
          agentStatusSummary,
          agentsActiveCoverage: isNaN(agentsActiveCoverage)
            ? 0
            : agentsActiveCoverage,
        });
      } catch (error) {
        this.setState({
          loadingSummary: false,
          agentStatusSummary: [],
          agentsActiveCoverage: undefined,
        });
        const options = {
          context: `EndpointsSummary.getSummary`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          error: {
            error: error,
            message: error.message || error,
            title: `Could not get agents summary`,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    }

    async fetchLastRegisteredAgent() {
      try {
        this.setState({ loadingLastRegisteredAgent: true });
        const {
          data: {
            data: {
              affected_items: [lastRegisteredAgent],
            },
          },
        } = await WzRequest.apiReq('GET', '/agents', {
          params: { limit: 1, sort: '-dateAdd', q: 'id!=000' },
        });
        this.setState({
          loadingLastRegisteredAgent: false,
          lastRegisteredAgent,
        });
      } catch (error) {
        this.setState({
          loadingLastRegisteredAgent: false,
        });
        const options = {
          context: `EndpointsSummary.fetchLastRegisteredAgent`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          error: {
            error: error,
            message: error.message || error,
            title: `Could not get the last registered agent`,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    }

    filterAgentByStatus(status) {
      this._isMount &&
        this.setState({
          agentTableFilters: { q: `id!=000;status=${status}` },
        });
    }

    render() {
      return (
        <EuiPage className='flex-column'>
          <EuiFlexItem>
            <EuiFlexGroup className='agents-visualization-group mt-0'>
              <EuiFlexItem className='agents-status-pie' grow={false}>
                <EuiCard
                  title
                  description
                  betaBadgeLabel='Status'
                  className='eui-panel'
                >
                  <EuiFlexGroup>
                    <EuiFlexItem className='align-items-center'>
                      <VisualizationBasic
                        isLoading={this.state.loadingSummary}
                        type='donut'
                        size={{ width: '100%', height: '150px' }}
                        showLegend
                        data={this.agentStatus.map(
                          ({ status, label, color }) => ({
                            label,
                            value: this.state.agentStatusSummary[status] || 0,
                            color,
                            onClick: () => this.filterAgentByStatus(status),
                          }),
                        )}
                        noDataTitle='No results'
                        noDataMessage='No results were found.'
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiCard>
              </EuiFlexItem>
              <EuiFlexItem className='agents-details-card'>
                <EuiCard title description betaBadgeLabel='Details'>
                  <EuiFlexGroup wrap={true} className='group-details'>
                    {this.agentStatus.map(({ status, label, color }) => (
                      <EuiFlexItem key={`agent-details-status-${status}`}>
                        <EuiStat
                          isLoading={this.state.loadingSummary}
                          title={
                            <EuiToolTip
                              position='top'
                              content={`Filter by agent status: ${status}`}
                            >
                              <span
                                onClick={() => this.filterAgentByStatus(status)}
                                style={{ cursor: 'pointer' }}
                              >
                                {this.state.agentStatusSummary[status]}
                              </span>
                            </EuiToolTip>
                          }
                          titleSize='s'
                          description={label}
                          titleColor={color}
                          className='white-space-nowrap'
                        />
                      </EuiFlexItem>
                    ))}
                    <EuiFlexItem>
                      <EuiStat
                        isLoading={this.state.loadingSummary}
                        title={`${this.state.agentsActiveCoverage}%`}
                        titleSize='s'
                        description='Agents coverage'
                        className='white-space-nowrap'
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                  <EuiFlexGroup className='mt-0'>
                    <EuiFlexItem className='agents-link-item'>
                      <EuiStat
                        titleElement='div'
                        className='euiStatLink last-agents-link'
                        isLoading={this.state.loadingLastRegisteredAgent}
                        title={
                          this.state.lastRegisteredAgent?.id ? (
                            <EuiToolTip
                              position='top'
                              content='View agent details'
                            >
                              <RedirectAppLinks
                                application={getCore().application}
                              >
                                <EuiLink
                                  href={getCore().application.getUrlForApp(
                                    itHygiene.id,
                                    {
                                      path: `#/agents?tab=welcome&agent=${this.state.lastRegisteredAgent?.id}`,
                                    },
                                  )}
                                >
                                  {this.state.lastRegisteredAgent?.name}
                                </EuiLink>
                              </RedirectAppLinks>
                            </EuiToolTip>
                          ) : (
                            <EuiText>-</EuiText>
                          )
                        }
                        titleSize='s'
                        description='Last registered agent'
                        titleColor='primary'
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiCard>
              </EuiFlexItem>
            </EuiFlexGroup>
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
