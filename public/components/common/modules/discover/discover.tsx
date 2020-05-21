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

import React, { Component, } from 'react';
import { I18nProvider } from '@kbn/i18n/react'
import './discover.less';
import { KibanaContextProvider } from '../../../../../../../src/plugins/kibana_react/public/context'
import { SearchBar, FilterManager } from '../../../../../../../src/plugins/data/public/'
import { GenericRequest } from '../../../../react-services/generic-request';
import { AppState } from '../../../../react-services/app-state';
import { RowDetails } from './row-details';
//@ts-ignore
import { npSetup } from 'ui/new_platform';
//@ts-ignore
import { getServices } from 'plugins/kibana/discover/kibana_services';
import DateMatch from '@elastic/datemath';
import { toastNotifications } from 'ui/notify';

import {
  EuiBasicTable,
  EuiLoadingSpinner,
  EuiTableSortingType,
  EuiFlexItem,
  EuiFlexGroup,
  Direction,
  EuiSpacer,
  EuiCallOut,
  EuiIcon,
  EuiButtonIcon,
  EuiToolTip
} from '@elastic/eui';
import {
  IIndexPattern,
  TimeRange,
  Query,
  esFilters,
  esQuery,
  IFieldType
} from '../../../../../../../src/plugins/data/public';
import '../../../../components/agents/fim/inventory/inventory.less';

export class Discover extends Component {
  _isMount!: boolean;
  timefilter: {
    getTime(): TimeRange
    setTime(time: TimeRange): void
    _history: { history: { items: { from: string, to: string }[] } }
  };

  KibanaServices: { [key: string]: any };
  filterManager: FilterManager;
  state: {
    sort: object,
    alerts: { _source: {}, _id: string }[],
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
    dateRange: TimeRange,
    query: Query,
    searchBarFilters: esFilters.Filter[],
    elasticQuery: object
    filters: [],
    columns: string[],
    hover: string
  };
  indexPattern!: IIndexPattern
  props!: {
    implicitFilters: object[],
    initialFilters: object[],
    type: any,
    updateTotalHits: Function,
    includeFilters: string,
    initialColumns: string[]
  }
  constructor(props) {
    super(props);
    this.KibanaServices = getServices();
    this.filterManager = new FilterManager(npSetup.core.uiSettings);
    this.timefilter = this.KibanaServices.timefilter;
    this.state = {
      sort: {},
      alerts: [],
      total: 0,
      pageIndex: 0,
      pageSize: 10,
      sortField: 'timestamp',
      sortDirection: 'desc',
      isLoading: false,
      requestFilters: {},
      requestSize: 500,
      requestOffset: 0,
      itemIdToExpandedRowMap: {},
      dateRange: this.timefilter.getTime(),
      query: { language: "kuery", query: "" },
      searchBarFilters: [],
      elasticQuery: {},
      filters: props.initialFilters,
      columns: [],
      hover: ""
    }

    this.nameEquivalences = {
      "syscheck.event": "Action",
      "rule.id": "Rule ID",
      "rule.description": "Rule description",
      "rule.level": "Rule level",
      "rule.mitre.id": "Mitre technique",
      "rule.mitre.tactics": "Mitre tactics",
    }

    this.hideCreateCustomLabel.bind(this);
    this.onQuerySubmit.bind(this);
    this.onFiltersUpdated.bind(this);
    this.hideCreateCustomLabel()
  }

  showToast = (color, title, time) => {
    toastNotifications.add({
      color: color,
      title: title,
      toastLifeTimeMs: time,
    });
  };

  async componentDidMount () {
    this._isMount = true;
    try {
      this.setState({columns: this.props.initialColumns}) //initial columns
      await this.getIndexPattern(); 
      this.getAlerts();
    } catch (err) {
      console.log(err);
    }
  }

 

  componentWillUnmount() {
    this._isMount = false;
  }

