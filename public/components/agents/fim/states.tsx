/*
 * Wazuh app - Integrity monitoring components
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
import { WzRequest } from '../../../react-services/wz-request'

export class States extends Component {
  state: {
    syscheck: {},
    pageIndex: Number,
    pageSize: Number,
    totalItems: Number,
    sortField: String,
    sortDirection: String
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
    }
  }

  async componentDidMount() {
    await this.getSyscheck();
  }

  async getSyscheck() {
    const syscheck = await WzRequest.apiReq(
      'GET',
      '/syscheck/001',
      {}
    );

    this.setState({
      syscheck: (((syscheck || {}).data || {}).data || {}).items || {},
      totalItems: (((syscheck || {}).data || {}).data || {}).totalItems - 1,
    });
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
    return [
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
        field: 'file',
        name: 'file',
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
    const { syscheck, pageIndex, pageSize, totalItems, sortField, sortDirection } = this.state;
    const columns = this.columns();
    const pagination = {
      pageIndex: pageIndex,
      pageSize: pageSize,
      totalItemCount: totalItems,
      hidePerPageOptions: true,
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
            />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  render() {
    const filesTable = this.renderFilesTable();

    return (
      <section>
        <div>States</div>
        {filesTable}
      </section>
    )
  }
}
