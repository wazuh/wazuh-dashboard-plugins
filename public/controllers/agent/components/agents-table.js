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

class WzInMemoryTable extends EuiInMemoryTable {

  constructor(props) {
    super(props);

  }

  componentDidUpdate() {
    if ((this.state || {}).selectPage !== undefined){
      if ((this.state || {}).selectPage !== (this.state || {}).pageIndex){
        this.setState({ pageIndex: this.state.selectPage });
      }
    }
  }

  getItems() {
    const result = super.getItems()
    result.totalItemCount = this.props.totalItems
    return result;
  }


  onTableChange = ({ page = {}, sort = {} }) => {

    const { index: pageIndex, size: pageSize } = page;

    let { field: sortName, direction: sortDirection } = sort;

    // To keep backwards compatibility reportedSortName needs to be tracked separately
    // from sortName; sortName gets stored internally while reportedSortName is sent to the callback
    let reportedSortName = sortName;

    // EuiBasicTable returns the column's `field` if it exists instead of `name`,
    // map back to `name` if this is the case
    for (let i = 0; i < this.props.columns.length; i++) {
      const column = this.props.columns[i];
      if (column.field === sortName) {
        sortName = column.name;
        break;
      }
    }

    // Allow going back to 'neutral' sorting
    if (
      this.state.allowNeutralSort &&
      this.state.sortName === sortName &&
      this.state.sortDirection === 'desc' &&
      sortDirection === 'asc'
    ) {
      sortName = '';
      reportedSortName = '';
      sortDirection = '';
    }

    if (this.props.onTableChange) {
      this.props.onTableChange({
        page,
        sort: {
          field: reportedSortName,
          direction: sortDirection,
        },
      });
    }

    this.setState({
      selectPage: page.index,
      pageIndex,
      pageSize,
      sortName,
      sortDirection,
    });
  };
}


export class AgentsTable extends Component {

  constructor(props) {
    super(props);
    this.onTableChange = this.onTableChange.bind(this);
    this.state = {
      "pageIndex": 0,
      "previusIndex": 0,
      "totalItems": 0,
      "isLoading": false
    }
  }
  

  async componentDidMount() {
    await this.getAgents();
    this.setState({isLoading: false});
  }

  async componentDidUpdate() {
    if(this.state.pageIndex !== this.state.previusIndex){
      await this.getAgents();
      this.setState({previusIndex: this.state.pageIndex});
      this.setState({isLoading: false});
    }
  }

  async getAgents() {
    const rawAgents = await this.props.wzReq(
      'GET',
      '/agents',
      this.createFilter()
    );

    const formatedAgents = (((rawAgents || {}).data || {}).data || {}).items.map(this.formatAgent);

    this.setState({totalItems: (((rawAgents || {}).data || {}).data || {}).totalItems - 1});

    const {beforeEmptyAgents, afterEmptyAgents} = this.generateEmpties(formatedAgents.length);
    this.setState({agents: [...beforeEmptyAgents, ...formatedAgents, ...afterEmptyAgents] });
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

  generateEmpties(nAgents) {
    const beforeEmptyAgents = ((this.state || {}).pageIndex)
      ? [...Array(this.state.pageIndex * this.state.pageSize).keys()]
      : [];
    const afterEmptyAgents = ((this.state || {}).pageIndex)
      ? [...Array(this.state.totalItems - beforeEmptyAgents.length - nAgents).keys()]
      : [...Array(this.state.totalItems - nAgents).keys()];

    return {beforeEmptyAgents, afterEmptyAgents};
  }

  createFilter(){
    const offset = ((this.state || {}).pageIndex !== undefined) ? (this.state || {}).pageIndex : 0;
    const limit = ((this.state || {}).pageSize !== undefined) ? (this.state || {}).pageSize : 10;
    return {
      "offset": (offset * limit) + 1,
      "limit": limit
    }
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

  actions(item) {
    const style = {
      marginRight: 5
    }
    if(item){
      return (
        <div>
          <EuiIcon type="discoverApp" style={style} />
          <EuiIcon type="wrench" />
        </div>
      );
    } else {
      return (
      <div>
        <EuiIcon type="wrench" style={{fillOpacity: 0}} />
      </div>
      );
    }
  };

  formattedButton() {
    return (
      <EuiFlexItem grow={false}>
        <EuiButtonEmpty iconType="importAction" onClick={() => this.refresh()}>
          Formatted          
        </EuiButtonEmpty>
      </EuiFlexItem>
    );
  }
  onTableChange ({page = {}, sort = {}})  {
    this.setState({
      pageSize: page.size,
      pageIndex: page.index,
      isLoading:true
    })
  }

  
  render() {

    const search = {
      box: {
        incremental: false,
        schema: {
          "strict": true,
          "fields":{
            "status": {
              "type":"string"
            }
          }
        },
      }
    };

    const pagination = {
      pageIndex: 0,
      pageSize: 10,
      totalItemCount: this.state.totalItems,
      hidePerPageOptions: true
    }

    const groupStyle = {
      margin: 15
    }
    return (
      
      <EuiPanel paddingSize="l">
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
          <this.formattedButton />
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty iconType="plusInCircle" onClick={() => this.refresh()}>
              Add new agent
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup style={groupStyle}>
          <EuiFlexItem>
            <WzInMemoryTable
              itemId="id"
              items={(this.state || {}).agents}
              loading={this.state.isLoading}
              columns={this.columns()}
              sorting={true}
              search={search}
              pagination={pagination}
              totalItems={this.state.totalItems}
              onTableChange={this.onTableChange}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    );
  }
}

AgentsTable.propTypes = {
  wzReq: PropTypes.func
};




