/*
 * Wazuh app - Agent vulnerabilities components
 * Copyright (C) 2015-2021 Wazuh, Inc.
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
  EuiPanel,
  EuiPage,
  EuiTitle,
  EuiLoadingSpinner,
  EuiSpacer,
  EuiProgress,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonEmpty
} from '@elastic/eui';
import {
  InventoryTable,
  FilterBar
} from './inventory/';
import { WzRequest } from '../../../react-services/wz-request';
import exportCsv from '../../../react-services/wz-csv';
import { getToasts }  from '../../../kibana-services';
import { ICustomBadges } from '../../wz-search-bar/components';
import { filtersToObject } from '../../wz-search-bar';

export class Inventory extends Component {
  _isMount = false;
  state: {
    filters: [];
    totalItems: number;
    isLoading: Boolean;
    items: [];
    customBadges: ICustomBadges[];
  };

  props: any;

  constructor(props) {
    super(props);
    this.state = {
      filters: [],
      items: [],
      totalItems: 0,
      isLoading: true,
      customBadges: []
    }
    this.onFiltersChange.bind(this);
  }

  async componentDidMount() {
    this._isMount = true;
    await this.loadAgent();
  }

  componentDidUpdate(prevProps) {
    if (JSON.stringify(this.props.agent) !== JSON.stringify(prevProps.agent)){
      this.setState({isLoading: true}, this.loadAgent)
    }
  }

  componentWillUnmount() {
    this._isMount = false;
  }

  async loadAgent() {
    const {totalItems, items} = await this.getItemNumber();
    if (this._isMount){
      this.setState({ totalItems, items, isLoading: false });
    }
  }

  getStoreFilters(props) {
    const { section, selectView, agent } = props;
    const filters = JSON.parse(window.localStorage.getItem(`wazuh-${section}-${selectView}-vulnerability-${agent['id']}`) || '{}');
    return filters;
  }

  setStoreFilters(filters) {
    const { section, selectView, agent } = this.props;
    window.localStorage.setItem(`wazuh-${section}-${selectView}-vulnerability-${agent['id']}`, JSON.stringify(filters))
  }

  onFiltersChange = (filters) => {
    this.setStoreFilters(filters);
    this.setState({ filters });
  }

  onTotalItemsChange = (totalItems: number) => {
    this.setState({ totalItemsFile: totalItems });
  }

  buildFilter() {
    const filters = filtersToObject(this.state.filters);
    const filter = {
      ...filters,
      limit: '15' 
    };
    return filter;
  }

  async getItemNumber() {
    try {
      const agentID = this.props.agent.id;
      let response = await WzRequest.apiReq('GET', `/vulnerability/${agentID}`, {
        params: this.buildFilter(),
      });
      return {
        totalItems: ((response.data || {}).data || {}).total_affected_items || 0,
        items: ((response.data || {}).data || {}).affected_items || [],
      };
    } catch (error) {
      this.setState({ isLoading: false });
      this.showToast('danger', error, 3000);
    }
  }

  renderTitle() {
    const { isLoading, totalItems } = this.state;
    
      return (
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiTitle size="s">
              <h1>Vulnerabilities&nbsp;{isLoading === true ? <EuiLoadingSpinner size="s" /> : <span>({ totalItems })</span>}</h1>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty isDisabled={(totalItems == 0)} iconType="importAction" onClick={() => this.downloadCsv()}>
              Export formatted
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
      )
  }

  showToast = (color, title, time) => {
    getToasts().add({
      color: color,
      title: title,
      toastLifeTimeMs: time,
    });
  };

  async downloadCsv() {
    const { filters } = this.state;
    try {
      const filtersObject = filtersToObject(filters);
      const formatedFilters = Object.keys(filtersObject).map(key => ({name: key, value: filtersObject[key]}));
      this.showToast('success', 'Your download should begin automatically...', 3000);
      await exportCsv(
        '/vulnerability/' + this.props.agent.id,
        [
          ...formatedFilters
        ],
        `vuls-vulnerabilities`
      );
    } catch (error) {
      this.showToast('danger', error, 3000);
    }
  }

  renderTable() {
    const { filters, items, totalItems } = this.state;
    return (
      <div>
        <FilterBar
          filters={filters}
          onFiltersChange={this.onFiltersChange}
          agent={this.props.agent} />
          <InventoryTable
            {...this.props}
            filters={filters}
            items={items}
            totalItems={totalItems}
            onFiltersChange={this.onFiltersChange}
            onTotalItemsChange={this.onTotalItemsChange}/>
      </div>
    )
  }


  loadingInventory() {
    return <EuiPage>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiProgress size="xs" color="primary" />
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPage>;
  }


  render() {
    const { isLoading } = this.state;
    if (isLoading) {
      return this.loadingInventory()
    }
    const table = this.renderTable();
    const title = this.renderTitle();

    return <EuiPage>
        <EuiPanel>
          {title}
          <EuiSpacer size={(((this.props.agent || {}).os || {}).platform || false) === 'windows' ? 's' : 'm'} />
          {table}
        </EuiPanel>
      </EuiPage>
  }
}
