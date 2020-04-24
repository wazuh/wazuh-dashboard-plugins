/*
 * Wazuh app - React component for alerts stats.
 *
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
import PropTypes from 'prop-types';
import {
  EuiPanel,
  EuiBasicTable,
  EuiFlexItem,
  EuiFlexGroup,
  EuiTitle,
  EuiFieldSearch,
  EuiTextColor,
  EuiToolTip,
  EuiButtonIcon,
  EuiSpacer,
  EuiDescriptionList
} from '@elastic/eui';

import { RIGHT_ALIGNMENT } from '@elastic/eui/lib/services';

export class SyscheckTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      monitoredFiles: [],
      searchValue: '',
      pageIndex: 0,
      pageSize: 15,
      sortField: 'file',
      sortDirection: 'asc',
      isProcessing: true,
      totalItems: 0,
      q: '',
      search: '',
      itemIdToExpandedRowMap: {}
    };
  }

  async componentDidMount() {
    await this.getItems();
  }

  async componentDidUpdate() {
    if (this.state.isProcessing) {
      await this.getItems();
    }
  }

  formatFile(file) {
    return {
      file: file.file,
      size: file.size,
      gname: file.gname,
      uname: file.uname,
      perm: file.perm,
      uid: file.uid,
      gid: file.gid,
      mtime: file.mtime,
      sha256: file.sha256,
      sha1: file.sha1,
      md5: file.md5,
      inode: file.inode,
      type: file.type,
      date: file.date
    };
  }

  async getItems() {
    const files = await this.props.wzReq(
      'GET',
      `/syscheck/${this.props.agentId}`,
      this.buildFilter()
    );
    const formattedFiles = (((files || {}).data || {}).data || {}).items.map(
      this.formatFile
    );
    this.setState({
      monitoredFiles: formattedFiles,
      totalItems: (((files || {}).data || {}).data || {}).totalItems - 1,
      isProcessing: false
    });
  }

  buildFilter() {
    const { pageIndex, pageSize, search, q } = this.state;

    const filter = {
      offset: pageIndex * pageSize,
      limit: pageSize,
      sort: this.buildSortFilter()
    };

    if (q !== '') {
      filter.q = q;
    }

    if (search !== '') {
      filter.search = search;
    }

    return filter;
  }

  buildSortFilter() {
    const { sortField, sortDirection } = this.state;

    const field = sortField === 'os_name' ? '' : sortField;
    const direction = sortDirection === 'asc' ? '+' : '-';

    return direction + field;
  }

  columns() {
    const itemIdToExpandedRowMap = this.state.itemIdToExpandedRowMap;

    return [
      {
        field: 'file',
        name: 'File',
        sortable: true
      },
      {
        field: 'size',
        name: 'Size',
        sortable: true
      },
      {
        field: 'mtime',
        name: 'Last modified',
        sortable: true
      },
      {
        field: 'gname',
        name: 'Group',
        sortable: true,
        width: '100px'
      },
      {
        field: 'uname',
        name: 'User',
        sortable: true,
        width: '100px'
      },
      {
        field: 'perm',
        name: 'Permissions',
        sortable: true,
        width: '100px'
      },
      {
        field: 'uid',
        name: 'User ID',
        sortable: true,
        width: '75px'
      },
      {
        field: 'gid',
        name: 'Group ID',
        sortable: true,
        width: '75px'
      },
      {
        align: RIGHT_ALIGNMENT,
        width: '40px',
        isExpander: true,
        render: item => (
          <EuiButtonIcon
            onClick={() => this.toggleDetails(item)}
            aria-label={
              itemIdToExpandedRowMap[item.file] ? 'Collapse' : 'Expand'
            }
            iconType={
              itemIdToExpandedRowMap[item.file] ? 'arrowUp' : 'arrowDown'
            }
          />
        )
      }
    ];
  }

  actionButtonsRender(tactic) {
    return (
      <div>
        <EuiToolTip content="View details" position="left">
          <EuiButtonIcon
            onClick={() => this.showFlyout(tactic)}
            iconType="eye"
            aria-label="View details"
          />
        </EuiToolTip>
      </div>
    );
  }

  onTableBarChange = e => {
    this.setState({
      searchValue: e.target.value
    });
  };

  onTableBarSearch = searchTxt => {
    this.setState({
      search: searchTxt,
      pageIndex: 0,
      isProcessing: true
    });
  };

  onTableChange = ({ page = {}, sort = {} }) => {
    const { index: pageIndex, size: pageSize } = page;
    const { field: sortField, direction: sortDirection } = sort;
    this.setState({
      pageIndex,
      pageSize,
      sortField,
      sortDirection,
      isProcessing: true
    });
  };

  /**
   * The "Export Formatted" button have been removed as long as the API can only returns 10 results.
   */
  formattedButton() {
    return (
      <div>
        {/*
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty iconType="importAction" onClick={this.downloadCsv}>
              Export formatted          
            </EuiButtonEmpty>
          </EuiFlexItem>
        */}
      </div>
    );
  }

  title() {
    const formattedButton = this.formattedButton();
    return (
      <div>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiTitle>
                  <h2>Monitored files</h2>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="m" />
            <EuiFlexGroup>
              <EuiFlexItem style={{ paddingBottom: 10 }}>
                <EuiTextColor color="subdued">
                  <p></p>
                </EuiTextColor>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          {formattedButton}
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        <EuiFlexGroup style={{ marginLeft: 2 }}>
          <EuiFieldSearch
            fullWidth={true}
            placeholder="Filter monitored files..."
            value={this.state.searchValue}
            onChange={this.onTableBarChange}
            onSearch={this.onTableBarSearch}
            aria-label="Filter monitored files..."
          />
        </EuiFlexGroup>
      </div>
    );
  }

  table() {
    const {
      pageIndex,
      pageSize,
      totalItems,
      sortField,
      sortDirection
    } = this.state;
    const monitoredFiles = this.state.monitoredFiles;
    const columns = this.columns();
    const pagination = {
      pageIndex: pageIndex,
      pageSize: pageSize,
      totalItemCount: totalItems,
      hidePerPageOptions: true
    };
    const sorting = {
      sort: {
        field: sortField,
        direction: sortDirection
      }
    };

    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiBasicTable
            items={monitoredFiles}
            columns={columns}
            pagination={pagination}
            onChange={this.onTableChange}
            sorting={sorting}
            itemId="file"
            itemIdToExpandedRowMap={this.state.itemIdToExpandedRowMap}
            isExpandable={true}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  toggleDetails = item => {
    const itemIdToExpandedRowMap = { ...this.state.itemIdToExpandedRowMap };

    if (itemIdToExpandedRowMap[item.file]) {
      delete itemIdToExpandedRowMap[item.file];
    } else {
      const listItems = [
        {
          field: 'Field',
          value: item.file
        },
        {
          field: 'Date',
          value: item.date
        },
        {
          field: 'Last modified',
          value: item.mtime
        },
        {
          field: 'Permissions',
          value: item.perm
        },
        {
          field: 'Inode',
          value: item.inode
        },
        {
          field: 'MD5',
          value: item.md5
        },
        {
          field: 'SHA256',
          value: item.sha256
        },
        {
          field: 'SHA1',
          value: item.sha1
        },
        {
          field: 'User',
          value: item.uname
        },
        {
          field: 'User ID',
          value: item.uid
        },
        {
          field: 'Group',
          value: item.gname
        },
        {
          field: 'Group ID',
          value: item.gid
        },
        {
          field: 'Type',
          value: item.type
        }
      ];
      const listColumns = [
        {
          field: 'field',
          name: 'Field',
          align: 'left',
          width: '120px'
        },
        {
          field: 'value',
          name: 'Value',
          align: 'left'
        }
      ];
      itemIdToExpandedRowMap[item.file] = (
        <EuiPanel className="wz-margin-10" paddingSize="m">
          <EuiBasicTable items={listItems} columns={listColumns} />
        </EuiPanel>
      );
    }
    this.setState({ itemIdToExpandedRowMap });
  };

  filterBar() {
    return (
      <EuiFlexGroup>
        <EuiFlexItem></EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  render() {
    const title = this.title();
    const filter = this.filterBar();
    const table = this.table();

    return (
      <div>
        <EuiPanel paddingSize="l">
          {title}
          {filter}
          {table}
        </EuiPanel>
      </div>
    );
  }
}

SyscheckTable.propTypes = {
  wzReq: PropTypes.func,
  agentId: PropTypes.string
};
