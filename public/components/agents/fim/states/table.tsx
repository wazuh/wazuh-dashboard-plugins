/*
 * Wazuh app - Integrity monitoring table component
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
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiBasicTable
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n/react';
import { WzRequest } from '../../../../react-services/wz-request'

export class StatesTable extends Component {
  state: {
    syscheck: {},
    pageIndex: Number,
    pageSize: Number,
    totalItems: Number,
    sortField: String,
    sortDirection: String,
    isProcessing: Boolean,
    q: String,
    search: String,
  };
  
  constructor(props) {
    super(props);

    this.state = {
      syscheck: [],
      pageIndex: 0,
      pageSize: 15,
      totalItems: 0,
      sortField: 'file',
      sortDirection: 'asc',
      isProcessing: true,
      q: '',
      search: '',
    }
  }

  async componentDidMount() {
    await this.getSyscheck();
  }

  async getSyscheck() {
    const syscheck = await WzRequest.apiReq(
      'GET',
      '/syscheck/001',
      this.buildFilter()
    );

    this.setState({
      syscheck: (((syscheck || {}).data || {}).data || {}).items || {},
      totalItems: (((syscheck || {}).data || {}).data || {}).totalItems - 1,
      isProcessing: false
    });
  }

  buildSortFilter() {
    const {sortField, sortDirection} = this.state;

    const field = (sortField === 'os_name') ? '' : sortField;
    const direction = (sortDirection === 'asc') ? '+' : '-';

    return direction+field;
  }

  buildFilter() {
    const { pageIndex, pageSize, search, q} = this.state;

     const filter = {
      offset: pageIndex * pageSize,
      limit: pageSize,
      sort: this.buildSortFilter(),

    };

     if (q !== ''){
      filter.q = q
    }

     if (search !== '') {
      filter.search = search;
    }

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
      isProcessing: true,
    });
  };

  columns() {
    const buildColumn = fieldName => ({
      field:fieldName, name: fieldName, sortable: true
    })
    return ['file','gname','date',
    'sha1','inode','mtime',
    'md5','sha256','gid',
    'type','perm','uid',
    'uname','size',].map(buildColumn)
  }

  renderFilesTable() {
    const { syscheck, pageIndex, pageSize, totalItems, sortField, sortDirection } = this.state;
    const columns = this.columns();
    const pagination = {
      pageIndex: pageIndex,
      pageSize: pageSize,
      totalItemCount: totalItems,
      /* hidePerPageOptions: false, */
      pageSizeOptions: [15, 20, 30],
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
              columns={columns}
              pagination={pagination}
              onChange={this.onTableChange}
              sorting={sorting}
              itemId="file"
              isExpandable={true}
            />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  render() {
    const filesTable = this.renderFilesTable();

    return (
      <div>
        {filesTable}
      </div>
    )
  }
}
