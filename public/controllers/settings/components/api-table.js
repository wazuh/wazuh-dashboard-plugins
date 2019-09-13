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
    this.setState({
      apiEntries: [...this.props.apiEntries],
      currentDefault: this.props.currentDefault
    });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      apiEntries: nextProps.apiEntries,
      currentDefault: nextProps.currentDefault
    });
  }

  /**
* Transforms the API entries object model
*/
  transformApiEntries(entries) {
    try {
      const arr = [];
      entries.forEach(e => {
        const id = Object.keys(e)[0];
        const data = Object.assign(e[id], { id: id });
        arr.push(data);
      });
      return arr;
    } catch (error) {
      throw error;
    }
  }

  render() {
    const items = this.transformApiEntries([...this.state.apiEntries]);
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
        name: 'Actions',
        render: item => (
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiToolTip position="bottom" content={<p>Set as default</p>}>
                <EuiButtonIcon
                  iconType={
                    item.id === this.state.currentDefault
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
  checkManager: PropTypes.func,
};
