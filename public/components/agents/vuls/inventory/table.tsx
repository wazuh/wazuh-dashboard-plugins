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
  Direction,
  EuiOverlayMask,
} from '@elastic/eui';
import { FlyoutDetail } from './flyout';
import { filtersToObject, IFilter, IWzSuggestItem } from '../../../wz-search-bar';
import { TableWzAPI } from '../../../../components/common/tables';
import { getFilterValues } from './lib';

export class InventoryTable extends Component {
  state: {
    error?: string
    pageIndex: number
    pageSize: number
    sortField: string
    isFlyoutVisible: Boolean
    sortDirection: Direction
    isLoading: boolean
    currentItem: {}
  };

  suggestions: IWzSuggestItem[] = [
    {type: 'q', label: 'name', description:"Filter by package ID", operators:['=','!=', '~'], values: async (value) => getFilterValues('name', value, this.props.agent.id)},
    {type: 'q', label: 'cve', description:"Filter by CVE ID", operators:['=','!=', '~'], values: async (value) => getFilterValues('cve', value, this.props.agent.id)},
    {type: 'q', label: 'version', description:"Filter by CVE version", operators:['=','!=', '~'], values: async (value) => getFilterValues('version', value, this.props.agent.id)},
    {type: 'q', label: 'architecture', description:"Filter by architecture", operators:['=','!=', '~'], values: async (value) => getFilterValues('architecture', value, this.props.agent.id)},
  ]

  props!: {
    filters: IFilter[]
    agent: any
    onTotalItemsChange: Function
  }

  constructor(props) {
    super(props);

    this.state = {
      pageIndex: 0,
      pageSize: 15,
      sortField: 'name',
      sortDirection: 'asc',
      isLoading: false,
      isFlyoutVisible: false,
      currentItem: {}
    }
  }

  closeFlyout() {
    this.setState({ isFlyoutVisible: false, currentItem: {} });
  }

  async showFlyout(item, redirect = false) {
    
    //if a flyout is opened, we close it and open a new one, so the components are correctly updated on start.
    this.setState({ isFlyoutVisible: false }, () => this.setState({ isFlyoutVisible: true, currentItem: item }));
  }

  async componentDidUpdate(prevProps) {
    const { filters } = this.props;
    if (JSON.stringify(filters) !== JSON.stringify(prevProps.filters)) {
      this.setState({ pageIndex: 0, isLoading: true });
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

  columns() {
    let width;
    (((this.props.agent || {}).os || {}).platform || false) === 'windows' ? width = '60px' : width = '80px';
    return [
      {
        field: 'version',
        name: 'Version',
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
        field: 'cve',
        name: 'CVE',
        sortable: true,
        truncateText: true,
        width: `${width}`
      },
      {
        field: 'name',
        name: 'Name',
        sortable: true,
        width: '100px'
      }
    ]
  }

  renderTable() {
    const getRowProps = item => {
      const id = `${item.name}-${item.cve}-${item.architecture}-${item.version}`;
      return {
        'data-test-subj': `row-${id}`,
        onClick: () => this.showFlyout(item),
      };
    };

    const { error } = this.state;
    const columns = this.columns();
    const selectFields = 'select=cve,architecture,version,name'
    return (
        <TableWzAPI
          title='Vulnerabilities'
          tableColumns={columns}
          tableInitialSortingField='name'
          searchTable={true}
          searchBarSuggestions={this.suggestions}
          endpoint={`/vulnerability/${this.props.agent.id}?${selectFields}`}
          isExpandable={true}
          rowProps={getRowProps}
          error={error} 
          downloadCsv={true}
        />
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
              vulName={this.state.currentItem.cve}
              agentId={this.props.agent.id}
              item={this.state.currentItem}
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
