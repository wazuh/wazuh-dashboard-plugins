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

  

  getItems() {
    const result = super.getItems()
    result.totalItemCount = this.props.totalItems
    return result;
  }
}


export class AgentsTable extends Component {

  constructor(props) {
    super(props);
    this.onTableChange = this.onTableChange.bind(this);
    this.state = {
      "pageIndex": 0,
      "previusIndex": 0,
      "totalItems": 0
    }
  }
  

  async componentDidMount() {
    await this.getAgents();
  }

  async componentDidUpdate() {
    if(this.state.pageIndex !== this.state.previusIndex){
      await this.getAgents();
      this.setState({previusIndex: this.state.pageIndex});
    }
  }

  async getAgents() {
    const checkField = (field) => { return (field !== undefined) ? field : "-"; };
    const rawAgents = await this.props.wzReq(
      'GET',
      '/agents',
      this.createFilter()
    );

    const formatedAgents = (((rawAgents || {}).data || {}).data || {}).items.map(
      (agent) => {
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
    );
    
    this.setState({totalItems: (((rawAgents || {}).data || {}).data || {}).totalItems - 1})
    this.setState({agents: formatedAgents})
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

    return (
      <div>
        
        <EuiIcon type="discoverApp" style={style} />
        <EuiIcon type="wrench" />
      </div>
    );
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
    this.setState({pageSize: page.size});
    this.setState({pageIndex: page.index});
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
              columns={this.columns()}
              sorting={true}
              search={search}
              pagination={true}
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




