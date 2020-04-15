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

import React, { Component, Fragment, } from 'react';
import { I18nProvider } from '../../../../../../../packages/kbn-i18n/src/react'
import {
  EuiBasicTable,
  EuiLoadingSpinner,
  OnTimeChangeProps,
  EuiTableSortingType,
  EuiFlexItem,
  EuiFlexGroup,
  Direction,
  EuiFieldText
} from '@elastic/eui';

import './discover.less';
import { KibanaContextProvider } from '../../../../../../../src/plugins/kibana_react/public/context'
import { SearchBar } from '../../../../../../../src/plugins/data/public/'

import { GenericRequest } from '../../../../react-services/generic-request';
import { AppState } from '../../../../react-services/app-state';
import { RowDetails } from './row-details';
import { WzDatePicker } from '../../../../components/wz-date-picker';
//@ts-ignore
import { getServices } from 'plugins/kibana/discover/kibana_services';
import { IIndexPattern } from '../../../../../../../src/plugins/data/common';
import { esFilters } from '../../../../../../../src/plugins/data/common/es_query';

interface IDiscoverTime { from:string, to:string };

export class Discover extends Component {
  timefilter: {
    getTime(): IDiscoverTime
    setTime(time:IDiscoverTime): void
    _history: {history:{items:{from:string, to:string}[]}}
  };
  
  state: {
    filters: esFilters.Filter[],
    sort: object,
    alerts: {_source:{}, _id:string}[],
    total: number,
    pageIndex: number,
    pageSize: number,
    sortField: string,
    sortDirection: Direction,
    isLoading: boolean,
    requestFilters: object,
    requestSize: number
    requestOffset: number
    itemIdToExpandedRowMap: any,
    datePicker: OnTimeChangeProps,
  };
  indexPattern!: IIndexPattern
  props!: {
    implicitFilters: object[],
    initialFilters: object[],
  }
  constructor(props) {
    super(props);
    this.timefilter = getServices().timefilter;
    const { from, to } = this.timefilter.getTime();
    this.state = {
      filters: [],
      sort: {},
      alerts: [],
      total: 0,
      pageIndex: 0,
      pageSize: 10,
      sortField: 'timestamp',
      sortDirection: 'asc',
      isLoading: false,
      requestFilters: {},
      requestSize: 500,
      requestOffset: 0,
      itemIdToExpandedRowMap: {},
      datePicker: {
        start: from, 
        end: to,
        isQuickSelection: true,
        isInvalid: false,
      },
    }

    this.onTimeChange.bind(this);
  }

  async componentDidMount() {
    try{
      this.indexPattern = await getServices().indexPatterns.get("wazuh-alerts-3.x-*")
      const { initialFilters = [] } = this.props;
      this.setState({ filters: initialFilters });
    }catch(err){
      console.log(err);
    }
  }

  async componentDidUpdate() {
    try{
      // await this.getAlerts();
    }catch(err){
      console.log(err);
    }
  }

  filtersAsArray(filters){
    const keys = Object.keys(filters);
    const result:{}[] = [];
    for(var i=0; i<keys.length; i++){
      const item = {};
      item[keys[i]] = filters[keys[i]];
      result.push(item);
    }
    return result;
  }

  onFiltersChange = (filters) => {
    this.setState({filters: this.filtersAsArray(filters)});
  }

  toggleDetails = item => {
    const itemIdToExpandedRowMap = { ...this.state.itemIdToExpandedRowMap };
    if (itemIdToExpandedRowMap[item._id]) {
      delete itemIdToExpandedRowMap[item._id];
      this.setState({ itemIdToExpandedRowMap });
    } else {
      const newItemIdToExpandedRowMap = {};
      newItemIdToExpandedRowMap[item._id] = (
        (<div style={{width: "100%"}}> <RowDetails item={item} addFilter={(filter) => this.addFilter(filter)}/></div>)
      );
      this.setState({ itemIdToExpandedRowMap:newItemIdToExpandedRowMap });
    }
  };

