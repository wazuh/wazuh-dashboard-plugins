
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
  EuiBasicTable,
  Direction,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n/react';
import { WzRequest } from '../../../../react-services/wz-request';
import { FlyoutDetail } from './flyout';

export class RegistryTable extends Component {
  state: {
    syscheck: [],
    pageIndex: number,
    pageSize: number,
    totalItems: number,
    sortField: string,
    isFlyoutVisible: Boolean
    sortDirection: Direction,
    isLoading: boolean,
    currentFile: {
      file: string
    }
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
      isFlyoutVisible: false,
      currentFile: {
        file: ""
      }
    }
  }

  async componentDidMount() {
    await this.getSyscheck();
  }

  componentDidUpdate(prevProps) {
    const { filters } = this.props;
    if (JSON.stringify(filters) !== JSON.stringify(prevProps.filters)){
      this.setState({pageIndex: 0}, this.getSyscheck)
    }
  }

  closeFlyout() {
    this.setState({ isFlyoutVisible: false, currentFile: {} });
  }

  showFlyout(file) {
    const fileData = this.state.syscheck.filter(item => {
      return item.file === file;
    });
    //if a flyout is opened, we close it and open a new one, so the components are correctly updated on start.
    this.setState({ isFlyoutVisible: false }, () => this.setState({ isFlyoutVisible: true, currentFile: fileData[0] }));
  }

  async getSyscheck() {
    const { filters } = this.props;
    const agentID = this.props.agent.id;

    const syscheck = await WzRequest.apiReq(
      'GET',
      `/syscheck/${agentID}`,
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
      type: 'registry'
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
    return [
      {
        field: 'file',
        name: 'Registry',
        sortable: true,
      },
      {
        field: 'mtime',
        name: 'Last Modified',
        sortable: true,
        width: '200px',
      }      
    ]
  }

  renderRegistryTable() {
    const getRowProps = item => {
      const { file } = item;
      return {
        'data-test-subj': `row-${file}`,
        onClick: () => this.showFlyout(file),
      };
    };

    const { syscheck, pageIndex, pageSize, totalItems, sortField, sortDirection, isLoading } = this.state;
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
              columns={columns}
              pagination={pagination}
              onChange={this.onTableChange}
              rowProps={getRowProps}
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
    const registryTable = this.renderRegistryTable();
    return (
      <div>
        {registryTable}
        {this.state.isFlyoutVisible &&
          <FlyoutDetail
            fileName={this.state.currentFile.file}
            agentId={this.props.agent.id}
            closeFlyout={() => this.closeFlyout()}
            type='registry'
            view='states'
            {...this.props} />
        }
      </div>
    )
  }
}