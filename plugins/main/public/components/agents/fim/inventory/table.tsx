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
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { WzRequest } from '../../../../react-services/wz-request';
import { FlyoutDetail } from './flyout';
import { TableWzAPI } from '../../../common/tables';
import { SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT } from '../../../../../common/constants';
import { withRouterSearch } from '../../../common/hocs';
import { Route, Switch } from '../../../router-search';
import NavigationService from '../../../../react-services/navigation-service';
import { getProperties } from './fim-data';

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
      const columns = getProperties(this.props.agent?.os?.platform, 'columns');

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
                  field: currentValue =>
                    getProperties(
                      this.props.agent?.os?.platform,
                      'suggestions',
                    ),
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
