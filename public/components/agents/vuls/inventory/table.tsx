/*
 * Wazuh app - Agent vulnerabilities table component
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
  EuiFlexGroup,
  EuiFlexItem,
  EuiBasicTable,
  Direction,
  EuiOverlayMask,
} from '@elastic/eui';
import { WzRequest } from '../../../../react-services/wz-request';
import { FlyoutDetail } from './flyout';
import { filtersToObject, IFilter } from '../../../wz-search-bar';
// import { TimeService } from '../../../../react-services/time-service';

export class InventoryTable extends Component {
  state: {
    items: []
    error?: string
    pageIndex: number
    pageSize: number
    totalItems: number
    sortField: string
    isFlyoutVisible: Boolean
    sortDirection: Direction
    isLoading: boolean
    currentItem: {
      vul: string
    },
    syscheckItem: {}
  };

  props!: {
    filters: IFilter[]
    agent: any
    items: []
    totalItems: number,
    onTotalItemsChange: Function
  }

  constructor(props) {
    super(props);

    this.state = {
      items: props.items,
      pageIndex: 0,
      pageSize: 15,
      totalItems: 0,
      sortField: 'name',
      sortDirection: 'asc',
      isLoading: false,
      isFlyoutVisible: false,
      currentItem: {
        vul: ""
      },
      syscheckItem: {}
    }
  }

  async componentDidMount() {
    this.setState({totalItems: this.props.totalItems});
  }

  closeFlyout() {
    this.setState({ isFlyoutVisible: false, currentItem: {} });
  }

  async showFlyout(file, item, redirect = false) {
    
    let itemData = false;
    if (!redirect) {
      itemData = this.state.items.filter(item => {
        return item.file === file;
      })
    } else {
      const response = await WzRequest.apiReq('GET', `/vulnerability/${this.props.agent.id}`, {
        params: {}
      });
      itemData = ((response.data || {}).data || {}).affected_items || [];
    }
    
    //if a flyout is opened, we close it and open a new one, so the components are correctly updated on start.
    this.setState({ isFlyoutVisible: false }, () => this.setState({ isFlyoutVisible: true, currentItem: file, syscheckItem: item }));
  }

  async componentDidUpdate(prevProps) {
    const { filters } = this.props;
    if (JSON.stringify(filters) !== JSON.stringify(prevProps.filters)) {
      this.setState({ pageIndex: 0, isLoading: true }, this.getItems);
    }
  }

  async getItems() {
    const agentID = this.props.agent.id;
    try {
      const items = await WzRequest.apiReq(
      'GET',
      `/vulnerability/${agentID}`,
      { params: this.buildFilter()},
      );

      this.props.onTotalItemsChange((((items || {}).data || {}).data || {}).total_affected_items);
      
      this.setState({
        items: (((items || {}).data || {}).data || {}).affected_items || {},
        totalItems: (((items || {}).data || {}).data || {}).total_affected_items - 1,
        isLoading: false,
        error: undefined
      });
    } catch (error) {
      this.setState({error, isLoading: false})
    }
}

  buildSortFilter() {
    const { sortField, sortDirection } = this.state;
    const direction = (sortDirection === 'asc') ? '+' : '-';

    return direction + sortField;
  }

  buildFilter() {
    const { pageIndex, pageSize } = this.state;
    const filters = filtersToObject(this.props.filters);
    const filter = {
      ...filters,
      offset: pageIndex * pageSize,
      limit: pageSize,
      sort: this.buildSortFilter()
    };
    return filter;
  }

  onTableChange = ({ page = {}, sort = {} }) => {
    const { index: pageIndex, size: pageSize } = page;
    const { field: sortField, direction: sortDirection } = sort;
    this.setState({
      pageIndex,
      pageSize,
      sortField,
      sortDirection,
      isLoading: true,
    },
      () => this.getItems()
    );
  };

  columns() {
    let width;
    (((this.props.agent || {}).os || {}).platform || false) === 'windows' ? width = '60px' : width = '80px';
    return [
      {
        field: 'name',
        name: 'Name',
        sortable: true,
        width: '100px'
      },
      {
        field: 'cve',
        name: 'CVE',
        sortable: true,
        truncateText: true,
        width: `${width}`
      },
      {
        field: 'architecture',
        name: 'Architecture',
        sortable: true,
        width: '100px'
      },      
      {
        field: 'version',
        name: 'Version',
        sortable: true,
        truncateText: true,
        width: `${width}`
      }
    ]
  }

  renderTable() {
    const getRowProps = item => {
      const { itemDetails } = item;
      return {
        'data-test-subj': `row-${itemDetails}`,
        onClick: () => this.showFlyout(itemDetails, item),
      };
    };

    const { items, pageIndex, pageSize, totalItems, sortField, sortDirection, isLoading, error } = this.state;
    const columns = this.columns();
    const pagination = {
      pageIndex: pageIndex,
      pageSize: pageSize,
      totalItemCount: totalItems,
      pageSizeOptions: [15, 25, 50, 100],
    }
    const sorting = {
      sort: {
        field: sortField,
        direction: sortDirection,
      },
    };

    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiBasicTable
            items={items}
            error={error}
            columns={columns}
            pagination={pagination}
            onChange={this.onTableChange}
            rowProps={getRowProps}
            sorting={sorting}
            itemId="vulnerability"
            isExpandable={true}
            loading={isLoading}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  render() {
    const table = this.renderTable();
    return (
      <div className='wz-inventory'>
        {table}
        {this.state.isFlyoutVisible &&
          <EuiOverlayMask
            headerZindexLocation="below"
            onClick={() => this.closeFlyout() } >
            <FlyoutDetail
              vulName={this.state.currentItem}
              agentId={this.props.agent.id}
              item={this.state.syscheckItem}
              closeFlyout={() => this.closeFlyout()}
              type='vulnerability'
              view='inventory'
              showViewInEvents={true}
              {...this.props} />
          </EuiOverlayMask>
        }
      </div>
    )
  }
}