  async componentDidUpdate() {
    if (!this._isMount) { return; }
    try {
      await this.getAlerts();
    } catch (err) {
      console.log(err);
    }
  }

  async getIndexPattern () {
    this.indexPattern = {...await this.KibanaServices.indexPatterns.get(AppState.getCurrentPattern())};
    const fields:IFieldType[] = [];
    Object.keys(this.indexPattern.fields).forEach(item => {
      if (isNaN(item)) { 
        fields.push(this.indexPattern.fields[item]);
      } else if (!this.props.includeFilters || (this.props.includeFilters && this.indexPattern.fields[item].name.includes(this.props.includeFilters))) {
        fields.push(this.indexPattern.fields[item]);
      }
    })
    this.indexPattern.fields = fields;
  }

  hideCreateCustomLabel = () => {
    try {
      const button = document.querySelector(".wz-discover #addFilterPopover > div > button > span > span") ;
      if ( !button ) return setTimeout(this.hideCreateCustomLabel, 100);
      const findAndHide = () => {
        const switcher = document.querySelector("#filterEditorCustomLabelSwitch")
        if ( !switcher ) return setTimeout(findAndHide, 100);
        console.log(switcher.parentElement);
        switcher.parentElement.style.display = "none"
      }
      button.onclick = findAndHide;
    } catch (error) { }
  }

  filtersAsArray(filters) {
    const keys = Object.keys(filters);
    const result: {}[] = [];
    for (var i = 0; i < keys.length; i++) {
      const item = {};
      item[keys[i]] = filters[keys[i]];
      result.push(item);
    }
    return result;
  }

  onFiltersChange = (filters) => {
    this.setState({ filters: this.filtersAsArray(filters) });
  }

  toggleDetails = item => {
    const itemIdToExpandedRowMap = { ...this.state.itemIdToExpandedRowMap };
    if (itemIdToExpandedRowMap[item._id]) {
      delete itemIdToExpandedRowMap[item._id];
      this.setState({ itemIdToExpandedRowMap });
    } else {
      const newItemIdToExpandedRowMap = {};
      newItemIdToExpandedRowMap[item._id] = (
        (<div style={{ width: "100%" }}> <RowDetails item={item} addFilter={(filter) => this.addFilter(filter)} addFilterOut={(filter) => this.addFilterOut(filter)} toggleColumn={(id) => this.addColumn(id)} /></div>)
      );
      this.setState({ itemIdToExpandedRowMap: newItemIdToExpandedRowMap });
    }
  };

  buildFilter() {
    const dateParse = ds => /\d+-\d+-\d+T\d+:\d+:\d+.\d+Z/.test(ds) ? DateMatch.parse(ds).toDate().getTime() : ds;
    const { searchBarFilters, query } = this.state;
    const elasticQuery =
      esQuery.buildEsQuery(
        undefined,
        query,
        searchBarFilters,
        esQuery.getEsQueryConfig(npSetup.core.uiSettings)
      );
    const pattern = AppState.getCurrentPattern();
    const { filters, sortField, sortDirection } = this.state;
    const { from:oldFrom, to:oldTo } = this.timefilter.getTime();
    const sort = { ...(sortField && { [sortField]: { "order": sortDirection } }) };
    const offset = Math.floor((this.state.pageIndex * this.state.pageSize) / this.state.requestSize) * this.state.requestSize;
    const from = dateParse(oldFrom);
    const to = dateParse(oldTo);
    return { filters, sort, from, to, offset, pattern, elasticQuery };
  }

