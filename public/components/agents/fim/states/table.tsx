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
  EuiBasicTable,
  Direction,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n/react';
import { WzRequest } from '../../../../react-services/wz-request'

export class StatesTable extends Component {
  state: {
    syscheck: [],
    pageIndex: number,
    pageSize: number,
    totalItems: number,
    sortField: string,
    sortDirection: Direction,
    isLoading: boolean,
  };

  props!: {
    filters: {}
  }

  constructor(props) {
    super(props);

    this.state = {
      syscheck: [],
      pageIndex: 0,
      pageSize: 15,
      totalItems: 0,
      sortField: 'file',
      sortDirection: 'asc',
      isLoading: true,
    }
  }

  async componentDidMount() {
    await this.getSyscheck();
  }

  componentDidUpdate(prevProps) {
    const { filters } = this.props;
    if (JSON.stringify(filters) !== JSON.stringify(prevProps.filters))
      this.getSyscheck();
  }

  async getSyscheck() {
    const { filters } = this.props;
    console.log("getSyscheck",filters)
    const syscheck = await WzRequest.apiReq(
      'GET',
      '/syscheck/001',
      this.buildFilter()
    );

    this.setState({
      syscheck: (((syscheck || {}).data || {}).data || {}).items || {},
      totalItems: (((syscheck || {}).data || {}).data || {}).totalItems - 1,
      isLoading: false
    });
  }

  buildSortFilter() {
    const {sortField, sortDirection} = this.state;

    const field = (sortField === 'os_name') ? '' : sortField;
    const direction = (sortDirection === 'asc') ? '+' : '-';

    return direction+field;
  }

  buildFilter() {
    const { pageIndex, pageSize} = this.state;
    const { filters } = this.props;

     const filter = {
      ...filters,
      offset: pageIndex * pageSize,
      limit: pageSize,
      sort: this.buildSortFilter(),
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
    });
    this.getSyscheck();
  };

  columns() {
    return [
      {
        field: 'file',
        name: 'file',
        sortable: true,
      },
      {
        field: 'gname',
        name: 'gname',
        sortable: true,
      },
      {
        field: 'date',
        name: 'date',
        sortable: true,
      },
      {
        field: 'sha1',
        name: 'sha1',
        sortable: true,
      },
      {
        field: 'inode',
        name: 'inode',
        sortable: true,
      },
      {
        field: 'mtime',
        name: 'mtime',
        sortable: true,
      },
      {
        field: 'md5',
        name: 'md5',
        sortable: true,
      },
      {
        field: 'sha256',
        name: 'sha256',
        sortable: true,
      },
      {
        field: 'gid',
        name: 'gid',
        sortable: true,
      },
      {
        field: 'type',
        name: 'type',
        sortable: true,
      },
      {
        field: 'perm',
        name: 'perm',
        sortable: true,
      },
      {
        field: 'uid',
        name: 'uid',
        sortable: true,
      },
      {
        field: 'uname',
        name: 'uname',
        sortable: true,
      },
      {
        field: 'size',
        name: 'size',
        sortable: true,
      },
    ]
  }

  renderFilesTable() {
    const { syscheck, pageIndex, pageSize, totalItems, sortField, sortDirection, isLoading } = this.state;
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
    }

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
              loading={isLoading}
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
