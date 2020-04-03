/*
 * Wazuh app - Integrity monitoring table component
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
  EuiBasicTable,
  EuiButtonIcon,
  EuiHealth,
  EuiButton,
  EuiDescriptionList,
} from '@elastic/eui';
import './discover.less';
import { EuiFlexGroup } from '@elastic/eui';
import { EuiFlexItem } from '@elastic/eui';
import { GenericRequest } from '../../../../react-services/generic-request';
import { agent } from 'supertest';
import { EuiFlexGrid } from '@elastic/eui';
import { RowDetails } from './row-details';
import { FilterBar } from '../../../agents/fim/states/filterBar'


export class Discover extends Component {
  state: {
    filters: Array<Object>,
    sort: Object,
    alerts: Array<Object>,
    total: Number,
    pageIndex: Number,
    pageSize: Number,
    sortField: string,
    sortDirection: string,
    isLoading: boolean,
    requestFilters: Object,
    requestSize: Number
    requestOffset: Number
    itemIdToExpandedRowMap: Object
  };

  props!: {
    filters: Object
  }

  constructor(props) {
    super(props);

    this.state = {
      filters: [],
      sort: {},
      alerts: [],
      total: 0,
      pageIndex: 0,
      pageSize: 10,
      sortField: 'timestamp',
      sortDirection: 'asc',
      isLoading: true,
      requestFilters: {},
      requestSize: 500,
      requestOffset: 0,
      itemIdToExpandedRowMap: {}
    }
  }

  async componentDidMount() {
    try{
      await this.getAlerts();
    }catch(err){
      console.log(err);
    }
  }

 


  toggleDetails = item => {
    const itemIdToExpandedRowMap = { ...this.state.itemIdToExpandedRowMap };
    if (itemIdToExpandedRowMap[item._id]) {
      delete itemIdToExpandedRowMap[item._id];
      this.setState({ itemIdToExpandedRowMap });
    } else {
      const newItemIdToExpandedRowMap = {};
      newItemIdToExpandedRowMap[item._id] = (
        (<div style={{width: "100%"}}> <RowDetails item={item}/></div>)
      );
      this.setState({ itemIdToExpandedRowMap:newItemIdToExpandedRowMap });
    }
  };

  buildFilter(){
    const testFilters = [{ "rule.groups" : "syscheck"}, { ...this.props.filters}];
    const sort = {};
    if(this.state.sortField){
      sort[this.state.sortField] = {"order" : this.state.sortDirection};
    }
    const offset = Math.floor( (this.state.pageIndex * this.state.pageSize) / this.state.requestSize ) * this.state.requestSize;
    const timeFilter = { from : 'now-1dy', to: 'now'};


   return {filters: testFilters, sort, ...timeFilter, offset};
  }

  async getAlerts() {
    //compare filters so we only make a request into Elasticsearch if needed
    const newFilters = this.buildFilter();
    if(JSON.stringify(newFilters) !== JSON.stringify(this.state.requestFilters)){
      this.setState({ isLoading: true})
      const alerts = await GenericRequest.request(
        'POST',
        `/elastic/alerts`,
        newFilters
      );

      this.setState({alerts: alerts.data.alerts, total: alerts.data.hits, isLoading: false, requestFilters: newFilters})
    }
  }

  columns() {
    return [
      {
        field: 'timestamp',
        name: 'Time',
        sortable:true
      },
      {
        field: 'syscheck.event',
        name: 'Action',
        sortable:true
      },
      {
        field: 'rule.description',
        name: 'Rule description',
        sortable:true
      },
      {
        field: 'rule.level',
        name: 'Rule level',
        sortable:true
      },
      {
        field: 'rule.id',
        name: 'Rule ID',
        sortable:true
      },
    ]
  }

  onTableChange = ({ page = {}, sort = {} }) => {
    const { index: pageIndex, size: pageSize } = page;
    const { field: sortField, direction: sortDirection } = sort;

    this.setState({
      pageIndex: pageIndex,
      pageSize,
      sortField,
      sortDirection,
    }, async() => this.getAlerts())
  };
  

  getpageIndexItems(){
    let items = [];
    
    const start = (this.state.pageIndex * this.state.pageSize)%this.state.requestSize;
    const end = start + this.state.pageSize
    for(let i=start; i<end && (this.state.pageIndex * this.state.pageSize) < this.state.total ; i++){
      if(this.state.alerts[i] && this.state.alerts[i]._source){
        items.push( { ...this.state.alerts[i]._source, _id :this.state.alerts[i]._id })
      }
    }
    return items;

  }



  render() {
    const getRowProps = item => {
      const { _id } = item;
      return {
        'data-test-subj': `row-${_id}`,
        className: 'customRowClass',
        onClick: () => this.toggleDetails(item),
      };
    };

    const pageIndexItems = this.getpageIndexItems();
    const columns = this.columns();

    const sorting = {sort:  {
      field: this.state.sortField,
      direction: this.state.sortDirection,
      }
    };
    const pagination = {
      pageIndex: this.state.pageIndex,
      pageSize: this.state.pageSize,
      totalItemCount: this.state.total,
      pageSizeOptions: [10, 25, 50],
    };
    if(this.state.total){
      return (
        <div>
             <EuiFlexGroup>
            <EuiFlexItem>
             {/*  TODO -- search bar */}
            
              <FilterBar
                onFiltersChange={() => alert("TODO")} />
            </EuiFlexItem>
            </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
             {pageIndexItems.length && (
              <EuiBasicTable
                items={pageIndexItems}
                itemId="_id"
                itemIdToExpandedRowMap={this.state.itemIdToExpandedRowMap}
                isExpandable={true}
                columns={columns}
                rowProps={getRowProps}
                pagination={pagination}
                sorting={sorting}
                onChange={this.onTableChange}
              />
          )}
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>);
    }else{
      return ( <div>There are no events for this file.</div>)
    }
    
  }
}