  async getAlerts() {
    //compare filters so we only make a request into Elasticsearch if needed
      const newFilters = this.buildFilter();
    try{
      if (JSON.stringify(newFilters) !== JSON.stringify(this.state.requestFilters) && !this.state.isLoading) {
        this.setState({ isLoading: true, pageIndex:0 })
        const alerts = await GenericRequest.request(
          'POST',
          `/elastic/alerts`,
          {
            ...newFilters,
            filters: [...newFilters['filters'], ...this.props.implicitFilters]
          }
        );
        if (this._isMount) {
          this.setState({ alerts: alerts.data.alerts, total: alerts.data.hits, isLoading: false, requestFilters: newFilters, filters: newFilters.filters });
          this.props.updateTotalHits(alerts.data.hits);
         
        }
      }
    }catch(err){
      if (this._isMount) {
        this.setState({ alerts: [], total: 0, isLoading: false, requestFilters: newFilters, filters: newFilters.filters });
        this.props.updateTotalHits(0);
      }
    }
  }

  removeColumn(id){
    if(this.state.columns.length < 2){
      this.showToast('warning', "At least one column must be selected",3000);
      return;
    }
    const columns = this.state.columns;
    columns.splice(columns.findIndex(v => v === id), 1);
    this.setState(columns)
  }

  addColumn(id){ 
    if(this.state.columns.length > 11){
      this.showToast('warning', 'The maximum number of columns is 10',3000);
      return;
    }
    if(this.state.columns.find(element => element === id)){
      this.removeColumn(id);
      return;
    }
    const columns = this.state.columns;
    columns.push(id);
    this.setState(columns)
  }


  columns = () => {
    const columns = this.state.columns.map((item) => {
      if(item === "icon"){
        return  {
          width: "25px",
          isExpander: true,
          render: item => {
            return (
              <EuiIcon size="s" type={this.state.itemIdToExpandedRowMap[item._id] ? "arrowDown" : "arrowRight"} />
            )
          },
        }
      }
      if(item === "timestamp"){
        return  {
          field: 'timestamp',
          name: 'Time',
          sortable: true,
          render: time => {
            const date = time.split('.')[0];
            return <span>{date.split('T')[0]} {date.split('T')[1]}</span>
          },
        }
      }

      return {
        field: item,
        name: (<span 
          onMouseEnter={() => { this.setState({hover: item}) }}
          onMouseLeave={() => { this.setState({hover: ""}) }}
          style={{display: "inline-flex"}}>{this.nameEquivalences[item] || item} {this.state.hover === item &&
          <EuiToolTip position="top" content={`Remove column`}>
            <EuiButtonIcon
              style={{paddingBottom: 12, marginBottom: "-10px", paddingTop: 0}}
              onClick={(e) => { this.removeColumn(item); e.stopPropagation();}}
              iconType="cross"
              aria-label="Filter"
              iconSize="s"
            />
          </EuiToolTip>} 
        </span>),
        sortable: true
      }


    })
    return columns;
  }

  onTableChange = ({ page = {}, sort = {} }) => {
    const { index: pageIndex, size: pageSize } = page;
    const { field: sortField, direction: sortDirection } = sort;

    this.setState({
      pageIndex,
      pageSize,
      sortField,
      sortDirection,
    }, async () => this.getAlerts())
  };


  getpageIndexItems() {
    let items: {}[] = [];

    const start = (this.state.pageIndex * this.state.pageSize) % this.state.requestSize;
    const end = start + this.state.pageSize
    for (let i = start; i < end && (this.state.pageIndex * this.state.pageSize) < this.state.total; i++) {
      if (this.state.alerts[i] && this.state.alerts[i]._source) {
        items.push({ ...this.state.alerts[i]._source, _id: this.state.alerts[i]._id })
      }
    }
    return items;

  }

  getFiltersAsObject(filters) {
    var result = {};
    for (var i = 0; i < filters.length; i++) {
      result = { ...result, ...filters[i] }
    }
    return result;
  }

   /**
   * Adds a new negated filter with format { "filter_key" : "filter_value" }, e.g. {"agent.id": "001"}
   * @param filter 
   */
  addFilterOut(filter) {
    const key = Object.keys(filter)[0];
    const value = filter[key];
    const valuesArray = Array.isArray(value) ? [...value] : [value];
    const filters = this.state.searchBarFilters;
    valuesArray.map((item) => {
      const formattedFilter = esFilters.buildPhraseFilter({ name: key, type: "string" }, item, this.indexPattern);
      formattedFilter.meta.negate = true;

      filters.push(formattedFilter);
    })

    this.filterManager.setFilters(filters);
    this.setState({ searchBarFilters: filters });
  }

