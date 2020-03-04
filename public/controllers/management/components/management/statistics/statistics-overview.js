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
  EuiPanel,
  EuiTitle,
  EuiPage,
  EuiText,
  EuiTabs,
  EuiTab,
  EuiSpacer,
  EuiSelect,
} from '@elastic/eui';
import { connect } from 'react-redux';
import { updateVis } from '../../../../../redux/actions/visualizationsActions'

import  KibanaVis  from '../../../../../kibana-integrations/kibana-vis';
import StatisticsHandler from './utils/statistics-handler'
import { clusterNodes } from '../configuration/utils/wz-fetch';
import { GenericRequest } from '../../../../../react-services/generic-request';
import { RawVisualizations } from '../../../../../factories/raw-visualizations';
import { DiscoverPendingUpdates } from '../../../../../factories/discover-pending-updates';

export class WzStatisticsOverview extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {
      selectedTabId: 'remoted',
      stats: {},
      isLoading: false,
      searchvalue: '',
      clusterNodeSelected: false,
      isSaveObjectReady: false,
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
    this.rawVisualizations = new RawVisualizations();
    this.discoverPendingUpdates = new DiscoverPendingUpdates();

    this.info = {
      remoted: 'Remoted statistics are cumulative, this means that the information shown is since the data exists.',
      analysisd: "Analysisd statistics refer to the data stored from the period indicated in the variable 'analysisd.state_interval'."
    };
  }
  
  async componentDidMount() {
    this._isMounted = true;
    this.discoverPendingUpdates.addItem(
      {query: "", language: "lucene"},
      [
        {
          "meta":{"removable":false,"index":"wazuh-statistics*","negate":false,"disabled":false,"alias":null,"type":"phrase","key":"cluster","params":{"query":"false"}},
          "query":{"match":{"cluster":{"query":"false","type":"phrase"}}},
          "$state":{"store":"appState"}
        }
      ]
    )
    const visData = await GenericRequest.request(
      'POST',
      `/elastic/visualizations/cluster-monitoring/wazuh-alerts-3.x-*`,
      {nodes: { items: [], name: 'node01' } }
    );

    await this.rawVisualizations.assignItems(visData.data.raw);
    try {
      const data = await clusterNodes();
      const nodes = data.data.data.items.map(item => {
        return { value: item.name, text: `${item.name} (${item.type})` }
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
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  onSelectedTabChanged = id => {
    this.setState({
      selectedTabId: id,
      searchvalue: ''
    });
  };

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
    this.setState({
      clusterNodeSelected: e.target.value
    });
  };

  render() {
    return (
      <EuiPage style={{ background: 'transparent' }}>
        <EuiPanel>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiTitle size="l"><p>Statistics</p></EuiTitle>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
            {!!(this.state.clusterNodes && this.state.clusterNodes.length && this.state.clusterNodeSelected) && (
              <EuiFlexItem grow={false} >
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
              <EuiTabs>{
                this.renderTabs()
              }</EuiTabs>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size={'m'} />
          <EuiFlexGroup style={{ minHeight: 250 }}>
            <EuiFlexItem>
              <EuiTitle size="s"><p>Received Bytes</p></EuiTitle>
              <KibanaVis visID={'Wazuh-App-Statistics-remoted-Recv-bytes'} tab={'statistics'} updateRootScope={()=>{}} ></KibanaVis>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiTitle size="s"><p>Event count</p></EuiTitle>
              <KibanaVis visID={'Wazuh-App-Statistics-remoted-event-count'} tab={'statistics'} updateRootScope={()=>{}} ></KibanaVis>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup style={{ minHeight: 250 }}>
            <EuiFlexItem>
              <EuiTitle size="s"><p>Message stats</p></EuiTitle>
              <KibanaVis visID={'Wazuh-App-Statistics-remoted-messages'} tab={'statistics'} updateRootScope={()=>{}} ></KibanaVis>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiTitle size="s"><p>TCP Sessions</p></EuiTitle>
              <KibanaVis visID={'Wazuh-App-Statistics-remoted-tcp-sessions'} tab={'statistics'} updateRootScope={()=>{}} ></KibanaVis>
            </EuiFlexItem>
          </EuiFlexGroup>

        </EuiPanel>
      </EuiPage>
    );
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    updateVis: update => dispatch(updateVis(update)),
  };
};

export default connect(null, mapDispatchToProps)(WzStatisticsOverview);