/*
 * Wazuh app - Integrity monitoring table component
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiIconTip } from '@elastic/eui';
import { WzRequest } from '../../../../react-services/wz-request';
import { FlyoutDetail } from './flyout';
import { formatUIDate } from '../../../../react-services/time-service';
import { TableWzAPI } from '../../../common/tables';
import { SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT } from '../../../../../common/constants';

const searchBarWQLOptions = {
  implicitQuery: {
    query: 'type=file',
    conjunction: ';',
  },
};

const searchBarWQLFilters = { default: { q: 'type=file' } };

export class InventoryTable extends Component {
  state: {
    syscheck: [];
    isFlyoutVisible: Boolean;
    currentFile: {
      file: string;
    };
    syscheckItem: {};
  };

  props!: {
    filters: any;
    agent: any;
    items: [];
    totalItems: number;
    onTotalItemsChange: Function;
  };

  constructor(props) {
    super(props);

    this.state = {
      syscheck: props.items,
      isFlyoutVisible: false,
      currentFile: {
        file: '',
      },
      syscheckItem: {},
    };
  }

  async componentDidMount() {
    const regex = new RegExp('file=' + '[^&]*');
    const match = window.location.href.match(regex);
    if (match && match[0]) {
      const file = match[0].split('=')[1];
      this.showFlyout(decodeURIComponent(file), true); // FIX: second parameter is the item. Why is this a boolean?
    }
  }

  closeFlyout() {
    this.setState({ isFlyoutVisible: false, currentFile: {} });
  }

  async showFlyout(file, item, redirect = false) {
    window.location.href = window.location.href.replace(
      new RegExp('&file=' + '[^&]*', 'g'),
      '',
    );
    let fileData = false; // FIX: fileData variable is unused
    if (!redirect) {
      fileData = this.state.syscheck.filter(item => {
        return item.file === file;
      });
    } else {
      const response = await WzRequest.apiReq(
        'GET',
        `/syscheck/${this.props.agent.id}`,
        {
          params: {
            file: file,
          },
        },
      );
      fileData = ((response.data || {}).data || {}).affected_items || [];
    }
    if (!redirect)
      window.location.href = window.location.href += `&file=${file}`;
    //if a flyout is opened, we close it and open a new one, so the components are correctly updated on start.
    this.setState({ isFlyoutVisible: false }, () =>
      this.setState({
        isFlyoutVisible: true,
        currentFile: file,
        syscheckItem: item,
      }),
    );
  }

  // TODO: connect to total items change on parent component
  /*
    tis.props.onTotalItemsChange(
        (((syscheck || {}).data || {}).data || {}).total_affected_items
      );
  */

  columns() {
    let width;
    (((this.props.agent || {}).os || {}).platform || false) === 'windows'
      ? (width = '60px')
      : (width = '80px');
    return [
      {
        field: 'file',
        name: 'File',
        sortable: true,
        width: '250px',
        searchable: true,
      },
      {
        field: 'mtime',
        name: (
          <span>
            Last Modified{' '}
            <EuiIconTip
              content='This is not searchable through a search term.'
              size='s'
              color='subdued'
              type='alert'
            />
          </span>
        ),
        sortable: true,
        width: '100px',
        render: formatUIDate,
        searchable: false,
      },
      {
        field: 'uname',
        name: 'User',
        sortable: true,
        truncateText: true,
        width: `${width}`,
        searchable: true,
      },
      {
        field: 'uid',
        name: 'User ID',
        sortable: true,
        truncateText: true,
        width: `${width}`,
        searchable: true,
      },
      {
        field: 'gname',
        name: 'Group',
        sortable: true,
        truncateText: true,
        width: `${width}`,
        searchable: true,
      },
      {
        field: 'gid',
        name: 'Group ID',
        sortable: true,
        truncateText: true,
        width: `${width}`,
        searchable: true,
      },
      {
        field: 'size',
        name: 'Size',
        sortable: true,
        width: `${width}`,
        searchable: true,
      },
    ];
  }

  renderFilesTable() {
    const getRowProps = item => {
      const { file } = item;
      return {
        'data-test-subj': `row-${file}`,
        onClick: () => this.showFlyout(file, item),
      };
    };
    const columns = this.columns();

    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <TableWzAPI
            title='Files'
            tableColumns={columns}
            tableInitialSortingField='file'
            endpoint={`/syscheck/${this.props.agent.id}`}
            searchBarWQL={{
              options: searchBarWQLOptions,
              suggestions: {
                field: currentValue => [
                  { label: 'file', description: 'filter by file' },
                  { label: 'gid', description: 'filter by group id' },
                  { label: 'gname', description: 'filter by group name' },
                  {
                    label: 'mtime',
                    description: 'filter by modification time',
                  },
                  { label: 'size', description: 'filter by size' },
                  { label: 'uname', description: 'filter by user name' },
                  { label: 'uid', description: 'filter by user id' },
                ],
                value: async (currentValue, { field }) => {
                  try {
                    const response = await WzRequest.apiReq(
                      'GET',
                      `/syscheck/${this.props.agent.id}`,
                      {
                        params: {
                          distinct: true,
                          limit: SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
                          select: field,
                          sort: `+${field}`,
                          ...(currentValue
                            ? {
                                // Add the implicit query
                                q: `${searchBarWQLOptions.implicitQuery.query}${searchBarWQLOptions.implicitQuery.conjunction}${field}~${currentValue}`,
                              }
                            : {
                                q: `${searchBarWQLOptions.implicitQuery.query}`,
                              }),
                        },
                      },
                    );
                    return response?.data?.data.affected_items.map(item => ({
                      label: item[field],
                    }));
                  } catch (error) {
                    return [];
                  }
                },
              },
              validate: {
                value: ({ formattedValue, value: rawValue }, { field }) => {
                  const value = formattedValue ?? rawValue;
                  if (value) {
                    if (['mtime'].some(dateField => dateField === field)) {
                      return /^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}:\d{2}(.\d{1,6})?Z?)?$/.test(
                        value,
                      )
                        ? undefined
                        : `"${value}" is not a expected format. Valid formats: YYYY-MM-DD, YYYY-MM-DD HH:mm:ss, YYYY-MM-DDTHH:mm:ss, YYYY-MM-DDTHH:mm:ssZ.`;
                    }
                  }
                },
              },
            }}
            filters={searchBarWQLFilters}
            showReload
            downloadCsv={`fim-files-${this.props.agent.id}`}
            searchTable={true}
            rowProps={getRowProps}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  render() {
    const filesTable = this.renderFilesTable();
    return (
      <div className='wz-inventory'>
        {filesTable}
        {this.state.isFlyoutVisible && (
          <FlyoutDetail
            fileName={this.state.currentFile}
            agentId={this.props.agent.id}
            item={this.state.syscheckItem}
            closeFlyout={() => this.closeFlyout()}
            type='file'
            view='inventory'
            showViewInEvents={true}
            {...this.props}
          />
        )}
      </div>
    );
  }
}
