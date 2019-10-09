/*
 * Wazuh app - React component building the API entries table.
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
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiInMemoryTable,
  EuiButtonIcon,
  EuiToolTip,
  EuiHealth,
  EuiPanel,
  EuiButtonEmpty,
  EuiTitle,
  EuiText,
  EuiLoadingSpinner,

} from '@elastic/eui';

export class ApiTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      apiEntries: [],
      refreshingEntries: false
    };
  }

  componentDidMount() {
    this.setState({
      apiEntries: this.props.apiEntries
    });
  }


 /**
 * Refresh the API entries
 */
  async refresh() {
    try {
      let status = 'complete';
      this.setState({ error: false });
      const hosts = await this.props.getHosts();
      this.setState({
        refreshingEntries: true,
        apiEntries: hosts
      });
      const entries = this.state.apiEntries;
      let numErr = 0;
      for (let idx in entries) {
        const entry = entries[idx];
        try {
          const data = await this.props.testApi(entry);
          const clusterInfo = data.data || {};
          const id = entries[idx].id;;
          entries[idx].status = 'online';
          entries[idx].cluster_info = clusterInfo;
          //Updates the cluster info in the registry
          await this.props.updateClusterInfoInRegistry(id, clusterInfo);
        } catch (error) {
          numErr = numErr + 1;
          const code = ((error || {}).data || {}).code;
          const status = code === 3099 ? 'down' : 'unknown';
          entries[idx].status = status;
        }
      }
      if (numErr) {
        if (numErr >= entries.length) this.props.showApiIsDown();
      }
      this.setState({
        apiEntries: entries,
        status: status,
        refreshingEntries: false
      });
    } catch (error) {
      if (error && error.data && error.data.message && error.data.code === 2001) {
        this.props.showAddApiWithInitialError(error);
      }
    }
  }

  /**
   * Checks the API connectivity
   * @param {Object} api 
   */
  async checkApi(api) {
    try {
      const entries = this.state.apiEntries;
      const idx = entries.map(e => e.id).indexOf(api.id);
      try {
        await this.props.checkManager(api);
        entries[idx].status = 'online';
      } catch (error) {
        const code = ((error || {}).data || {}).code;
        const status = code === 3099 ? 'down' : 'unknown';
        entries[idx].status = status
      }
      this.setState({
        apiEntries: entries
      });
    } catch (error) {
      console.error('Error checking manager connection ', error);
    }
  }

  render() {
    const items = [...this.state.apiEntries];
    const columns = [
      {
        field: 'id',
        name: 'ID',
        align: 'left',
        sortable: true,
      },
      {
        field: 'cluster_info.cluster',
        name: 'Cluster',
        align: 'left',
        sortable: true,
      },
      {
        field: 'cluster_info.manager',
        name: 'Manager',
        align: 'left',
        sortable: true,
      },
      {
        field: 'url',
        name: 'Host',
        align: 'left',
        sortable: true,
      },
      {
        field: 'port',
        name: 'Port',
        align: 'left',
        sortable: true,
      },
      {
        field: 'user',
        name: 'User',
        align: 'left',
        sortable: true,
      },
      {
        field: 'status',
        name: 'Status',
        align: 'left',
        sortable: true,
        render: item => {
          if (item) {
            return item === 'online' ? (
              <EuiHealth color="success">Online</EuiHealth>
            ) : item === 'down' ? (
              <EuiHealth color="warning">Warning</EuiHealth>
            ) : (
                  <EuiHealth color="danger">Offline</EuiHealth>
                );
          } else {
            return (<span><EuiLoadingSpinner size="s" /><span>&nbsp;&nbsp;Checking</span></span>);
          }

        }
      },
      {
        name: 'Actions',
        render: item => (
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiToolTip position="bottom" content={<p>Set as default</p>}>
                <EuiButtonIcon
                  iconType={
                    item.id === this.props.currentDefault
                      ? 'starFilled'
                      : 'starEmpty'
                  }
                  aria-label="Set as default"
                  onClick={async () => {
                    const currentDefault = await this.props.setDefault(item);
                    this.setState({
                      currentDefault
                    });
                  }}
                />
              </EuiToolTip>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiToolTip position="bottom" content={<p>Check connection</p>}>
                <EuiButtonIcon
                  aria-label="Check connection"
                  iconType="refresh"
                  onClick={async () => await this.checkApi(item)}
                  color="success"
                />
              </EuiToolTip>
            </EuiFlexItem>
          </EuiFlexGroup>
        )
      }
    ];

    const search = {
      box: {
        incremental: this.state.incremental,
        schema: true,
      }
    };

    return (
      <EuiPanel paddingSize="l">
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiTitle>
                  <h2>Wazuh hosts</h2>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              iconType="plusInCircle"
              onClick={() => this.props.showAddApi()}
            >
              Add new
          </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              iconType="refresh"
              onClick={async () => await this.refresh()}
            >
              Refresh
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText color="subdued" style={{ paddingBottom: '15px' }}>
              From here you can see how to set up your Wazuh host, establish as default, and check their connection and status.
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiInMemoryTable
          itemId="id"
          items={items}
          search={search}
          columns={columns}
          pagination={true}
          sorting={true}
          loading={this.state.refreshingEntries}
        />
      </EuiPanel>
    );
  }
}

ApiTable.propTypes = {
  apiEntries: PropTypes.array,
  currentDefault: PropTypes.string,
  setDefault: PropTypes.func,
  checkManager: PropTypes.func,
  updateClusterInfoInRegistry: PropTypes.func,
  getHosts: PropTypes.func,
  testApi: PropTypes.func,
  showAddApiWithInitialError: PropTypes.func,
  showApiIsDown: PropTypes.func
};
