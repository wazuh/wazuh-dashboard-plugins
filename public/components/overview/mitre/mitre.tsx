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
import { 
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { ApiRequest } from '../../../react-services/api-request';
import { toastNotifications } from 'ui/notify';
import { IFilterParams, getIndexPattern } from './lib';

import {  FilterManager, Filter } from '../../../../../../src/plugins/data/public/';
//@ts-ignore
import { getServices } from 'plugins/kibana/discover/kibana_services';
import { KbnSearchBar } from '../../kbn-search-bar';
import { TimeRange, Query } from '../../../../../../src/plugins/data/common';
import { ModulesHelper } from '../../common/modules/modules-helper';

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
    tacticsObject: ITactic,
    selectedTactics: Object,
    filterParams: IFilterParams,
    isLoading: boolean
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
      isLoading: true,
      filterParams: {
        filters: this.filterManager.getFilters() || [],
        query: { language: 'kuery', query: '' },
        time: this.timefilter.getTime(),
      },
    }
    this.onChangeSelectedTactics.bind(this);
    this.onQuerySubmit.bind(this);
    this.onFiltersUpdated.bind(this);
  }

  async componentDidMount(){
    this._isMount = true;
    this.indexPattern = await getIndexPattern();
    const scope = await ModulesHelper.getDiscoverScope();
    const query = scope.state.query;
    const { filters, time} = this.state.filterParams;
    this.setState({filterParams: {query, filters, time}})
    await this.buildTacticsObject();
  }

  componentWillUnmount() {
    this._isMount = false;
  }

  onQuerySubmit = (payload: { dateRange: TimeRange, query: Query }) => {
    const { query, dateRange } = payload;
    const { filters } = this.state.filterParams
    const filterParams = { query, time: dateRange , filters};
    this.setState({ filterParams, isLoading: true }, () => this.setState({isLoading:false}));
  }

  onFiltersUpdated = (filters: Filter[]) => {
    const { query, time } = this.state.filterParams;
    const filterParams = { query, time, filters };
    this.setState({ filterParams, isLoading: true }, () => this.setState({isLoading:false}));
  }

  showToast = (color, title, text, time) => {
    toastNotifications.add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time
    });
  };

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
      this._isMount && this.setState({tacticsObject, isLoading: false});
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
    const { isLoading } = this.state;
    return (
      <div>
        <EuiFlexGroup>
          <EuiFlexItem>
            <div className='wz-discover hide-filter-controll' >
              <KbnSearchBar
                onQuerySubmit={this.onQuerySubmit}
                onFiltersUpdated={this.onFiltersUpdated}
                isLoading={isLoading} />
            </div>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiFlexGroup style={{ margin: '0 8px' }}>
          <EuiFlexItem>
            <EuiPanel paddingSize="none">
                <EuiFlexGroup >
                  <EuiFlexItem grow={false} style={{width: "15%", minWidth: 145, height: "calc(100vh - 280px)",overflowX: "hidden"}}>
                    <Tactics 
                      indexPattern={this.indexPattern}
                      onChangeSelectedTactics={this.onChangeSelectedTactics}
                      filters={this.state.filterParams}
                      {...this.state} />
                  </EuiFlexItem>
                  <EuiFlexItem>
                      <Techniques
                      indexPattern={this.indexPattern}
                      filters={this.state.filterParams}
                      onSelectedTabChanged={(id) => this.props.onSelectedTabChanged(id)}
                      {...this.state} /> 
                  </EuiFlexItem>
                </EuiFlexGroup>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
       
      </div>
    );
  }
}

