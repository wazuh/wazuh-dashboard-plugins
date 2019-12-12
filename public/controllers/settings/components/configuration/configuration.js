/*
 * Wazuh app - React component building the configuration component.
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
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonIcon,
  EuiToolTip,
  EuiPanel,
  EuiPage,
  EuiTitle,
  EuiText,
} from '@elastic/eui';
import { WzConfigurationTable } from './configuration-table';

export class WzConfigurationSettings extends Component {
  constructor(props) {
    super(props);

    this.state = {
      apiEntries: [],
      refreshingEntries: false,
    };
  }

  componentDidMount() {
    // this.setState({
    //   apiEntries: this.props.apiEntries
    // });
  }

  /**
   * Refresh the API entries
   */
  // async refresh() {
  //   try {
  //     let status = 'complete';
  //     this.setState({ error: false });
  //     const hosts = await this.props.getHosts();
  //     this.setState({
  //       refreshingEntries: true,
  //       apiEntries: hosts
  //     });
  //     const entries = this.state.apiEntries;
  //     let numErr = 0;
  //     for (let idx in entries) {
  //       const entry = entries[idx];
  //       try {
  //         const data = await this.props.testApi(entry);
  //         const clusterInfo = data.data || {};
  //         const id = entries[idx].id;
  //         entries[idx].status = 'online';
  //         entries[idx].cluster_info = clusterInfo;
  //         //Updates the cluster info in the registry
  //         await this.props.updateClusterInfoInRegistry(id, clusterInfo);
  //       } catch (error) {
  //         numErr = numErr + 1;
  //         const code = ((error || {}).data || {}).code;
  //         const downReason =
  //           ((error || {}).data || {}).message || 'Wazuh is not reachable';
  //         const status = code === 3099 ? 'down' : 'unknown';
  //         entries[idx].status = { status, downReason };
  //       }
  //     }
  //     if (numErr) {
  //       if (numErr >= entries.length) this.props.showApiIsDown();
  //     }
  //     this.setState({
  //       apiEntries: entries,
  //       status: status,
  //       refreshingEntries: false
  //     });
  //   } catch (error) {
  //     if (
  //       error &&
  //       error.data &&
  //       error.data.message &&
  //       error.data.code === 2001
  //     ) {
  //       this.props.showAddApiWithInitialError(error);
  //     }
  //   }
  // }

  /**
   * Checks the API connectivity
   * @param {Object} api
   */
  // async checkApi(api) {
  //   try {
  //     const entries = this.state.apiEntries;
  //     const idx = entries.map(e => e.id).indexOf(api.id);
  //     try {
  //       await this.props.checkManager(api);
  //       entries[idx].status = 'online';
  //     } catch (error) {
  //       const code = ((error || {}).data || {}).code;
  //       const downReason =
  //         ((error || {}).data || {}).message || 'Wazuh is not reachable';
  //       const status = code === 3099 ? 'down' : 'unknown';
  //       entries[idx].status = { status, downReason };
  //     }
  //     this.setState({
  //       apiEntries: entries
  //     });
  //   } catch (error) {
  //     console.error('Error checking manager connection ', error);
  //   }
  // }

  render() {
    return (
      <EuiPage>
        <EuiPanel paddingSize="l">
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiTitle>
                    <h2>
                      App current settings
                      <EuiToolTip position="right" content="More about configuration file">
                        <EuiButtonIcon
                          iconType="questionInCircle"
                          iconSize="l"
                          aria-label="Help"
                          target="_blank"
                          href="https://documentation.wazuh.com/current/user-manual/kibana-app/reference/config-file.html"
                        ></EuiButtonIcon>
                      </EuiToolTip>
                    </h2>
                  </EuiTitle>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiText color="subdued" style={{ paddingBottom: '15px' }}>
                Configuration file located at /usr/share/kibana/plugins/wazuh/wazuh.yml
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
          <WzConfigurationTable {...this.props} />
        </EuiPanel>
      </EuiPage>
    );
  }
}