  buildFilter(){
    const pattern = AppState.getCurrentPattern();
    const { filters, sortField, sortDirection } = this.state;
    const {from, to} = this.timefilter.getTime();
    const sort = {...(sortField && {[sortField]: {"order": sortDirection}})};
    const offset = Math.floor( (this.state.pageIndex * this.state.pageSize) / this.state.requestSize ) * this.state.requestSize;

    return {filters, sort, from, to, offset, pattern};
  }

  async getAlerts() {
    //compare filters so we only make a request into Elasticsearch if needed
    const newFilters = this.buildFilter();
    if(JSON.stringify(newFilters) !== JSON.stringify(this.state.requestFilters) && !this.state.isLoading){
      this.setState({ isLoading: true})
      const oldFilters = newFilters.filters;
      newFilters.filters =  this.props.implicitFilters.concat(newFilters.filters); // we add the implicit filters
      
      const alerts = await GenericRequest.request(
        'POST',
        `/elastic/alerts`,
        newFilters
      );
      newFilters.filters = oldFilters;
      this.setState({alerts: alerts.data.alerts, total: alerts.data.hits, isLoading: false, requestFilters: newFilters, filters:newFilters.filters})
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
      pageIndex,
      pageSize,
      sortField,
      sortDirection,
    }, async() => this.getAlerts())
  };
  

  getpageIndexItems(){
    let items:{}[] = [];
    
    const start = (this.state.pageIndex * this.state.pageSize)%this.state.requestSize;
    const end = start + this.state.pageSize
    for(let i=start; i<end && (this.state.pageIndex * this.state.pageSize) < this.state.total ; i++){
      if(this.state.alerts[i] && this.state.alerts[i]._source){
        items.push( { ...this.state.alerts[i]._source, _id :this.state.alerts[i]._id })
      }
    }
    return items;

  }

  onTimeChange = (datePicker: OnTimeChangeProps) => {
    const {start:from, end:to} = datePicker;
    this.setState({datePicker});
    this.timefilter.setTime({from, to});
  }

  getFiltersAsObject(filters){
    var result = {};
    for (var i = 0; i < filters.length; i++) {
      result = {...result, ...filters[i]}
    }
    return result;
  }

  /**
   * Adds a new filter with format { "filter_key" : "filter_value" }, e.g. {"agent.id": "001"}
   * @param filter 
   */
  addFilter(filter){
    const filters = this.state.filters;
    filters.push(filter);
    this.setState({filters});
  }

  getSearchBar(){
    return (
      <Fragment>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFieldText
              fullWidth={true} />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <WzDatePicker onTimeChange={this.onTimeChange} />
          </EuiFlexItem>
        </EuiFlexGroup>
        <KibanaContextProvider services={{...getServices(), storage: {...window.localStorage, get: (key) => window.localStorage.getItem(key), set: (key, value) => window.localStorage.setItem(key, value), remove: (key) => window.localStorage.removeItem(key) }}} > 
          <I18nProvider>
            <SearchBar 
              indexPatterns={[this.indexPattern]}
              filters={this.state.filters}
              dateRangeFrom="now-15m"
              screenTitle=""
              dateRangeTo="now"
              onQuerySubmit={e=> console.log(e)}
              onQueryChange={e=> console.log(e)}
              onRefreshChange={e=> console.log(e)}
              onClearSavedQuery={()=> console.log()}
              isRefreshPaused={true}
              refreshInterval={0}
              onFiltersUpdated={filters => {this.setState({filters}); getServices().data.query.filterManager.setFilters(filters)}}
              query={{language: "kuery", query: ""}}
              timeHistory={this.timefilter._history}
              savedQuery={undefined}
               />
          </I18nProvider>
        </KibanaContextProvider>
      </Fragment>
    )
  }

  render() {
   if(this.state.isLoading)
      return (<div style={{alignSelf: "center"}}><EuiLoadingSpinner  size="xl"/> </div>)

  
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

    const sorting:EuiTableSortingType<{}> = {
      sort:  {
        //@ts-ignore
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
      return (
        <div>
          {this.state.total && (
            <div>
              {this.getSearchBar()}
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
          </div>
          ) || (
            <div>
              {this.getSearchBar()}
              <EuiFlexGroup>
                <EuiFlexItem>
                  There are no events for this file.
                </EuiFlexItem>
              </EuiFlexGroup>
            </div>
          )}
        </div>);    
  }
}
