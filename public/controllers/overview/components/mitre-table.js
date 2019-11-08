/*
 * Wazuh app - React component for alerts stats.
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
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { EuiPanel, EuiBasicTable, EuiFlexItem, EuiFlexGroup, EuiButtonEmpty, EuiTitle } from '@elastic/eui';


export class MitreTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      tactics: [],
      pageIndex: 0,
      pageSize: 10,
      sortField: 'id',
      sortDirection: 'asc',
      isProcessing: true,
      totalItems: 0,
      q: '',
      search: '',
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

  formatTactic(tactic) {
    //const checkField = (field) => { return (field !== undefined) ? field : "-"; };

    return {
      "id": tactic.id,
      "name": tactic.json.name,
      "phases": tactic.phases,
      "modified": tactic.json.modified,
    }
  }

 
  async getItems(){
    const tactics = await this.props.wzReq('GET','/mitre',this.buildFilter());
    const formattedTactics =  (((tactics || {}).data || {}).data || {}).items.map(this.formatTactic);
    
    this.setState({
      tactics: formattedTactics,
      totalItems: (((tactics || {}).data || {}).data || {}).totalItems - 1,
      isProcessing: false,
    });
  }

  buildFilter() {
    const { pageIndex, pageSize, search, q} = this.state;

    
    const filter = {
      offset: pageIndex * pageSize,
      limit: pageSize,
    };

    if (q !== ''){
      filter.q = q
    }

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
        field: 'modified',
        name: 'Modified',
        sortable: true,
      },
      {
        field: 'phases',
        name: 'Phases',
        sortable: true,
      },
    ];
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

  formattedButton() {
    return (
      <EuiFlexItem grow={false}>
        <EuiButtonEmpty iconType="importAction" onClick={this.downloadCsv}>
          Formatted          
        </EuiButtonEmpty>
      </EuiFlexItem>
    );
  }

  title() {
    const formattedButton = this.formattedButton()
    return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiTitle>
                <h2>MITRE ATT&CK </h2>
              </EuiTitle>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        {formattedButton}
        <EuiFlexItem grow={false}>
          { /*<EuiButtonEmpty iconType="plusInCircle" onClick={() => this.props.addingNewAgent()}>
            Add new agent
          </EuiButtonEmpty> 
    */}
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  table(){
    const {pageIndex, pageSize, totalItems, sortField, sortDirection} = this.state
    const tactics = this.state.tactics
    const columns = this.columns()
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
              items={tactics}
              columns={columns}
              pagination={pagination}
              onChange={this.onTableChange}
              sorting={sorting}
            />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  filterBar() {
    

    return (
      <EuiFlexGroup>
        <EuiFlexItem>
           
        </EuiFlexItem>
      </EuiFlexGroup>
    );
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

MitreTable.propTypes = {
  wzReq: PropTypes.func
};
