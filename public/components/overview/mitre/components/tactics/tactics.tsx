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
import React, { Component } from 'react';
import {
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFacetButton,
  EuiFacetGroup,
  EuiCheckbox
} from '@elastic/eui'
import { IFilterParams, getElasticAlerts } from '../../lib';
import { toastNotifications } from 'ui/notify';

export class Tactics extends Component {
  _isMount = false;
  state: {
    tacticsList: Array<any>,
    tacticsCount: { key: string, doc_count:number }[],
    allSelected : boolean,
    loadingAlerts: boolean
  }

  props!: {
    tacticsObject: object,
    selectedTactics: Array<any>
    filterParams: IFilterParams
    indexPattern: any
    onChangeSelectedTactics(selectedTactics): void
  };

  constructor(props) {
    super(props);
    this.state = {
      tacticsList: [],
      tacticsCount: [],
      allSelected: false,
      loadingAlerts: true
    }
  }

  async componentDidMount(){
    this._isMount = true;
    this.initTactics(); // all tactics are checked on init
    await this.getTacticsCount();
  }

  initTactics(){
    const tacticsIds = Object.keys(this.props.tacticsObject);
    const selectedTactics = {}
     tacticsIds.forEach( item => {
      selectedTactics[item] = true;
    });
    
    this.props.onChangeSelectedTactics(selectedTactics);
  }


  shouldComponentUpdate(nextProps, nextState) {
    const { filterParams, indexPattern, selectedTactics } = this.props;
    const { tacticsCount } = this.state;
    if (JSON.stringify(nextProps.filterParams) !== JSON.stringify(filterParams))
      return true;
    if (JSON.stringify(nextProps.indexPattern) !== JSON.stringify(indexPattern))
      return true;
    if (JSON.stringify(nextState.tacticsCount) !== JSON.stringify(tacticsCount))
      return true;
    if (JSON.stringify(nextState.selectedTactics) !== JSON.stringify(selectedTactics))
      return true;
    return false;
  }

  async componentDidUpdate(prevProps, prevState) {
    const { filterParams } = this.props;
    if (JSON.stringify(prevProps.filterParams) !== JSON.stringify(filterParams))
      this.getTacticsCount();
  }

  showToast = (color, title, text, time) => {
    toastNotifications.add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time
    });
  };

  async getTacticsCount() {
    this.setState({loadingAlerts: true});
    try{
      const {indexPattern, filterParams} = this.props;
      if ( !indexPattern ) { return; }
      const aggs = {
        tactics: {
          terms: {
              field: "rule.mitre.tactics",
              size: 1000,
          }
        }
      }
      
      // TODO: use `status` and `statusText`  to show errors
      // @ts-ignore
      const {data, status, statusText, } = await getElasticAlerts(indexPattern, filterParams, aggs);
      const { buckets } = data.aggregations.tactics;
      this._isMount && this.setState({tacticsCount: buckets, loadingAlerts: false});
        
    } catch(err){
      this.showToast(
        'danger',
        'Error',
        `Mitre alerts could not be fetched: ${err}`,
        3000
      );
      this.setState({loadingAlerts: false})
    }
    
  }


  componentWillUnmount() {
    this._isMount = false;
  }

  facetClicked(id){
    const { selectedTactics: oldSelected, onChangeSelectedTactics } = this.props;
    const selectedTactics = {
      ...oldSelected,
      [id]: !oldSelected[id]
    }
    onChangeSelectedTactics(selectedTactics);
  }


  getTacticsList(){
    const { tacticsCount } = this.state;
    const { selectedTactics } = this.props;
    const tacticsIds = Object.keys(this.props.tacticsObject);
    const tacticsList:Array<any> = tacticsIds.map( item => {
      const quantity = (tacticsCount.find(tactic => tactic.key === item) || {}).doc_count || 0;
      return {
        id: item,
        label: item,
        quantity,
        onClick: (id) => this.facetClicked(id),
      }}
    );
    
    this.checkAllChecked(tacticsList);

    return (
      <>
      {tacticsList.sort((a, b) => b.quantity - a.quantity).map(facet => {
        let iconNode;
        return (
          <EuiFacetButton
            key={facet.id}
            id={`${facet.id}`}
            quantity={facet.quantity}
            isSelected={selectedTactics[facet.id]}
            isLoading={this.state.loadingAlerts}
            icon={iconNode}
            onClick={
              facet.onClick ? () => facet.onClick(facet.id) : undefined
            }>
            {facet.label}
          </EuiFacetButton>
        );
      })}
      </>
    );
    
  }

  checkAllChecked(tacticList: any[]){
    const { selectedTactics } = this.props;
    let allSelected = true;
    tacticList.forEach( item => {
      if(!selectedTactics[item.id])
        allSelected = false;
    });

    if(allSelected !== this.state.allSelected){
      this.setState({allSelected});
    }
  }

  onCheckAllClick(){
    const allSelected = ! this.state.allSelected;
    const {selectedTactics, onChangeSelectedTactics} = this.props;
    Object.keys(selectedTactics).map( item => {
      selectedTactics[item] = allSelected;
    });
    
    this.setState({allSelected});
    onChangeSelectedTactics(selectedTactics);
  }
  

  render() {
    return (
      <div style={{ backgroundColor: "#80808014", padding: "10px 10px 0 10px"}}>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiTitle size="m">
              <h1>Tactics</h1>
            </EuiTitle>
          </EuiFlexItem>

          <EuiFlexItem grow={false} style={{marginTop:'25px', marginRight:4}}>{ this.state.allSelected
                  ? 'Unselect All'
                  : 'Select all' }</EuiFlexItem>
          <EuiFlexItem grow={false} style={{marginTop:'25px', marginLeft:0}}>
                <EuiCheckbox
                  style={{ alignSelf: 'flex-end' }}
                  id='selectTactics'
                  checked={this.state.allSelected}
                  onChange={() => {
                    this.onCheckAllClick()
                  }
                  } />
              </EuiFlexItem>
        </EuiFlexGroup>
        
        <EuiFacetGroup style={{ }}>
          {this.getTacticsList()}
        </EuiFacetGroup>

      </div>
    )
  }
}
