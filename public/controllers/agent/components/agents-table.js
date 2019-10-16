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
    result.totalItemCount = this.props.totalitems
    return result;
  }


  onTableChange = ({ page = {}, sort = {} }) => {

    const { index: pageIndex, size: pageSize } = page;

    let { field: sortName, direction: sortDirection } = sort;
    let reportedSortName = sortName;

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
    if(this.props.items.length < this.state.pageSize){
      this.setState({pageIndex: 0});
    }
    this.setState({
      selectPage: page.index,
      pageIndex,
      pageSize,
      sortName,
      sortDirection,
    });
  };



  renderSearchBar() {
    const { search } = this.props;
    if (search) {
      const {
        onChange, // eslint-disable-line no-unused-vars
        ...searchBarProps
      } = search;

      if (searchBarProps.box && searchBarProps.box.schema === true) {
        searchBarProps.box.schema = this.resolveSearchSchema();
      }
      this.wzFilterProps = { 
        model: [
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
        ],
        clickAction: this.props.clickAction
      }

      return <WzFilterBar {...this.wzFilterProps} />;
    }
  }
  
}


export class AgentsTable extends Component {

  constructor(props) {
    super(props);
    this.onTableChange = this.onTableChange.bind(this);
    this.onQueryChange = this.onQueryChange.bind(this);
    this.state = {
      "pageIndex": 0,
      "previusIndex": 0,
      "previusSort": "",
      "previusSortDirection": "",
      "previusQ": "",
      "totalItems": 0,
      "isLoading": false
    }
  }
  

  async componentDidMount() {
    await this.getAgents();
    this.setState({isLoading: false});

  }

  async componentDidUpdate() {
    if(this.isFilterChange()){
      await this.getAgents();
      await this.getAgents();
      this.setState({previusIndex: this.state.pageIndex});
      this.setState({previusSort: this.state.sortField});
      this.setState({previusSortDirection: this.state.sortDirection});
      this.setState({previusQ: this.state.q});
      this.setState({isLoading: false});
    }
  }

  isFilterChange () {
    const pageIndexChange = this.state.pageIndex !== this.state.previusIndex;
    const sortChange = this.state.sortField !== this.state.previusSort 
      || this.state.sortDirection !== this.state.previusSortDirection;
    const qChange = this.state.q !== this.state.previusQ;
    
    return (pageIndexChange || sortChange || qChange);
  }

  async getAgents() {
    const rawAgents = await this.props.wzReq(
      'GET',
      '/agents',
      this.createFilter()
    );
    const agentsWithoutMaster = (((rawAgents || {}).data || {}).data || {}).items.filter(
      (agent) => { return (agent.id !== '000'); }
    )
    const formatedAgents = agentsWithoutMaster.map(this.formatAgent);

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
    if(this.nAgents < this.state.pageSize){
      return{beforeEmptyAgents: [], afterEmptyAgents: []};
    }
    const beforeEmptyAgents = ((this.state || {}).pageIndex)
      ? [...Array(this.state.pageIndex * this.state.pageSize).keys()]
      : [];

    const afterElements = this.state.totalItems - beforeEmptyAgents.length - nAgents;
    const afterEmptyAgents = ((this.state || {}).pageIndex)
      ? [...Array((afterElements >= 0) ? afterElements : 0).keys()]
      : [...Array(nAgents > 0 ? this.state.totalItems - nAgents: 0).keys()];
    return {beforeEmptyAgents, afterEmptyAgents};
  }

  createFilter() {
    const offset = ((this.state || {}).pageIndex !== undefined) ? (this.state || {}).pageIndex : 0;
    const limit = ((this.state || {}).pageSize !== undefined) ? (this.state || {}).pageSize : 10;
    const filter = {
      "offset": (offset * limit),
      "limit": limit + 1
    };
    this.addQFilter(filter);
    this.addSortFilter(filter);
    return filter;
  }

  addSortFilter(filter) {
    const sortFieldExists = (this.state || {}).sortField !== undefined;
    const sortFieldNotEmpty = (this.state || {}).sortField !== "";
    if (sortFieldExists && sortFieldNotEmpty) {
      const fields = this.columns().filter((field) => {
        return (field.field === this.state.sortField || field.name === this.state.sortField);
      })
      if(fields.length < 0) {
        return;
      }
      const direction = (this.state || {}).sortDirection === 'asc' ? '+' : '-';
      if (fields[0].field === 'os_name') {
        filter.sort = direction + 'os.name,os.version';            
      } else {
        filter.sort = direction + fields[0].field;
      }
    }
  }

  addQFilter(filter) {
    const qFieldExists = (this.state || {}).q !== undefined;
    const qFieldNotEmpty = (this.state || {}).q !== "";
    if (qFieldExists && qFieldNotEmpty) {
      filter.q = this.state.q;
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
      isLoading:true,
      sortField: sort.field,
      sortDirection: sort.direction
    })
  }

  onQueryChange ({q, search}) {
    if ((this.state || {}).q !== q) {
      this.setState({q: q});
    }

    if((this.state || {}).search !== search) {
      this.setState({search: search});
    }
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
      pageIndex: this.state.pageIndex,
      pageSize: 10,
      totalItemCount: this.state.totalItems,
      hidePerPageOptions: true
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
        <EuiFlexGroup>
          <EuiFlexItem>
            <WzInMemoryTable
              itemId="id"
              items={(this.state || {}).agents}
              loading={this.state.isLoading}
              columns={this.columns()}
              sorting={true}
              search={search}
              pagination={pagination}
              totalitems={this.state.totalItems}
              onTableChange={this.onTableChange}
              clickAction={this.onQueryChange}
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




