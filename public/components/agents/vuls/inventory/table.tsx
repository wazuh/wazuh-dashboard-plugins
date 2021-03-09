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
    syscheck: []
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
      syscheck: props.items,
      pageIndex: 0,
      pageSize: 15,
      totalItems: 0,
      sortField: 'file',
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
    const regex = new RegExp('file=' + '[^&]*');
    const match = window.location.href.match(regex);
    this.setState({totalItems: this.props.totalItems});
    if (match && match[0]) {
      const file = match[0].split('=')[1];
      this.showFlyout(decodeURIComponent(file), true);
    }
  }

  closeFlyout() {
    this.setState({ isFlyoutVisible: false, currentItem: {} });
  }

  async showFlyout(file, item, redirect = false) {
    
    let fileData = false;
    if (!redirect) {
      fileData = this.state.syscheck.filter(item => {
        return item.file === file;
      })
    } else {
      const response = await WzRequest.apiReq('GET', `/syscheck/${this.props.agent.id}`, {
        params: { 
          'file': file 
        }
      });
      fileData = ((response.data || {}).data || {}).affected_items || [];
    }
    if (!redirect)
      window.location.href = window.location.href += `&file=${file}`;
    //if a flyout is opened, we close it and open a new one, so the components are correctly updated on start.
    this.setState({ isFlyoutVisible: false }, () => this.setState({ isFlyoutVisible: true, currentItem: file, syscheckItem: item }));
  }

  async componentDidUpdate(prevProps) {
    const { filters } = this.props;
    if (JSON.stringify(filters) !== JSON.stringify(prevProps.filters)) {
      this.setState({ pageIndex: 0, isLoading: true }, this.getSyscheck);
    }
  }

  async getSyscheck() {
    const agentID = this.props.agent.id;
    try {
      const syscheck = await WzRequest.apiReq(
      'GET',
      `/syscheck/${agentID}`,
      { params: this.buildFilter()},
      );

      this.props.onTotalItemsChange((((syscheck || {}).data || {}).data || {}).total_affected_items);
      
      this.setState({
        syscheck: (((syscheck || {}).data || {}).data || {}).affected_items || {},
        totalItems: (((syscheck || {}).data || {}).data || {}).total_affected_items - 1,
        isLoading: false,
        error: undefined
      });
    } catch (error) {
      this.setState({error, isLoading: false})
    }
}

  buildSortFilter() {
    const { sortField, sortDirection } = this.state;

    const field = (sortField === 'os_name') ? '' : sortField;
    const direction = (sortDirection === 'asc') ? '+' : '-';

    return direction + field;
  }

  buildFilter() {
    const { pageIndex, pageSize } = this.state;
    const filters = filtersToObject(this.props.filters);
    const filter = {
      ...filters,
      offset: pageIndex * pageSize,
      limit: pageSize,
      sort: this.buildSortFilter(),
      type: 'file'
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
      () => this.getSyscheck()
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

    const { syscheck, pageIndex, pageSize, totalItems, sortField, sortDirection, isLoading, error } = this.state;
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
            items={syscheck}
            error={error}
            columns={columns}
            pagination={pagination}
            onChange={this.onTableChange}
            rowProps={getRowProps}
            sorting={sorting}
            itemId="vulnerabilitiy"
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
