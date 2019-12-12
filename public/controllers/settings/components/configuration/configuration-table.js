/*
 * Wazuh app - React component for configuration table.
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
import { EuiBasicTable, EuiCallOut } from '@elastic/eui';

import ConfigurationHandler from './utils/configuration-handler';
import { toastNotifications } from 'ui/notify';

import ConfigurationColums from './utils/columns';
import { configEquivalences } from '../../../../utils/config-equivalences';

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
      editingKey: false,
    };

    this.setEditingKey = this.setEditingKey.bind(this);
    this.newValueItem = this.newValueItem.bind(this);
    this.editKey = this.editKey.bind(this);

    this.functions = {
      setEditingKey: this.setEditingKey,
      newValueItem: this.newValueItem,
      editKey: this.editKey,
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

    if (type === 'number') {
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

  async editKey(key, value) {
    this.setState({ isLoading: true });
    try {
      // const rawItems = await this.groupsHandler.listGroups(this.buildFilter());
      const result = await this.configurationHandler.editKey(key, value);
      console.log(result);
      await this.getItems();
      this.setEditingKey(null);
      // TODO: reset server
    } catch (error) {
      // TODO:
      this.setState({ isLoading: false });
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
            description: this.configEquivalence(key),
          });
        }
      }
      this.setState({ items: arrayItems, isLoading: false });
    } catch (error) {
      this.setState({ isLoading: false });
    }
    // TODO:
    // const { section, showingFiles } = this.props.state;
    // if(this.props.state.defaultItems.length === 0 && section === 'lists'){
    //   await this.setDefaultItems();
    // }
    // const rawItems = await this.wzReq(
    //   'GET',
    //   `${this.paths[section]}${showingFiles ? '/files': ''}`,
    //   this.buildFilter(),
    // )
    // const { items, totalItems } = ((rawItems || {}).data || {}).data;
    // this.setState({
    //   items,
    //   totalItems,
    //   isProcessing: false,
    // });
    // this.props.updateIsProcessing(false);
  }

  onTableChange = () => {
    console.log('On change');
  };

  render() {
    const { isLoading, error } = this.state;
    const { items, editingKey } = this.state;
    const message = isLoading ? null : 'No results...';

    this.configurationColums = new ConfigurationColums(this.functions, editingKey); // TODO:
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

  showToast = (color, title, text, time) => {
    toastNotifications.add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time,
    });
  };
}
