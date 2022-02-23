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
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiStat,
  EuiLoadingChart,
  EuiSpacer,
  EuiEmptyPrompt,
  EuiToolTip,
  EuiCard,
} from '@elastic/eui';
import { Pie } from '../../../components/d3/pie';
import { ProgressChart } from '../../../components/d3/progress';
import { AgentsTable } from './agents-table';
import { WzRequest } from '../../../react-services/wz-request';
import KibanaVis from '../../../kibana-integrations/kibana-vis';
import WzReduxProvider from '../../../redux/wz-redux-provider';
import { VisFactoryHandler } from '../../../react-services/vis-factory-handler';
import { AppState } from '../../../react-services/app-state';
import { FilterHandler } from '../../../utils/filter-handler';
import { TabVisualizations } from '../../../factories/tab-visualizations';
import { WazuhConfig } from './../../../react-services/wazuh-config.js';
import { WzDatePicker } from '../../../components/wz-date-picker/wz-date-picker';
import {
  withReduxProvider,
  withGlobalBreadcrumb,
  withUserAuthorizationPrompt,
} from '../../../components/common/hocs';
import { formatUIDate } from '../../../../public/react-services/time-service';
import { compose } from 'redux';
import { withErrorBoundary } from '../../../components/common/hocs';
import './agents-preview.scss';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';

