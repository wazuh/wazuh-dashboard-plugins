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

import { KibanaVis } from '../kibana-vis/kibana-vis';
import { EuiFlexGroup, EuiPanel, EuiFlexItem, EuiIcon } from '@elastic/eui';

export class WzVisualize extends Component {
  constructor(props) {
    super(props);
    this.visualizations = visualizations;
    this.state = {
      selectedTab: this.props.selectedTab,
      updateVis: this.props.updateVis,
    };
  }

  async componentDidUpdate() {
    const { selectedTab } = this.state;
    if (selectedTab !== this.props.selectedTab) {
      this.setState({ selectedTab: this.props.selectedTab });
    }
  }

  render() {
    const { selectedTab } = this.state;

    return (
      <div>
        {this.props.selectedTab !== 'welcome' &&
          this.visualizations[selectedTab].rows.map((row, i) => {
            return (
              <EuiFlexGroup key={i} style={{ height: row.height + 'px', width: '100%', margin: 0 }}>
                {row.vis.map((vis, j) => {
                  return !vis.hasRows ? (
                    <EuiFlexItem grow={vis.width ? vis.width : 10} key={j}>
                      <EuiPanel>
                        <EuiFlexGroup>
                          <span className="embPanel__header embPanel__title embPanel__dragger layout-row wz-headline-title">
                            {vis.title}
                          </span>
                          <span className="cursor-pointer wz-margin-8-no-left">
                            <EuiIcon type="expand"></EuiIcon>
                          </span>
                        </EuiFlexGroup>
                        <div style={{ height: '100%' }}>
                          <KibanaVis visID={vis.id} tab={selectedTab} {...this.props}></KibanaVis>
                        </div>
                      </EuiPanel>
                    </EuiFlexItem>
                  ) : null;
                })}
              </EuiFlexGroup>
            );
          })}
      </div>
    );
  }
}
