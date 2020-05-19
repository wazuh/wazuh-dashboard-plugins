/*
 * Wazuh app - Mitre alerts components
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react'
import { Tactics, Techniques } from './components'; 
import { ModulesHelper } from '../../common/modules'
import { 
  EuiPage,
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer
} from '@elastic/eui';
import { ApiRequest } from '../../../react-services/api-request';
import { toastNotifications } from 'ui/notify';
import { IFilterParams, getElasticAlerts, getIndexPattern } from './lib';

import { SearchBar, FilterManager } from '../../../../../../src/plugins/data/public/';
import { KibanaContextProvider } from '../../../../../../src/plugins/kibana_react/public/context';
import { I18nProvider } from '@kbn/i18n/react';
//@ts-ignore
import { npSetup } from 'ui/new_platform';
//@ts-ignore
import { getServices } from 'plugins/kibana/discover/kibana_services';
import DateMatch from '@elastic/datemath';

import {
  TimeRange,
  Query,
  esFilters
} from '../../../../../../src/plugins/data/common';

export interface ITactic {
  [key:string]: string[]
}


export class Mitre extends Component {
  _isMount = false;
  timefilter: {
    getTime(): TimeRange
    setTime(time: TimeRange): void
    _history: { history: { items: { from: string, to: string }[] } }
  };

  KibanaServices: { [key: string]: any };
  filterManager: FilterManager;
  indexPattern: any;
  destroyWatcher: any;
  state: {
    dateRange: TimeRange,
    tacticsObject: ITactic,
    selectedTactics: Object,
    filterParams: IFilterParams,
    query: Query,
    searchBarFilters: esFilters.Filter[],
  } 

  props: any;

  constructor(props) {
    super(props);
    this.KibanaServices = getServices();
    this.filterManager = this.KibanaServices.filterManager;
    this.timefilter = this.KibanaServices.timefilter;
    this.state = {
      tacticsObject: {},
      selectedTactics: {},
      filterParams: {
        filters: [],
        query: { language: 'kuery', query: '' },
        time: {from: 'now/d', to: 'now/d'},
      },
      dateRange: this.timefilter.getTime(),
      query: { language: "kuery", query: "" },
      searchBarFilters: [],
    }
    this.onChangeSelectedTactics.bind(this);
    this.onQuerySubmit.bind(this);
    this.onFiltersUpdated.bind(this);
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


  async componentDidMount(){
    this._isMount = true;
    this.indexPattern = await getIndexPattern();
    await this.buildTacticsObject();
  }

  componentWillUnmount() {
    this._isMount = false;

  }

  showToast = (color, title, text, time) => {
    toastNotifications.add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time
    });
  };


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
      }
    }
    const { dateRange, query, searchBarFilters } = this.state;
    return (
      <KibanaContextProvider services={{
          ...KibanaServices,
          appName: "wazuhMitre",
          data,
          storage,
          http,
          savedObjects
        }} >
        <I18nProvider>
          <SearchBar
            indexPatterns={[this.indexPattern]}
            filters={filterManager.filters}
            dateRangeFrom={dateRange.from}
            dateRangeTo={dateRange.to}
            onQuerySubmit={this.onQuerySubmit}
            onFiltersUpdated={this.onFiltersUpdated}
            query={query}
            timeHistory={this.timefilter._history}
            {...{ appName: 'wazuhMitre' }} />
        </I18nProvider>
      </KibanaContextProvider>
    );
  }


  async buildTacticsObject(){
    try{
      const data = await ApiRequest.request('GET', '/mitre', { select: "phase_name"});
      const result = (((data || {}).data || {}).data || {}).items;
      const tacticsObject = {};
      result && result.forEach(item => {
          const {id, phase_name} = item;
          phase_name.forEach( (tactic) => {
            if(!tacticsObject[tactic]){ 
              tacticsObject[tactic] = [];
            }
            tacticsObject[tactic].push(id);
          })
        });
      this._isMount && this.setState({tacticsObject});
    }catch(err){
      this.showToast(
        'danger',
        'Error',
        `Mitre data could not be fetched: ${err}`,
        3000
      );
    }
  }

  onChangeSelectedTactics = (selectedTactics) => {
    this.setState({selectedTactics});
  }

  render() {
    const { tacticsObject, selectedTactics, filterParams } = this.state;
    return (
      <div>
        <EuiFlexGroup>
          <EuiFlexItem>
            {this.getSearchBar()}
            
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer />
        <EuiFlexGroup style={{margin: 8}}>
          <EuiFlexItem>
            <EuiPanel paddingSize="none">
              {!!Object.keys(tacticsObject).length && 
                <EuiFlexGroup style={{maxHeight: 550}}>
                  <EuiFlexItem grow={false} style={{width: "15%"}}>
                    <Tactics 
                      indexPattern={this.indexPattern}
                      onChangeSelectedTactics={this.onChangeSelectedTactics}
                      {...this.state} />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <Techniques
                      indexPattern={this.indexPattern}
                      onSelectedTabChanged={(id) => this.props.onSelectedTabChanged(id)}
                      {...this.state} />
                  </EuiFlexItem>
                </EuiFlexGroup>
              }
            </EuiPanel>
            
          </EuiFlexItem>
        </EuiFlexGroup>
       
      </div>
    );
  }
}

