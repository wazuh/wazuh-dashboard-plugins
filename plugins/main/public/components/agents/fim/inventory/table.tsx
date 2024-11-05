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
import { withRouterSearch } from '../../../common/hocs';
import { Route, Switch } from '../../../router-search';
import NavigationService from '../../../../react-services/navigation-service';

export const InventoryTable = withRouterSearch(
  class InventoryTable extends Component {
    state: {
      filters: any;
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
    };

    constructor(props) {
      super(props);

      this.state = {
        filters: {},
        isFlyoutVisible: false,
        currentFile: {
          file: '',
        },
        syscheckItem: {},
      };
    }

    closeFlyout = () => {
      NavigationService.getInstance().updateAndNavigateSearchParams({
        file: null,
      });
    };

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
          show: true,
        },
        {
          field: 'mtime',
          name: (
            <span>
              Last modified{' '}
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
          show: true,
        },
        {
          field: 'uname',
          name: 'User',
          sortable: true,
          truncateText: true,
          width: `${width}`,
          searchable: true,
          show: true,
        },
        {
          field: 'uid',
          name: 'User ID',
          sortable: true,
          truncateText: true,
          width: `${width}`,
          searchable: true,
          show: true,
        },
        {
          field: 'gname',
          name: 'Group',
          sortable: true,
          truncateText: true,
          width: `${width}`,
          searchable: true,
          show: true,
        },
        {
          field: 'gid',
          name: 'Group ID',
          sortable: true,
          truncateText: true,
          width: `${width}`,
          searchable: true,
          show: true,
        },
        {
          field: 'size',
          name: 'Size',
          sortable: true,
          width: `${width}`,
          searchable: true,
          show: true,
        },
        {
          field: 'date',
          name: (
            <span>
              Last analysis{' '}
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
          field: 'md5',
          name: 'MD5',
          searchable: true,
          sortable: true,
        },
        {
          field: 'sha1',
          name: 'SHA1',
          searchable: true,
          sortable: true,
        },
        {
          field: 'sha256',
          name: 'SHA256',
          searchable: true,
          sortable: true,
        },
      ];
    }

    onFiltersChange = filters => {
      this.setState({
        filters,
      });
    };

    renderFilesTable() {
      const getRowProps = item => {
        const { file } = item;
        return {
          'data-test-subj': `row-${file}`,
          onClick: () => {
            NavigationService.getInstance().updateAndNavigateSearchParams({
              file,
            });
          },
        };
      };
      const columns = this.columns();

      const APIendpoint = `/syscheck/${this.props.agent.id}?type=file`;

      return (
        <EuiFlexGroup>
          <EuiFlexItem>
            <TableWzAPI
              title='Files'
              tableColumns={columns}
              tableInitialSortingField='file'
              endpoint={APIendpoint}
              searchBarWQL={{
                suggestions: {
                  field: currentValue => [
                    { label: 'date', description: 'filter by analysis time' },
                    { label: 'file', description: 'filter by file' },
                    { label: 'gid', description: 'filter by group id' },
                    { label: 'gname', description: 'filter by group name' },
                    { label: 'md5', description: 'filter by MD5 checksum' },
                    {
                      label: 'mtime',
                      description: 'filter by modification time',
                    },
                    { label: 'sha1', description: 'filter by SHA1 checksum' },
                    {
                      label: 'sha256',
                      description: 'filter by SHA256 checksum',
                    },
                    { label: 'size', description: 'filter by size' },
                    { label: 'uname', description: 'filter by user name' },
                    { label: 'uid', description: 'filter by user id' },
                  ],
                  value: async (currentValue, { field }) => {
                    try {
                      const response = await WzRequest.apiReq(
                        'GET',
                        APIendpoint,
                        {
                          params: {
                            distinct: true,
                            limit: SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
                            select: field,
                            sort: `+${field}`,
                            ...(currentValue
                              ? {
                                  q: `${field}~${currentValue}`,
                                }
                              : {}),
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
              filters={this.state.filters}
              showReload
              downloadCsv={`fim-files-${this.props.agent.id}`}
              searchTable={true}
              rowProps={getRowProps}
              saveStateStorage={{
                system: 'localStorage',
                key: 'wz-fim-files-table',
              }}
              showFieldSelector
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
          <Switch>
            <Route
              path='?file=:file'
              render={({ search: { file } }) => (
                <FlyoutDetail
                  fileName={file}
                  agentId={this.props.agent.id}
                  closeFlyout={() => this.closeFlyout()}
                  type='file'
                  view='inventory'
                  showViewInEvents={true}
                  {...this.props}
                  onFiltersChange={this.onFiltersChange}
                />
              )}
            ></Route>
          </Switch>
        </div>
      );
    }
  },
);
