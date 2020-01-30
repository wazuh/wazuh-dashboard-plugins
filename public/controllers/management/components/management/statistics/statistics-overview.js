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
import { EuiFlexItem, EuiFlexGroup, EuiFlexGrid, EuiButtonEmpty, EuiPanel, EuiTitle, EuiPage, EuiText, EuiTabs, EuiTab, EuiStat, EuiSpacer, EuiProgress, EuiFieldSearch } from '@elastic/eui';

import StatisticsHandler from './utils/statistics-handler'

export class WzStatisticsOverview extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {
      selectedTabId: 'remoted',
      stats: {},
      isLoading: false,
      searchvalue: ''
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
      },
    ];
  }

  componentDidMount() {
    this._isMounted = true;
    this.fetchData();
  }

  componentDidUpdate() { }

  componentWillUnmount() {
    this._isMounted = false;
  }

  onSelectedTabChanged = id => {
    this.setState({
      selectedTabId: id,
      searchvalue: ''
    }, () => {
      this.fetchData();
    });
  };

  async fetchData() {
    this.setState({
      isLoading: true,
    });
    const data = await this.statisticsHandler.demonStatistics(this.state.selectedTabId);
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

  onChangeSearchValue = e => {
    this.setState({
      searchvalue: e.target.value,
    });
  };

  render() {
    const refreshButton = (
      <EuiButtonEmpty iconType="refresh" onClick={async () => await this.fetchData()}>
        Refresh
      </EuiButtonEmpty>
    );
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
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiText color="subdued" style={{ paddingBottom: '15px' }}>
                From here you can see demon statistics.
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiTabs>{
                this.renderTabs()
              }</EuiTabs>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size={'m'} />
          {this.state.isLoading &&
            <EuiProgress size="xs" color="primary" />
          }
          {((Object.entries(this.state.stats) || []).length && !this.state.isLoading) && (
            <div>
              <EuiFieldSearch
                placeholder="Search values"
                value={this.state.searchvalue}
                fullWidth={true}
                onChange={this.onChangeSearchValue}
                aria-label=""
              />
              <EuiSpacer size={'xl'} />
              <EuiFlexGrid columns={4}>
                {(Object.entries(this.state.stats) || []).filter(([value]) => value.includes(this.state.searchvalue)).map(([key, value]) => (
                  <EuiFlexItem key={key}>
                    <EuiStat
                      title={value}
                      titleSize="s"
                      description={key}
                      textAlign="center"
                    />
                  </EuiFlexItem>
                ))}
              </EuiFlexGrid>
            </div>
          )}
        </EuiPanel>
      </EuiPage>
    );
  }
}

export default WzStatisticsOverview;
