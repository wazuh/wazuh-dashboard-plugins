/*
 * Wazuh app - React component for building the agents table.
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */


import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  EuiBasicTable,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiCallOut,
  EuiComboBox,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiIcon,
  EuiInMemoryTable,
  EuiPanel,
  EuiPopover,
  EuiSearchBar,
  EuiSpacer,
  EuiSuggest,
  EuiText,
  EuiTitle,
  InM
} from '@elastic/eui';
import { WzFilterBar } from '../../../components/wz-filter-bar/wz-filter-bar'

export class AgentsTable extends Component {

  constructor(props) {
    super(props);
    this.state = {
      agents: [],
      pageIndex: 0,
      pageSize: 10,
      sortField: 'id',
      sortDirection: 'asc',
      isProcessing: true,
      totalItems: 0,
      q: '',
      search: '',
    }
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

  onQueryChange = ({q={}, search={}}) => {
    this.setState({
      q,
      search,
      isProcessing: true,
    });
  };

  async componentDidMount() {
    await this.getItems();
  }
  async componentDidUpdate() {
    if (this.state.isProcessing) {
      await this.getItems();
    }
  }


  async getItems() {
    const rawAgents = await this.props.wzReq(
      'GET',
      '/agents',
      this.buildFilter()
    );

    const formatedAgents = (((rawAgents || {}).data || {}).data || {}).items.map(this.formatAgent);
    this.setState({
      agents: formatedAgents,
      totalItems: (((rawAgents || {}).data || {}).data || {}).totalItems - 1,
      isProcessing: false,
    });
  }

  buildFilter() {
    const { pageIndex, pageSize, search } = this.state;

    const filter = {
      offset: pageIndex * pageSize,
      limit: pageSize,
      q: this.buildQFilter(),
      sort: this.buildSortFilter(),
    };

    if (search !== '') {
      filter.search = search;
    }
    return filter;
  }

  buildSortFilter() {
    const {sortField, sortDirection} = this.state;

    const field = (sortField === 'os_name') ? '' : sortField;
    const direction = (sortDirection === 'asc') ? '+' : '-';
    
    return direction+field;
  }

  buildQFilter() {
    const { q } = this.state;
    return (q === '') ? `id!=000` :`id!=000;${q}`;
  }

  formatAgent(agent) {
    const checkField = (field) => { return (field !== undefined) ? field : "-"; };

    return {
      "id": agent.id,
      "name": agent.name,
      "ip": agent.ip,
      "status": agent.status,
      "group": checkField(agent.group),
      "os_name": checkField(((agent || {}).os || {}).name) + checkField(((agent || {}).os || {}).version),
      "version": checkField(agent.version),
      "dateAdd": agent.dateAdd,
      "lastKeepAlive": checkField(agent.lastKeepAlive),
      "actions": agent.id
    }
  }
  
  formattedButton() {
    return (
      <EuiFlexItem grow={false}>
        <EuiButtonEmpty iconType="importAction" onClick={() => this.refresh()}>
          Formatted          
        </EuiButtonEmpty>
      </EuiFlexItem>
    );
  }


  columns() {
    return [
      {
        field: 'id',
        name: 'ID',
        sortable: true,
      },
      {
        field: 'name',
        name: 'Name',
        sortable: true,
      },
      {
        field: 'ip',
        name: 'IP',
        sortable: true,
      },
      {
        field: 'status',
        name: 'Status',
        sortable: true,
      },
      {
        field: 'group',
        name: 'Group',
        sortable: true,
      },
      {
        field: 'os_name',
        name: 'OS name',
        sortable: true,
      },
      {
        field: 'version',
        name: 'Version',
        sortable: true,
      },
      {
        field: 'dateAdd',
        name: 'Registration date',
        sortable: true,
      },
      {
        field: 'lastKeepAlive',
        name: 'Last keep alive',
        sortable: true,
      },
      {
        field: 'actions',
        name: 'Actions',
        render: this.actions
      },
    ];
  }

  title() {
    const formattedButton = this.formattedButton()
    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiTitle>
                <h2>Agents</h2>
              </EuiTitle>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        {formattedButton}
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty iconType="plusInCircle" onClick={() => this.refresh()}>
            Add new agent
          </EuiButtonEmpty>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  filterBar() {
    const model = [
      {
        label: 'Status',
        options: [
          {
            label: 'Active',
            group: 'status'
          },
          {
            label: 'Disconnected',
            group: 'status'
          },
          {
            label: 'Never connected',
            group: 'status'
          }
        ]
      },
    ];

    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <WzFilterBar
            model={model}
            clickAction={this.onQueryChange}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  table() {
    const {pageIndex, pageSize, totalItems, agents, sortField, sortDirection} = this.state
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
    };
    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiBasicTable
            items={agents}
            columns={columns}
            pagination={pagination}
            onChange={this.onTableChange}
            sorting={sorting}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    )
  }

  render() {
    const title = this.title();
    const filter = this.filterBar();
    const table = this.table();

    return (
      <EuiPanel paddingSize="l">
        {title}
        {filter}
        {table}
      </EuiPanel>
    );
  }
}

AgentsTable.propTypes = {
  wzReq: PropTypes.func
};
