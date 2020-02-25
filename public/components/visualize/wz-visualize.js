/*
 * Wazuh app - React component for Visualize.
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

import { visualizations } from './visualizations';
import { KibanaVis } from '../../kibana-integrations/kibana-vis';
import { EuiFlexGroup, EuiPanel, EuiFlexItem, EuiButtonIcon } from '@elastic/eui';
import { RequirementCard } from '../../controllers/overview/components/requirement-card'
import AlertsStats from '../../controllers/overview/components/alerts-stats'
import WzReduxProvider from '../../redux/wz-redux-provider';

export class WzVisualize extends Component {
  constructor(props) {
    super(props);
    this.visualizations = visualizations;
    this.state = {
      selectedTab: this.props.selectedTab,
      expandedVis: false,
      updateVis: this.props.updateVis,
      cardReqs: {},
      metricItems: this.props.selectedTab !== 'welcome'
        ? this.getMetricItems(this.props.selectedTab)
        : []
    };
    this.metricValues = false;
  }

  async componentDidUpdate() {
    const { selectedTab } = this.state;
    if (selectedTab !== this.props.selectedTab) {
      this.setState({
        selectedTab: this.props.selectedTab,
        metricItems: this.props.selectedTab !== 'welcome'
          ? this.getMetricItems(this.props.selectedTab)
          : []
      });
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.cardReqs) {
      this.setState({
        cardReqs: nextProps.cardReqs
      });
    }
  }

  getMetricItems(tab) {
    const items = [];
    if (this.visualizations[tab].metrics) {
      this.visualizations[tab].metrics.forEach(
        x => { items.push({ id: x.id, description: x.description, color: x.color }) }
      );
    }
    return {
      items
    }
  }

  expand = (id) => {
    this.setState({ expandedVis: this.state.expandedVis === id ? false : id });
  }

  render() {
    const { selectedTab, cardReqs } = this.state;
    const renderVisualizations = (vis) => {
      return (
        <EuiFlexItem grow={vis.width || 10} key={vis.id}>
          <EuiPanel paddingSize="none">
            <EuiFlexItem className={this.state.expandedVis === vis.id ? 'fullscreen h-100' : 'h-100'}>
              <EuiFlexGroup style={{ padding: '12px 12px 0px' }} className="embPanel__header">
                <h2 className="embPanel__title wz-headline-title">
                  {vis.title}
                </h2>
                <EuiButtonIcon
                  color='text'
                  style={{ padding: '0px 6px', height: 30 }}
                  onClick={() => this.expand(vis.id)}
                  iconType="expand"
                  aria-label="Expand"
                />
              </EuiFlexGroup>
              <div style={{ height: '100%' }}>
                <KibanaVis visID={vis.id} tab={selectedTab} type={false} {...this.props}></KibanaVis>
              </div>
            </EuiFlexItem>
          </EuiPanel>
        </EuiFlexItem>);
    }

    const renderVisualizationRow = (rows, width, idx) => {
      return (
        <EuiFlexItem grow={width || 10} key={idx}>
          {rows.map((visRow, j) => {
            return (
              <EuiFlexGroup key={j} style={{ height: visRow.height + 'px' }}>
                {visRow.vis.map((visualizeRow) => {
                  return (renderVisualizations(visualizeRow))
                })}
              </EuiFlexGroup>)
          })}
        </EuiFlexItem>
      )
    }

    return (
      <EuiFlexItem>
        {(selectedTab && selectedTab !== 'welcome' && this.visualizations[selectedTab].metrics) &&
          <div className="wz-no-display">
            {this.visualizations[selectedTab].metrics.map((vis, i) => {
              return (
                <div key={i}>
                  <KibanaVis visID={vis.id} tab={selectedTab} isMetric={true} {...this.props}></KibanaVis>
                </div>
              )
            })}
          </div>
        }

        {/* Metrics of Dashboard */}
        {(selectedTab && selectedTab !== 'welcome' && this.visualizations[selectedTab].metrics && this.state.metricItems) &&
          <div className="md-padding-top-10">
            <WzReduxProvider>
              <AlertsStats {...this.state.metricItems} tab={selectedTab} />
            </WzReduxProvider>
          </div>
        }

        {/* Cards for Regulatory Compliance Dashboards */}
        {(cardReqs && cardReqs.items) &&
          <div style={{ padding: '10px 12px 8px' }}>
            <RequirementCard {...cardReqs} />
          </div>
        }

        {selectedTab && selectedTab !== 'welcome' &&
          this.visualizations[selectedTab].rows.map((row, i) => {
            return (
              <EuiFlexGroup key={i} style={{ height: row.height + 'px', margin: 0 }}>
                {row.vis.map((vis, n) => {
                  return !vis.hasRows ? (
                    renderVisualizations(vis)
                  ) : renderVisualizationRow(vis.rows, vis.width, n);
                })}
              </EuiFlexGroup>
            );
          })}
      </EuiFlexItem>
    );
  }
}
