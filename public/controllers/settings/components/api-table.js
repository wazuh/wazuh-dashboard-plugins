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
  EuiHealth
} from '@elastic/eui';

export class ApiTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      itemIdToExpandedRowMap: {},
      user: '',
      password: '',
      url: '',
      port: 55000,
      apiEntries: [],
      currentDefault: 0
    };
  }

  componentDidMount() {
  }

  render() {
    const items = [...this.props.apiEntries];
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
            <EuiHealth color="danger">Offline</EuiHealth>
          ) : (
                <EuiHealth color="subdued">Unknown</EuiHealth>
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
                  onClick={() => this.props.checkManager(item)}
                  color="success"
                />
              </EuiToolTip>
            </EuiFlexItem>
          </EuiFlexGroup>
        )
      }
    ];
    return (
      <EuiBasicTable
        itemId="id"
        items={items}
        columns={columns}
      />
    );
  }
}

ApiTable.propTypes = {
  apiEntries: PropTypes.array,
  currentDefault: PropTypes.string,
  setDefault: PropTypes.func,
  checkManager: PropTypes.func
};
