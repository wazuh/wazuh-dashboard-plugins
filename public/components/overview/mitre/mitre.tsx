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
} from '@elastic/eui';
import { ApiRequest } from '../../../react-services/api-request';
import { toastNotifications } from 'ui/notify';
import { IFilterParams, getElasticAlerts, getIndexPattern } from './lib';

export interface ITactic {
  [key:string]: string[]
}


export class Mitre extends Component {
  _isMount = false;
  indexPattern: any;
  destroyWatcher: any;
  state: {
    tacticsObject: ITactic,
    selectedTactics: Object
    filterParams: IFilterParams
  } 

  props: any;

  constructor(props) {
    super(props);
    this.state = {
      tacticsObject: {},
      selectedTactics: {},
      filterParams: {
        filters: [],
        query: { language: 'kuery', query: '' },
        time: {from: 'now/d', to: 'now/d'},
      }
    }
    this.onChangeSelectedTactics.bind(this);
  }

  async componentDidMount(){
    this._isMount = true;
    this.indexPattern = await getIndexPattern();
    const scope = await ModulesHelper.getDiscoverScope();
    this.destroyWatcher = scope.$watchCollection('fetchStatus',
      () => {
        const { filters=[], query } = scope.state;
        const { time } = scope;
        this._isMount && this.setState({ filterParams:{ filters, time, query } });
      }
    )
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
      <EuiPage>
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
                  {...this.state} />
              </EuiFlexItem>
            </EuiFlexGroup>
          }
        </EuiPanel>
      </EuiPage>
    );
  }
}

