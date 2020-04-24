/*
 * Wazuh app - React component for configuration table.
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
import { EuiBasicTable, EuiCallOut } from '@elastic/eui';

import ConfigurationHandler from './utils/configuration-handler';
import { toastNotifications } from 'ui/notify';

import ConfigurationColums from './utils/columns';
import { configEquivalences } from '../../../utils/config-equivalences';

export class WzConfigurationTable extends Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {
      items: [],
      itemsTypes: [],
      totalItems: 0,
      isLoading: false,
      error: false,
      editingKey: false
    };

    this.setEditingKey = this.setEditingKey.bind(this);
    this.newValueItem = this.newValueItem.bind(this);
    this.editKey = this.editKey.bind(this);

    this.functions = {
      setEditingKey: this.setEditingKey,
      newValueItem: this.newValueItem,
      editKey: this.editKey
    };

    this.configurationHandler = ConfigurationHandler;
  }

  setEditingKey(key) {
    this.setState({ editingKey: key });
    if (key === null) {
      this.getItems();
    }
  }

  newValueItem(newValue, key, type) {
    let newValueWithType = newValue;

    if (type === 'number' && newValue) {
      newValueWithType = parseInt(newValue);
    }

    let { items } = this.state;

    for (const item of items) {
      if (item.setting === key) {
        item.value = newValueWithType;
      }
    }

    this.setState({ items });
  }

  async editKey(key, value, type) {
    this.setState({ isLoading: true });
    try {
      const result = await this.configurationHandler.editKey(
        key,
        type === 'number' ? (value ? value : 0) : value
      );

      let newValue = value;
      if (type === 'object') {
        newValue = JSON.parse(value);
      }
      if (type === 'boolean') {
        newValue = value === 'true' ? true : false;
      }
      if (type === 'number') {
        newValue = value ? value : 0;
      }

      this.newValueItem(newValue, key, type);
      this.setState({ editingKey: null, isLoading: false });

      const response = result.data.data;
      if (response.needRestart) {
        this.showToast(
          'warning',
          'You must restart Kibana for the changes to take effect',
          3000
        );
      } else if (response.needWait) {
        this.showToast(
          'warning',
          'The configuration has been successfully updated, but it may take a few seconds for the change to take effect',
          3000
        );
      } else {
        this.showToast(
          'success',
          'The configuration has been successfully updated',
          3000
        );
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async componentDidMount() {
    this._isMounted = true;
    this.getItems();
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  /**
   * This get the string equivalence for a given key
   * @param {String} key
   */
  configEquivalence(key) {
    return configEquivalences[key] || '-';
  }

  async getItems() {
    this.setState({ isLoading: true });
    try {
      const data = { ...(this.props.wazuhConfig.getConfig() || {}) };

      let arrayItems = [];
      for (const key in data) {
        if (key.includes('extension') || key.includes('hosts')) {
          delete data[key];
        } else {
          arrayItems.push({
            setting: key,
            value: data[key],
            typeof: typeof data[key],
            description: this.configEquivalence(key)
          });
        }
      }
      this.setState({ items: arrayItems, isLoading: false });
    } catch (error) {
      this.setState({ isLoading: false });
      return Promise.reject(error);
    }
  }

  onTableChange = () => {};

  render() {
    const { isLoading, error } = this.state;
    const { items, editingKey } = this.state;
    const message = isLoading ? null : 'No results...';

    this.configurationColums = new ConfigurationColums(
      this.functions,
      editingKey
    );
    const columns = this.configurationColums.columns;

    if (!error) {
      return (
        <div>
          <EuiBasicTable
            itemId="id"
            items={items}
            columns={columns}
            onChange={this.onTableChange}
            loading={isLoading}
            message={message}
          />
        </div>
      );
    } else {
      return <EuiCallOut color="warning" title={error} iconType="gear" />;
    }
  }

  showToast = (color, title, time) => {
    toastNotifications.add({
      color: color,
      title: title,
      toastLifeTimeMs: time
    });
  };
}
