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

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  EuiPage,
  EuiFlexGroup,
  EuiFlexItem,
  EuiStat,
  EuiLoadingChart,
  EuiSpacer,
  EuiToolTip,
  EuiCard,
} from '@elastic/eui';
import { AgentsTable } from './agents-table';
import { WzRequest } from '../../../react-services/wz-request';
import KibanaVis from '../../../kibana-integrations/kibana-vis';
import WzReduxProvider from '../../../redux/wz-redux-provider';
import { VisFactoryHandler } from '../../../react-services/vis-factory-handler';
import { AppState } from '../../../react-services/app-state';
import { FilterHandler } from '../../../utils/filter-handler';
import { TabVisualizations } from '../../../factories/tab-visualizations';
import { WazuhConfig } from './../../../react-services/wazuh-config.js';
import {
  withReduxProvider,
  withGlobalBreadcrumb,
  withUserAuthorizationPrompt,
} from '../../../components/common/hocs';
import { formatUIDate } from '../../../../public/react-services/time-service';
import { compose } from 'redux';
import { withErrorBoundary } from '../../../components/common/hocs';
import './agents-preview.scss';
import { UI_LOGGER_LEVELS, UI_ORDER_AGENT_STATUS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { VisualizationBasic } from '../../../components/common/charts/visualizations/basic';
import { agentStatusColorByAgentStatus, agentStatusLabelByAgentStatus } from '../../../../common/services/wz_agent_status';

export const AgentsPreview = compose(
  withErrorBoundary,
  withReduxProvider,
  withGlobalBreadcrumb([{ text: '' }, { text: 'Agents' }]),
  withUserAuthorizationPrompt([
    [
      { action: 'agent:read', resource: 'agent:id:*' },
      { action: 'agent:read', resource: 'agent:group:*' },
    ],
  ])
)(
  class AgentsPreview extends Component {
    _isMount = false;
    constructor(props) {
      super(props);
      this.state = {
        loading: false,
        showAgentsEvolutionVisualization: false,
        agentTableFilters: [],
        agentStatusSummary: {}
      };
      this.wazuhConfig = new WazuhConfig();
      this.agentStatus = UI_ORDER_AGENT_STATUS.map(agentStatus => ({
        status: agentStatus,
        label: agentStatusLabelByAgentStatus(agentStatus),
        color: agentStatusColorByAgentStatus(agentStatus)
      }));
    }

    async componentDidMount() {
      this._isMount = true;
      this.fetchAgentStatusDetailsData();
      if (this.wazuhConfig.getConfig()['wazuh.monitoring.enabled']) {
        this._isMount && this.setState({ 
          showAgentsEvolutionVisualization: true 
        });
        const tabVisualizations = new TabVisualizations();
        tabVisualizations.removeAll();
        tabVisualizations.setTab('general');
        tabVisualizations.assign({
          general: 1,
        });
        const filterHandler = new FilterHandler(AppState.getCurrentPattern());
        await VisFactoryHandler.buildOverviewVisualizations(filterHandler, 'general', null);
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

    async fetchAgentStatusDetailsData(){
      try {
        this.setState({ loading: true });
        const {data: {data: agentStatusSummary}} = await WzRequest.apiReq('GET', '/agents/summary/status', {});

        const {data: {data: {affected_items: [lastRegisteredAgent]}}} = await WzRequest.apiReq('GET', '/agents', {
          params: { limit: 1, sort: '-dateAdd', q: 'id!=000' },
        });
        const agentMostActive = await this.props.tableProps.getMostActive();

        this.setState({
          loading: false,
          lastRegisteredAgent,
          agentStatusSummary,
          agentsActiveCoverage: ((agentStatusSummary.active/agentStatusSummary.total)*100).toFixed(2),
          agentMostActive
        });
      } catch (error) {
        this.setState({loading: false});
        const options = {
          context: `${AgentsPreview.name}.fetchAgentStatusDetailsData`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          error: {
            error: error,
            message: error.message || error,
            title: `Could not get the agents summary`,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    }

    removeFilters() {
      this._isMount && this.setState({ agentTableFilters: [] });
    }

    showAgent(agent) {
      agent && this.props.tableProps.showAgent(agent);
    }

    filterAgentByStatus(status) {
      this._isMount &&
        this.setState({
          agentTableFilters: [{ field: 'q', value: `status=${status}` }],
        });
    }

    render() {
      return (
        <EuiPage className="flex-column">
          <EuiFlexItem>
            <EuiFlexGroup className="agents-evolution-visualization-group mt-0">
            {(this.state.loading && (
                <EuiFlexItem>
                  <EuiLoadingChart className="loading-chart" size="xl" />
                </EuiFlexItem>
              )) || (
                <>
                  <EuiFlexItem className="agents-status-pie" grow={false}>
                    <EuiCard title description betaBadgeLabel="Status" className="eui-panel">
                      <EuiFlexGroup>
                        <EuiFlexItem className="align-items-center">
                          <VisualizationBasic
                            type='donut'
                            size={{ width: '100%', height: '150px' }}
                            showLegend
                            data={this.agentStatus.map(({status, label, color}) => ({
                              label,
                              value: this.state.agentStatusSummary[status] || 0,
                              color,
                              onClick: () => this.filterAgentByStatus(status)
                            }))}
                            noDataTitle='No results'
                            noDataMessage='No results were found.'
                          />
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </EuiCard>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false} className="agents-details-card">
                    <EuiCard title description betaBadgeLabel="Details">
                      <EuiFlexGroup className="group-details">
                        {this.agentStatus.map(({status, label, color}) => (
                          <EuiFlexItem key={`agent-details-status-${status}`}>
                            <EuiStat
                              title={
                                <EuiToolTip position="top" content={`Filter by agent status: ${status}`}>
                                  <span onClick={() => this.filterAgentByStatus(status)} style={{cursor: 'pointer'}}>
                                    {this.state.agentStatusSummary[status]}
                                  </span>
                                </EuiToolTip>
                              }
                              titleSize="s"
                              description={label}
                              titleColor={color}
                              className="white-space-nowrap"
                            />
                          </EuiFlexItem>
                        ))}
                        <EuiFlexItem>
                          <EuiStat
                            title={`${this.state.agentsActiveCoverage}%`}
                            titleSize='s'
                            description="Agents coverage"
                            className="white-space-nowrap"
                          />
                        </EuiFlexItem>
                      </EuiFlexGroup>
                      <EuiFlexGroup className="mt-0">
                        {this.state.lastRegisteredAgent && (
                          <EuiFlexItem className="agents-link-item">
                            <EuiStat
                              className="euiStatLink last-agents-link"
                              title={
                                <EuiToolTip position="top" content="View agent details">
                                  <a onClick={() => this.showAgent(this.state.lastRegisteredAgent)}>
                                    {this.state.lastRegisteredAgent.name}
                                  </a>
                                </EuiToolTip>
                              }
                              titleSize="s"
                              description="Last registered agent"
                              titleColor="primary"
                            />
                          </EuiFlexItem>
                        )}
                        {this.state.agentMostActive && (
                          <EuiFlexItem className="agents-link-item">
                            <EuiStat
                              className={this.state.agentMostActive.name ? 'euiStatLink' : ''}
                              title={
                                <EuiToolTip position="top" content="View agent details">
                                  <a onClick={() => this.showAgent(this.state.agentMostActive)}>
                                    {this.state.agentMostActive.name || '-'}
                                  </a>
                                </EuiToolTip>
                              }
                              className="last-agents-link"
                              titleSize="s"
                              description="Most active agent"
                              titleColor="primary"
                            />
                          </EuiFlexItem>
                        )}
                      </EuiFlexGroup>
                    </EuiCard>
                  </EuiFlexItem>
                </>
              )}
              {this.state.showAgentsEvolutionVisualization && (
                <EuiFlexItem
                  grow={false}
                  className="agents-evolution-visualization"
                  style={{
                    display: !this.state.loading ? 'block' : 'none',
                    margin: !this.state.loading ? '12px' : 0,
                  }}
                >
                  <EuiCard
                    title
                    description
                    paddingSize="none"
                    betaBadgeLabel="Evolution"
                    style={{ display: this.props.resultState !== 'loading' ? 'block' : 'none' }}
                  >
                    <EuiFlexGroup>
                      <EuiFlexItem>
                        <div style={{ height: this.props.resultState !== 'loading' ? '180px' : 0 }}>
                          <WzReduxProvider>
                            <KibanaVis
                              visID={'Wazuh-App-Overview-General-Agents-status'}
                              tab={'general'}
                            />
                          </WzReduxProvider>
                        </div>
                        {this.props.resultState === 'loading' && (
                          <div className="loading-chart-xl">
                            <EuiLoadingChart size="xl" />
                          </div>
                        )}
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiCard>
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
            <EuiSpacer size="m" />
            <WzReduxProvider>
              <AgentsTable
                filters={this.state.agentTableFilters}
                removeFilters={() => this.removeFilters()}
                wzReq={this.props.tableProps.wzReq}
                addingNewAgent={this.props.tableProps.addingNewAgent}
                downloadCsv={this.props.tableProps.downloadCsv}
                clickAction={this.props.tableProps.clickAction}
                formatUIDate={(date) => formatUIDate(date)}
                reload={() => this.fetchAgentStatusDetailsData()}
              />
            </WzReduxProvider>
          </EuiFlexItem>
        </EuiPage>
      );
    }
  }
);

AgentsTable.propTypes = {
  tableProps: PropTypes.object,
  showAgent: PropTypes.func,
};