  /**
   * Adds a new filter with format { "filter_key" : "filter_value" }, e.g. {"agent.id": "001"}
   * @param filter 
   */
  addFilter(filter) {
    const key = Object.keys(filter)[0];
    const value = filter[key];
    const valuesArray = Array.isArray(value) ? [...value] : [value];
    const filters = this.state.searchBarFilters;
    valuesArray.map((item) => {
      const formattedFilter = esFilters.buildPhraseFilter({ name: key, type: "string" }, item, this.indexPattern);

      filters.push(formattedFilter);
    })

    this.filterManager.setFilters(filters);
    this.setState({ searchBarFilters: filters });
  }

  onQuerySubmit = (payload: { dateRange: TimeRange, query: Query | undefined }) => {
    const { dateRange, query } = payload;
    this.timefilter.setTime(dateRange);
    this.setState({ dateRange, query });
  }

  onFiltersUpdated = (filters: esFilters.Filter[]) => {
    this.filterManager.setFilters(filters);
    this.setState({ searchBarFilters: filters });
  }

  getSearchBar() {
    const { filterManager, KibanaServices } = this;
    const storage = {
      ...window.localStorage,
      get: (key) => JSON.parse(window.localStorage.getItem(key) || '{}'),
      set: (key, value) => window.localStorage.setItem(key, JSON.stringify(value)),
      remove: (key) => window.localStorage.removeItem(key)
    }
    const http = {
      ...KibanaServices.indexPatterns.apiClient.http
    }
    const savedObjects = {
      ...KibanaServices.indexPatterns.savedObjectsClient
    }
    const data = {
      ...KibanaServices.data,
      query: {
        ...KibanaServices.data.query,
        filterManager,
      }
    }
    const { dateRange, query, searchBarFilters } = this.state;
    return (
      <KibanaContextProvider services={{
          ...KibanaServices,
          appName: "wazuhFim",
          data,
          filterManager,
          storage,
          http,
          savedObjects
        }} >
        <I18nProvider>
          <SearchBar
            indexPatterns={[this.indexPattern]}
            filters={searchBarFilters}
            dateRangeFrom={dateRange.from}
            dateRangeTo={dateRange.to}
            onQuerySubmit={this.onQuerySubmit}
            onFiltersUpdated={this.onFiltersUpdated}
            query={query}
            timeHistory={this.timefilter._history}
            {...{ appName: 'wazuhFim' }} />
        </I18nProvider>
      </KibanaContextProvider>
    );
  }

  render() {
    if (this.state.isLoading)
      return (<div style={{ alignSelf: "center" }}><EuiLoadingSpinner size="xl" /> </div>)
    const {total, searchBarFilters, itemIdToExpandedRowMap} = this.state;

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

    const sorting: EuiTableSortingType<{}> = {
      sort: {
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
    const noResultsText = `No results match for this ${this.props.type === 'file' ? 'file' : 'registry'} and search criteria`
    return (
      <div
        className='wz-discover hide-filter-controll' >
        {this.getSearchBar()}
        {total 
          ? <EuiFlexGroup>
              <EuiFlexItem>
                {pageIndexItems.length && (
                  <EuiBasicTable
                    items={pageIndexItems}
                    className="module-discover-table"
                    itemId="_id"
                    itemIdToExpandedRowMap={itemIdToExpandedRowMap}
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
          : <EuiFlexGroup>
              <EuiFlexItem>
                <EuiSpacer size="s" />
                <EuiCallOut title={noResultsText} color="warning" iconType="alert" />
              </EuiFlexItem>
            </EuiFlexGroup>
        }
      </div>);
  }
}
