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
import { clusterNodes } from '../configuration/utils/wz-fetch';
import { GenericRequest } from '../../../../../react-services/generic-request';
import { RawVisualizations } from '../../../../../factories/raw-visualizations';
import { DiscoverPendingUpdates } from '../../../../../factories/discover-pending-updates';

class WzStatisticsOverview extends Component {
  _isMounted = false;
  info = {
    remoted: `Remoted statistics are cumulative, this means that the
     information shown is since the data exists.`,
    analysisd: `Analysisd statistics refer to the data stored from the
     period indicated in the variable 'analysisd.state_interval'.`
  };
  tabs = ['remoted', 'analysisd'].map(item => {return {id: item, name: item}})

  constructor(props) {
    super(props);
    this.state = {
      selectedTabId: 'remoted',
      stats: {},
      searchvalue: '',
      clusterNodeSelected: false,
    };
    this.rawVisualizations = new RawVisualizations();
    this.discoverPendingUpdates = new DiscoverPendingUpdates();
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
    );
    GenericRequest.request(
      'POST',
      `/elastic/visualizations/cluster-monitoring/wazuh-alerts-3.x-*`,
      {nodes: { items: [], name: 'node01' } })
      .then(visData => this.rawVisualizations.assignItems(visData.data.raw));
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
      searchvalue: '',
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

  renderVisualization(visID, title) {
    return (
      <EuiFlexItem>
        <EuiTitle size="s"><p>{title}</p></EuiTitle>
        <KibanaVis 
          visID={visID} 
          tab={'statistics'} 
          updateRootScope={() => {}} >
        </KibanaVis>
      </EuiFlexItem>
    );
  }

  renderRemotedVisualizations() {
    return (<div>
      <EuiFlexGroup style={{ minHeight: 250 }}>
        {this.renderVisualization('Wazuh-App-Statistics-remoted-queue-size', 'Queue')}
      </EuiFlexGroup>
      <EuiFlexGroup style={{ minHeight: 250 }}>
          {this.renderVisualization('Wazuh-App-Statistics-remoted-Recv-bytes', 'Received Bytes')}
          {this.renderVisualization('Wazuh-App-Statistics-remoted-event-count', 'Event count')}
      </EuiFlexGroup>
      <EuiFlexGroup style={{ minHeight: 250 }}>
          {this.renderVisualization('Wazuh-App-Statistics-remoted-messages' , 'Message stats')}
          {this.renderVisualization('Wazuh-App-Statistics-remoted-tcp-sessions', 'TCP Sessions')}
      </EuiFlexGroup>
    </div>
    );
  }

  renderAnalisysdVisualizations() {

  }

  render() {
    const { clusterNodes, clusterNodeSelected, selectedTabId } = this.state;
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
            {!!(clusterNodes && clusterNodes.length && clusterNodeSelected) && (
              <EuiFlexItem grow={false} >
                <EuiSelect
                  id="selectNode"
                  options={clusterNodes}
                  value={clusterNodeSelected}
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
          { selectedTabId === 'remoted' && this.renderRemotedVisualizations() }
          { selectedTabId === 'analysisd' && this.renderAnalisysdVisualizations() }
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