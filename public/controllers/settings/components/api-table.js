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
import { RIGHT_ALIGNMENT } from '@elastic/eui/lib/services';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiBasicTable,
  EuiPanel,
  EuiButtonIcon,
  EuiToolTip,
  EuiFormRow,
  EuiFieldText,
  EuiFieldPassword,
  EuiFieldNumber,
  EuiButton,
  EuiSpacer,
  EuiButtonEmpty
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

  onChangeEdit(e, field) {
    this.setState({
      [field]: e.target.value
    });
  }

  toggleDetails(item) {
    const itemIdToExpandedRowMap = { ...this.state.itemIdToExpandedRowMap };
    if (itemIdToExpandedRowMap[item._id]) {
      delete itemIdToExpandedRowMap[item._id];
    } else {
      itemIdToExpandedRowMap[item._id] = (
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFormRow label="Username">
              <EuiFieldText
                onChange={e => this.onChangeEdit(e, 'user')}
                placeholder="foo"
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow label="Password">
              <EuiFieldPassword
                onChange={e => this.onChangeEdit(e, 'password')}
                placeholder="bar"
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow label="Host">
              <EuiFieldText
                onChange={e => this.onChangeEdit(e, 'url')}
                placeholder="http://localhost"
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow label="Port">
              <EuiFieldNumber
                max={99999}
                onChange={e => this.onChangeEdit(e, 'port')}
                placeholder={55000}
              />
            </EuiFormRow>
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <EuiFormRow label="Actions">
              <EuiButton
                aria-label="Update"
                iconType="save"
                color="primary"
                onClick={() =>
                  this.props
                    .updateSettings({ ...this.state, _id: item._id }, true)
                    .then(result => result !== -1 && this.toggleDetails(item))
                }
              >
                Save
              </EuiButton>
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    }
    this.setState({ itemIdToExpandedRowMap });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      apiEntries: nextProps.apiEntries,
      currentDefault: nextProps.currentDefault
    });
  }

  render() {
    const { itemIdToExpandedRowMap } = this.state;
    const items = [...this.state.apiEntries];
    const columns = [
      {
        field: '_source.cluster_info.cluster',
        name: 'Cluster',
        align: 'left'
      },
      {
        field: '_source.cluster_info.manager',
        name: 'Manager',
        align: 'left'
      },
      {
        field: '_source.url',
        name: 'Host',
        align: 'left'
      },
      {
        field: '_source.api_port',
        name: 'Port',
        align: 'left'
      },
      {
        field: '_source.api_user',
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
                    item._id === this.state.currentDefault
                      ? 'starFilled'
                      : 'starEmpty'
                  }
                  aria-label="Set as default"
                  onClick={() => {
                    const currentDefault = this.props.setDefault(item);
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
            <EuiFlexItem grow={false}>
              <EuiToolTip position="bottom" content={<p>Remove</p>}>
                <EuiButtonIcon
                  aria-label="Remove manager"
                  iconType="trash"
                  onClick={() =>
                    this.props.removeManager(item).then(apiEntries =>
                      this.setState({
                        apiEntries
                      })
                    )
                  }
                  color="danger"
                />
              </EuiToolTip>
            </EuiFlexItem>
          </EuiFlexGroup>
        )
      },

      {
        align: RIGHT_ALIGNMENT,
        width: '40px',
        isExpander: true,
        render: item => (
          <EuiToolTip position="bottom" content={<p>Edit</p>}>
            <EuiButtonIcon
              onClick={() => this.toggleDetails(item)}
              aria-label={
                itemIdToExpandedRowMap[item.id]
                  ? 'Collapse edition'
                  : 'Expand edition'
              }
              iconType={
                itemIdToExpandedRowMap[item.id] ? 'arrowUp' : 'arrowDown'
              }
            />
          </EuiToolTip>
        )
      }
    ];
    return (
      <EuiPanel>
        <EuiBasicTable
          itemId="_id"
          items={items}
          columns={columns}
          itemIdToExpandedRowMap={this.state.itemIdToExpandedRowMap}
          isExpandable={true}
        />
        <EuiSpacer size="m" />
        <EuiFlexGroup>
          <EuiFlexItem />
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              aria-label="Add"
              iconType="plusInCircle"
              onClick={() => this.props.switch()}
            >
              Add new
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem />
        </EuiFlexGroup>
      </EuiPanel>
    );
  }
}

ApiTable.propTypes = {
  apiEntries: PropTypes.array,
  currentDefault: PropTypes.string,
  updateSettings: PropTypes.func,
  setDefault: PropTypes.func,
  checkManager: PropTypes.func,
  removeManager: PropTypes.func,
  switch: PropTypes.func
};
