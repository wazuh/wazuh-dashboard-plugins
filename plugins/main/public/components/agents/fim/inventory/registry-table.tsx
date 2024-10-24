/*
 * Wazuh app - Integrity monitoring components
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

export const RegistryTable = withRouterSearch(
  class RegistryTable extends Component {
    state: {
      filters: {};
      syscheck: [];
      isFlyoutVisible: Boolean;
      currentFile: {
        file: string;
        type: string;
      };
      syscheckItem: {};
    };

    props!: {
      filters: [];
      totalItems: number;
    };

    constructor(props) {
      super(props);

      this.state = {
        filters: {},
        isFlyoutVisible: false,
        currentFile: {
          file: '',
          type: '',
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
      return [
        {
          field: 'file',
          name: 'Registry',
          sortable: true,
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
          width: '250px',
          className: 'wz-white-space-nowrap',
          render: formatUIDate,
          searchable: false,
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
      ];
    }

    onFiltersChange = filters => {
      this.setState({
        filters,
      });
    };

    renderRegistryTable() {
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

      const APIendpoint = `/syscheck/${this.props.agent.id}?type=registry_key`;

      return (
        <EuiFlexGroup>
          <EuiFlexItem>
            <TableWzAPI
              title='Registry'
              tableColumns={columns}
              tableInitialSortingField='file'
              endpoint={APIendpoint}
              searchBarWQL={{
                suggestions: {
                  field: () => [
                    { label: 'date', description: 'filter by analysis time' },
                    { label: 'file', description: 'filter by file' },
                    {
                      label: 'mtime',
                      description: 'filter by modification time',
                    },
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
              downloadCsv={`fim-registry-${this.props.agent.id}`}
              searchTable={true}
              rowProps={getRowProps}
              saveStateStorage={{
                system: 'localStorage',
                key: 'wz-fim-registry-key-table',
              }}
              showFieldSelector
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
          <Switch>
            <Route
              path='?file=:file'
              render={({ search: { file } }) => (
                <FlyoutDetail
                  fileName={file}
                  agentId={this.props.agent.id}
                  closeFlyout={() => this.closeFlyout()}
                  view='inventory'
                  // showViewInEvents={true}
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
