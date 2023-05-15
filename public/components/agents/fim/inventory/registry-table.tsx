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
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiIconTip
} from '@elastic/eui';
import { WzRequest } from '../../../../react-services/wz-request';
import { FlyoutDetail } from './flyout';
import { formatUIDate } from '../../../../react-services/time-service';
import { TableWzAPI } from '../../../common/tables';

export class RegistryTable extends Component {
  state: {
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
      syscheck: [],
      isFlyoutVisible: false,
      currentFile: {
        file: '',
        type: '',
      },
      syscheckItem: {},
    };
  }

  async componentDidMount() {
    const regex = new RegExp('file=' + '[^&]*');
    const match = window.location.href.match(regex);
    if (match && match[0]) {
      const file = match[0].split('=')[1];
      this.showFlyout(decodeURIComponent(file), true);
    }
  }

  closeFlyout() {
    this.setState({ isFlyoutVisible: false, currentFile: {} });
  }

  async showFlyout(file, item, redirect = false) {
    window.location.href = window.location.href.replace(new RegExp('&file=' + '[^&]*', 'g'), '');
    let fileData = false;
    if (!redirect) {
      fileData = this.state.syscheck.filter((item) => {
        return item.file === file;
      });
    } else {
      const response = await WzRequest.apiReq('GET', `/syscheck/${this.props.agent.id}`, {
        params: {
          file: file,
        },
      });
      fileData = ((response.data || {}).data || {}).affected_items || [];
    }
    if (!redirect) window.location.href = window.location.href += `&file=${file}`;
    //if a flyout is opened, we close it and open a new one, so the components are correctly updated on start.
    const currentFile = {
      file,
      type: item.type,
    };
    this.setState({ isFlyoutVisible: false }, () =>
      this.setState({ isFlyoutVisible: true, currentFile, syscheckItem: item })
    );
  }

  columns() {
    return [
      {
        field: 'file',
        name: 'Registry',
        sortable: true,
      },
      {
        field: 'mtime',
        name: (
          <span>Last Modified{' '}
            <EuiIconTip
              content='This is not searchable through a search term.'
              size='s'
              color='subdued'
              type='alert'
            />
          </span>
        ),
        sortable: true,
        width: '200px',
        render: formatUIDate,
      },
    ];
  }

  renderRegistryTable() {
    const getRowProps = (item) => {
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
            title='Registry'
            tableColumns={columns}
            tableInitialSortingField='file'
            endpoint={`/syscheck/${this.props.agent.id}`}
            searchBarProps={{
              modes: [
                {
                  id: 'wql',
                  options: {
                    searchTermFields: ['file'],
                    implicitQuery: {
                      query: 'type=registry_file',
                      conjunction: ';'
                    }
                  },
                  suggestions: {
                    field: () => [
                      {label: 'file', description: 'filter by file'}
                    ],
                    value: async (currentValue, { field }) => {
                      return [];
                      try{ // TODO: distinct
                        return [];
                      }catch(error){
                        return [];
                      };
                    }
                  },
                }
              ]
            }}
            filters={{default: {q: 'type=registry_file'}}}
            showReload
            downloadCsv={`fim-registry-${this.props.agent.id}`}
            searchTable={true}
            rowProps={getRowProps}
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
        {this.state.isFlyoutVisible && (
          <FlyoutDetail
            fileName={this.state.currentFile.file}
            agentId={this.props.agent.id}
            item={this.state.syscheckItem}
            closeFlyout={() => this.closeFlyout()}
            type={this.state.currentFile.type}
            view="inventory"
            {...this.props}
          />
        )}
      </div>
    );
  }
}
