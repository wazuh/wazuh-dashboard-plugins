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
  EuiBasicTable,
  EuiButtonIcon,
  EuiToolTip,
  EuiHealth,
  EuiPanel,
  EuiButtonEmpty,
  EuiTitle,
  EuiText,
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
      this.setState({refreshingEntries: true});
      const entries = await this.props.refreshApiEntries();
      this.setState({
        apiEntries: entries,
        refreshingEntries: false
      });
    } catch (error) {
      this.setState({
        apiEntries: [],
        refreshingEntries: false
      });
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
        field: 'cluster_info.cluster',
        name: 'Cluster',
        align: 'left'
      },
      {
        field: 'cluster_info.manager',
        name: 'Manager',
        align: 'left'
      },
      {
        field: 'url',
        name: 'Host',
        align: 'left'
      },
      {
        field: 'port',
        name: 'Port',
        align: 'left'
      },
      {
        field: 'user',
        name: 'User',
        align: 'left'
      },
      {
        field: 'status',
        name: 'Status',
        align: 'left',
        render: item => {
          return item === 'online' ? (
            <EuiHealth color="success">Online</EuiHealth>
          ) : item === 'down' ? (
            <EuiHealth color="warning">Warning</EuiHealth>
          ) : (
                <EuiHealth color="danger">Offline</EuiHealth>
              );
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
        <EuiBasicTable
          itemId="id"
          items={items}
          columns={columns}
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
  refreshApiEntries: PropTypes.func
};
