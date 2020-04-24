/*
 * Wazuh app - React component for building the reporting view
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
import {
  EuiFlexItem,
  EuiFlexGroup,
  EuiButtonEmpty,
  EuiInMemoryTable,
  EuiPanel,
  EuiTitle,
  EuiPage,
  EuiText,
  EuiCallOut,
  EuiTabs,
  EuiTab,
  EuiSpacer,
  EuiSelect,
  EuiProgress
} from '@elastic/eui';

import StatisticsHandler from './utils/statistics-handler';
import { clusterNodes } from '../configuration/utils/wz-fetch';

export class WzStatisticsOverview extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {
      selectedTabId: 'remoted',
      stats: {},
      isLoading: false,
      searchvalue: '',
      clusterNodeSelected: false
    };
    this.statisticsHandler = StatisticsHandler;
    this.tabs = [
      {
        id: 'remoted',
        name: 'remoted'
      },
      {
        id: 'analysisd',
        name: 'analysisd'
      }
    ];

    this.info = {
      remoted:
        'Remoted statistics are cumulative, this means that the information shown is since the data exists.',
      analysisd:
        "Analysisd statistics refer to the data stored from the period indicated in the variable 'analysisd.state_interval'."
    };
  }

  async componentDidMount() {
    this._isMounted = true;
    try {
      const data = await clusterNodes();
      const nodes = data.data.data.items.map(item => {
        return { value: item.name, text: `${item.name} (${item.type})` };
      });
      this.setState({
        clusterNodes: nodes,
        clusterNodeSelected: nodes[0].value
      });
    } catch (err) {
      this.setState({
        clusterNodes: [],
        clusterNodeSelected: false
      });
    }
    this.fetchData();
  }

  componentDidUpdate() {}

  componentWillUnmount() {
    this._isMounted = false;
  }

  onSelectedTabChanged = id => {
    this.setState(
      {
        selectedTabId: id,
        searchvalue: ''
      },
      () => {
        this.fetchData();
      }
    );
  };

  async fetchData() {
    this.setState({
      isLoading: true
    });
    const data = await this.statisticsHandler.demonStatistics(
      this.state.selectedTabId,
      this.state.clusterNodeSelected
    );
    this.setState({
      stats: data.data.data,
      isLoading: false
    });
  }

  renderTabs() {
    return this.tabs.map((tab, index) => (
      <EuiTab
        onClick={() => this.onSelectedTabChanged(tab.id)}
        isSelected={tab.id === this.state.selectedTabId}
        key={index}
      >
        {tab.name}
      </EuiTab>
    ));
  }

  onSelectNode = e => {
    this.setState(
      {
        clusterNodeSelected: e.target.value
      },
      () => {
        this.fetchData();
      }
    );
  };

  render() {
    const refreshButton = (
      <EuiButtonEmpty
        iconType="refresh"
        onClick={async () => await this.fetchData()}
      >
        Refresh
      </EuiButtonEmpty>
    );
    const search = {
      box: {
        incremental: true,
        schema: true
      }
    };
    return (
      <EuiPage style={{ background: 'transparent' }}>
        <EuiPanel>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiTitle>
                    <h2>Statistics</h2>
                  </EuiTitle>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>{refreshButton}</EuiFlexItem>
            {!!(
              this.state.clusterNodes &&
              this.state.clusterNodes.length &&
              this.state.clusterNodeSelected
            ) && (
              <EuiFlexItem grow={false}>
                <EuiSelect
                  id="selectNode"
                  options={this.state.clusterNodes}
                  value={this.state.clusterNodeSelected}
                  onChange={this.onSelectNode}
                  aria-label="Select node"
                />
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiText color="subdued">
                From here you can see daemon statistics.
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiTabs>{this.renderTabs()}</EuiTabs>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size={'m'} />
          {this.state.isLoading && <EuiProgress size="xs" color="primary" />}
          {!!(
            (Object.entries(this.state.stats) || []).length &&
            !this.state.isLoading
          ) && (
            <div>
              <EuiCallOut
                title={this.info[this.state.selectedTabId]}
                iconType="iInCircle"
              />
              <EuiSpacer size={'m'} />
              <EuiInMemoryTable
                items={Object.entries(this.state.stats)}
                columns={[
                  {
                    field: '0',
                    name: 'Indicator'
                  },
                  {
                    field: '1',
                    name: 'Value'
                  }
                ]}
                pagination={true}
                search={search}
              />
            </div>
          )}
        </EuiPanel>
      </EuiPage>
    );
  }
}

export default WzStatisticsOverview;
