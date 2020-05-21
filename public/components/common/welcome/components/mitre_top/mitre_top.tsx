/*
 * Wazuh app - React component information about last SCA scan.
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component, Fragment } from 'react';

import { IFilterParams, getElasticAlerts, getIndexPattern } from '../../../../../components/overview/mitre/lib';
import { getServices } from 'plugins/kibana/discover/kibana_services';

export class MitreTopTactics extends Component {
  _isMount = false;


  KibanaServices: { [key: string]: any };
  filterManager: any;
  timefilter: any;
  indexPattern: any;
  props!: {
      [key: string]: any
  }
  state: {
    isLoading: boolean,
    tacticsCount: { key: string, doc_count:number }[],
    techniquesCount: { key: string, doc_count:number }[],
    filterParams: object,
    selectedTactic: string
  }

  constructor(props) {
    super(props);
    this.KibanaServices = getServices();
    this.filterManager = this.KibanaServices.filterManager;
    this.timefilter = this.KibanaServices.timefilter;
    this.state = {
      isLoading: true,
      tacticsCount: [],
      techniquesCount: [],
      filterParams: {
        filters: [],
        query: { language: 'kuery', query: '' },
        time: this.timefilter.getTime(),
      },
      selectedTactic: ""
    };
  }

  async componentDidMount() {
    this._isMount = true;
    this.indexPattern = await getIndexPattern();
    await this.getTacticsCount();

    //TODO REMOVE EXAMPLE
    this.selecTactic("Defense Evasion")
    setTimeout( () => this.selecTactic(false) , 3000);

  }

  async componentDidUpdate(){
    if(this.state.selectedTactic && !this.state.techniquesCount.length){
      await this.getTechniquesCount()
    }
    const time =  this.timefilter.getTime();
    const { filterParams } = this.state;
    if (JSON.stringify(this.state.filterParams.time) !== JSON.stringify(time)){
      if(this.state.selectedTactic){
        await this.updateFiltersAndGetTechniques();
      }else{
        await this.updateFiltersAndGetTactics();
      }
    }
  }

  selecTactic(id){
    if(id){
      this.setState({selectedTactic: id})
    }else{
      this.setState({selectedTactic: id}, () => this.updateFiltersAndGetTactics())
    }
  }

  async updateFiltersAndGetTechniques(){
    const filterParams = {};
    filterParams["time"] = this.timefilter.getTime();;
    filterParams["query"] = this.state.filterParams["query"]; 
    filterParams["filters"] = this.state.filterParams["filters"]; 
    this.setState({filterParams}, async() => await this.getTechniquesCount())
  }

  async updateFiltersAndGetTactics(){
    const filterParams = {};
    filterParams["time"] = this.timefilter.getTime();;
    filterParams["query"] = this.state.filterParams["query"]; 
    filterParams["filters"] = this.state.filterParams["filters"]; 
    this.setState({filterParams}, async() => await this.getTacticsCount())
  }

  async getTechniquesCount() {
    try{
      const {filterParams} = this.state;
      const indexPattern = this.indexPattern;
      if ( !indexPattern ) { return; }
      const aggs = {
        techniques: {
          terms: {
              field: "rule.mitre.id",
              size: 1000,
          }
        }
      }
      const tmpFilterParams = {};
      tmpFilterParams["time"] = this.timefilter.getTime();;
      tmpFilterParams["query"] = this.state.filterParams["query"]; 
      tmpFilterParams["filters"] = this.state.filterParams["filters"]; 

      const tacticFilter = {
        "meta": {
          "disabled": false,
          "key": "rule.mitre.tactics",
          "params": { "query": this.state.selectedTactic},
          "type": "phrase",
          "index": "wazuh-alerts-3.x-*"
        },
        "query": { "match_phrase": { "rule.mitre.tactics": this.state.selectedTactic  } },
        "$state": { "store": "appState" }
      };
      tmpFilterParams["filters"].push(tacticFilter);
      
      // TODO: use `status` and `statusText`  to show errors
      // @ts-ignore
      const {data, status, statusText } = await getElasticAlerts(indexPattern, tmpFilterParams, aggs);
      const { buckets } = data.aggregations.techniques;
      this._isMount && this.setState({techniquesCount: buckets, loadingAlerts: false});
      console.log("top techniques of "+ this.state.selectedTactic, buckets)
        
    } catch(err){
      // this.showToast(
      //   'danger',
      //   'Error',
      //   `Mitre alerts could not be fetched: ${err}`,
      //   3000
      // );
      this._isMount && this.setState({loadingAlerts: false})
    }
  }

  async getTacticsCount(firstTime=false) {
    this.setState({loadingAlerts: true, prevFilters: this.state.filterParams});
    try{
      const {filterParams} = this.state;
      const indexPattern = this.indexPattern;
      if ( !indexPattern ) { return; }
      const aggs = {
        tactics: {
          terms: {
              field: "rule.mitre.tactics",
              size: 5,
          }
        }
      }
      
      // TODO: use `status` and `statusText`  to show errors
      // @ts-ignore
      const {data, status, statusText, } = await getElasticAlerts(indexPattern, filterParams, aggs);
      const { buckets } = data.aggregations.tactics;
      if(firstTime){
       this.initTactics(buckets); // top tactics are checked on component mount
      }
      this._isMount && this.setState({tacticsCount: buckets, loadingAlerts: false, firstTime:false});
      console.log("tactics top", buckets)
    } catch(err){
      /* TODO add showToast method for error handling
       this.showToast(
        'danger',
        'Error',
        `Mitre alerts could not be fetched: ${err}`,
        3000
      );*/
      this.setState({loadingAlerts: false})
    }
    
  }

  render() {
    return (
      <p>working</p>
    );
  }
}