const FILTER_ACTIVE = 'active';
const FILTER_DISCONNECTED = 'disconnected';
const FILTER_NEVER_CONNECTED = 'never_connected';

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
        data: [],
        loading: false,
        showAgentsEvolutionVisualization: false,
        agentTableFilters: [],
      };
      this.wazuhConfig = new WazuhConfig();
      this.agentStatusLabelToIDMap = {
        Active: 'active',
        Disconnected: 'disconnected',
        'Never connected': 'never_connected',
      };
    }

    async componentDidMount() {
      this._isMount = true;
      this.getSummary();
      if (this.wazuhConfig.getConfig()['wazuh.monitoring.enabled']) {
        this._isMount && this.setState({ showAgentsEvolutionVisualization: true });
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

    agentStatusLabelToID(label) {
      return this.agentStatusLabelToIDMap[label];
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
        this.setState({ loading: true });
        const summaryData = await WzRequest.apiReq('GET', '/agents/summary/status', {});
        this.summary = summaryData.data.data;
        this.totalAgents = this.summary.total;
        const model = [
          { id: 'active', label: 'Active', value: this.summary['active'] || 0 },
          { id: 'disconnected', label: 'Disconnected', value: this.summary['disconnected'] || 0 },
          {
            id: 'neverConnected',
            label: 'Never connected',
            value: this.summary['never_connected'] || 0,
          },
        ];
        this.setState({ data: model });
        this.agentsCoverity = this.totalAgents
          ? ((this.summary['active'] || 0) / this.totalAgents) * 100
          : 0;
        const lastAgent = await WzRequest.apiReq('GET', '/agents', {
          params: { limit: 1, sort: '-dateAdd', q: 'id!=000' },
        });
        this.lastAgent = lastAgent.data.data.affected_items[0];
        this.mostActiveAgent = await this.props.tableProps.getMostActive();
        const osresult = await WzRequest.apiReq('GET', '/agents/summary/os', {});
        this.platforms = this.groupBy(osresult.data.data.affected_items);
        const platformsModel = [];
        for (let [key, value] of Object.entries(this.platforms)) {
          platformsModel.push({ id: key, label: key, value: value });
        }
        this._isMount && this.setState({ platforms: platformsModel, loading: false });
      } catch (error) {
        const options = {
          context: `${AgentsPreview.name}.getSummary`,
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

    showLastAgent() {
      this.props.tableProps.showAgent(this.lastAgent);
    }

    showMostActiveAgent() {
      this.mostActiveAgent.name ? this.props.tableProps.showAgent(this.mostActiveAgent) : '';
    }

    showAgentsWithFilters(filter) {
      this._isMount &&
        this.setState({
          agentTableFilters: [{ field: 'q', value: `status=${filter}` }],
        });
    }

    render() {
      const colors = ['#017D73', '#bd271e', '#69707D'];
      return (
        <EuiPage className="flex-column">
          <EuiFlexItem>
            <EuiFlexGroup className="agents-evolution-visualization-group mt-0">
              {(this.state.loading && (
                <EuiFlexItem>
                  <EuiLoadingChart className="loading-chart" size="xl" />
                </EuiFlexItem>
              )) || (
                <Fragment>
                  <EuiFlexItem className="agents-status-pie" grow={false}>
                    <EuiCard title description betaBadgeLabel="Status" className="eui-panel">
                      <EuiFlexGroup>
                        {this.totalAgents > 0 && (
                          <EuiFlexItem className="align-items-center">
                            <Pie
                              legendAction={(status) =>
                                this._isMount &&
                                this.setState({
                                  agentTableFilters: [
                                    {
                                      field: 'q',
                                      value: `status=${this.agentStatusLabelToID(status)}`,
                                    },
                                  ],
                                })
                              }
                              width={300}
                              height={150}
                              data={this.state.data}
                              colors={colors}
                            />
                          </EuiFlexItem>
                        )}
                      </EuiFlexGroup>
                    </EuiCard>
                  </EuiFlexItem>
                  {this.totalAgents > 0 && (
                    <EuiFlexItem grow={false} className="agents-details-card">
                      <EuiCard title description betaBadgeLabel="Details">
                        {this.summary && (
                          <EuiFlexGroup className="group-details">
                            <EuiFlexItem>
                              <EuiStat
                                title={
                                  <EuiToolTip position="top" content="Show active agents">
                                    <a onClick={() => this.showAgentsWithFilters(FILTER_ACTIVE)}>
                                      {this.state.data[0].value}
                                    </a>
                                  </EuiToolTip>
                                }
                                titleSize={'s'}
                                description="Active"
                                titleColor="secondary"
                                className="white-space-nowrap"
                              />
                            </EuiFlexItem>
                            <EuiFlexItem>
                              <EuiStat
                                title={
                                  <EuiToolTip position="top" content="Show disconnected agents">
                                    <a
                                      onClick={() =>
                                        this.showAgentsWithFilters(FILTER_DISCONNECTED)
                                      }
                                    >
                                      {this.state.data[1].value}
                                    </a>
                                  </EuiToolTip>
                                }
                                titleSize={'s'}
                                description="Disconnected"
                                titleColor="danger"
                                className="white-space-nowrap"
                              />
                            </EuiFlexItem>
                            <EuiFlexItem>
                              <EuiStat
                                title={
                                  <EuiToolTip position="top" content="Show never connected agents">
                                    <a
                                      onClick={() =>
                                        this.showAgentsWithFilters(FILTER_NEVER_CONNECTED)
                                      }
                                    >
                                      {this.state.data[2].value}
                                    </a>
                                  </EuiToolTip>
                                }
                                titleSize={'s'}
                                description="Never connected"
                                titleColor="subdued"
                                className="white-space-nowrap"
                              />
                            </EuiFlexItem>
                            <EuiFlexItem>
                              <EuiStat
                                title={`${this.agentsCoverity.toFixed(2)}%`}
                                titleSize={'s'}
                                description="Agents coverage"
                                className="white-space-nowrap"
                              />
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        )}
                        <EuiFlexGroup className="mt-0">
                          {this.lastAgent && (
                            <EuiFlexItem className="flex-45">
                              <EuiStat
                                className="euiStatLink last-agents-link"
                                title={
                                  <EuiToolTip position="top" content="View agent details">
                                    <a onClick={() => this.showLastAgent()}>
                                      {this.lastAgent.name}
                                    </a>
                                  </EuiToolTip>
                                }
                                titleSize="s"
                                description="Last registered agent"
                                titleColor="primary"
                              />
                            </EuiFlexItem>
                          )}
                          {this.mostActiveAgent && (
                            <EuiFlexItem className="flex-45">
                              <EuiStat
                                className={this.mostActiveAgent.name ? 'euiStatLink' : ''}
                                title={
                                  <EuiToolTip position="top" content="View agent details">
                                    <a onClick={() => this.showMostActiveAgent()}>
                                      {this.mostActiveAgent.name || '-'}
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
                  )}
                </Fragment>
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
                    style={{ display: this.props.resultState === 'ready' ? 'block' : 'none' }}
                  >
                    <EuiFlexGroup>
                      <EuiFlexItem>
                        <div style={{ height: this.props.resultState === 'ready' ? '180px' : 0 }}>
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
                  <EuiCard
                    title
                    description
                    paddingSize="none"
                    betaBadgeLabel="Evolution"
                    style={{
                      height: 193,
                      display: this.props.resultState === 'none' ? 'block' : 'none',
                    }}
                  >
                    <EuiEmptyPrompt
                      className="wz-padding-21"
                      iconType="alert"
                      titleSize="xs"
                      title={<h3>No results found in the selected time range</h3>}
                      actions={<WzDatePicker condensed={true} onTimeChange={() => {}} />}
                    />
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
                reload={() => this.getSummary()}
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
