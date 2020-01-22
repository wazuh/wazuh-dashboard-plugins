/*
 * Wazuh app - React component for building the agents preview section.
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
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
  EuiPage,
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiStat,
  EuiLoadingChart,
  EuiSpacer
} from '@elastic/eui';
import { Pie } from "../../../components/d3/pie";
import { ProgressChart } from "../../../components/d3/progress";
import { AgentsTable } from './agents-table'

export class AgentsPreview extends Component {

  constructor(props) {
    super(props);
    this.state = { data: [], loading: false }
  }

  componentDidMount() {
    this.getSummary();
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
      const summaryData = await this.props.tableProps.wzReq('GET', '/agents/summary', {});
      this.summary = summaryData.data.data;
      this.totalAgents = this.summary.Total - 1;
      const model = [
        { id: 'active', label: "Active", value: (this.summary['Active'] || 1) - 1 },
        { id: 'disconnected', label: "Disconnected", value: this.summary['Disconnected'] || 0 },
        { id: 'neverConnected', label: "Never connected", value: this.summary['Never connected'] || 0 }
      ];
      this.setState({ data: model });

      this.agentsCoverity = this.totalAgents ? (((this.summary['Active'] || 1) - 1) / this.totalAgents) * 100 : 0;

      const lastAgent = await this.props.tableProps.wzReq('GET', '/agents', { limit: 1, sort: '-dateAdd', q: 'id!=000' });
      this.lastAgent = lastAgent.data.data.items[0];
      this.mostActiveAgent = await this.props.tableProps.getMostActive();

      const osresult = await this.props.tableProps.wzReq('GET', '/agents/summary/os', { q: 'id!=000' });
      this.platforms = this.groupBy(osresult.data.data.items);
      const platformsModel = [];
      for (let [key, value] of Object.entries(this.platforms)) {
        platformsModel.push({ id: key, label: key, value: value })
      }
      this.setState({ platforms: platformsModel, loading: false });
    } catch (error) { }
  }

  render() {
    const colors = ["#017D73", "#bd271e", "#69707D"];
    return (
      <EuiPage>
        <EuiFlexItem>
          <EuiFlexGroup style={{ 'marginTop': 0 }}>
            <EuiFlexItem>
              <EuiPanel betaBadgeLabel="Global status" style={{ paddingBottom: 0, minHeight: 158 }}>
                {(this.state.loading &&
                  <EuiFlexItem>
                    <EuiLoadingChart style={{ margin: '40px auto' }} size="xl" />
                  </EuiFlexItem>
                )}
                {(!this.state.loading &&
                  <EuiFlexGroup>
                    {(this.totalAgents > 0 &&
                      <EuiFlexItem style={{ alignItems: 'center' }} >
                        <Pie width={250} height={125} data={this.state.data} colors={colors} />
                      </EuiFlexItem>
                    )}
                    {(this.summary &&
                      <EuiFlexItem style={{ padding: '10px 0px' }}>
                        <EuiFlexGroup>
                          <EuiFlexItem>
                            <EuiStat
                              title={this.totalAgents}
                              textAlign="center"
                              description="Total agents"
                              titleColor="primary"
                            />
                          </EuiFlexItem>
                          <EuiFlexItem>
                            <EuiStat
                              title={this.state.data[0].value}
                              textAlign="center"
                              description="Active"
                              titleColor="secondary"
                            />
                          </EuiFlexItem>
                        </EuiFlexGroup>
                        <EuiFlexGroup>
                          <EuiFlexItem>
                            <EuiStat
                              title={this.state.data[1].value}
                              textAlign="center"
                              description="Disconnected"
                              titleColor="danger"
                            />
                          </EuiFlexItem>
                          <EuiFlexItem>
                            <EuiStat
                              title={this.state.data[2].value}
                              textAlign="center"
                              description="Never connected"
                              titleColor="subdued"
                            />
                          </EuiFlexItem>
                        </EuiFlexGroup>
                      </EuiFlexItem>
                    )}
                  </EuiFlexGroup>
                )}
              </EuiPanel>
            </EuiFlexItem>
            {((this.totalAgents > 0 && !this.state.loading) &&
              <EuiFlexItem grow={false} style={{ margin: "12px 0px" }}>
                <EuiPanel betaBadgeLabel="Coverage" style={{ paddingBottom: 0 }}>
                  <EuiFlexGroup>
                    <EuiFlexItem grow={false} style={{ alignItems: 'center' }} >
                      <ProgressChart width={125} height={125} percent={this.agentsCoverity} />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiPanel>
              </EuiFlexItem>
            )}
            {((this.totalAgents > 0 && !this.state.loading) &&
              <EuiFlexItem>
                <EuiPanel betaBadgeLabel="Stats" style={{ paddingBottom: 0 }}>
                  <EuiFlexGroup>
                    <EuiFlexItem>
                      {(this.lastAgent &&
                        <EuiFlexGroup style={{ marginTop: 0 }}>
                          <EuiFlexItem>
                            <EuiStat
                              className='euiStatLink'
                              title={this.lastAgent.name}
                              titleSize="s"
                              textAlign="center"
                              description="Last registered agent"
                              titleColor="primary"
                              style={{ paddingBottom: 12 }}
                              onClick={() => this.props.tableProps.showAgent(this.lastAgent)}
                            />
                          </EuiFlexItem>
                        </EuiFlexGroup>
                      )}
                      {(this.mostActiveAgent &&
                        <EuiFlexGroup>
                          <EuiFlexItem>
                            <EuiStat
                              className={this.mostActiveAgent.name ? 'euiStatLink' : ''}
                              title={this.mostActiveAgent.name || '-'}
                              titleSize="s"
                              textAlign="center"
                              description="Most active agent"
                              titleColor="primary"
                              onClick={() => this.mostActiveAgent.name ? this.props.tableProps.showAgent(this.mostActiveAgent) : ''}
                            />
                          </EuiFlexItem>
                        </EuiFlexGroup>
                      )}
                    </EuiFlexItem>
                    <EuiFlexItem style={{ alignItems: 'center' }}>
                      <Pie width={250} height={125} data={this.state.platforms} colors={null} />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiPanel>
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
          <EuiSpacer size="m" />
          <div>
            <AgentsTable
              wzReq={this.props.tableProps.wzReq}
              addingNewAgent={this.props.tableProps.addingNewAgent}
              downloadCsv={this.props.tableProps.downloadCsv}
              clickAction={this.props.tableProps.clickAction}
              timeService={this.props.tableProps.timeService}
              reload={() => this.getSummary()}
            />
          </div>
        </EuiFlexItem>
      </EuiPage>
    );
  }
}

AgentsTable.propTypes = {
  tableProps: PropTypes.object,
  showAgent: PropTypes.func
};