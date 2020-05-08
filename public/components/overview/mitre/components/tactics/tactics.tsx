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
} from '@elastic/eui'
import { IFilterParams, getElasticAlerts } from '../../lib';

export class Tactics extends Component {
  _isMount = false;
  state: {
    tacticsList: Array<any>,
    tacticsCount: { key: string, doc_count:number }[]
    selectedItems: object,
  }

  props!: {
    tacticsObject: object,
    selectedTactics: Array<any>
    filterParams: IFilterParams,
    indexPattern: any,
  };

  constructor(props) {
    super(props);
    this.state = {
      tacticsList: [],
      selectedItems: {},
      tacticsCount: [],
    }
  }

  async componentDidMount(){
    this._isMount = true;
    await this.getTacticsCount();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { filterParams, indexPattern } = this.props;
    const { tacticsCount, selectedItems } = this.state;
    if (JSON.stringify(nextProps.filterParams) !== JSON.stringify(filterParams))
      return true;
    if (JSON.stringify(nextProps.indexPattern) !== JSON.stringify(indexPattern))
      return true;
    if (JSON.stringify(nextState.tacticsCount) !== JSON.stringify(tacticsCount))
      return true;
    if (JSON.stringify(nextState.selectedItems) !== JSON.stringify(selectedItems))
      return true;
    return false;
  }

  async componentDidUpdate() {
    this.getTacticsCount();
  }

  async getTacticsCount() {
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
    const { buckets } = data.aggregations.tactics
    this._isMount && this.setState({tacticsCount: buckets});
  }


  componentWillUnmount() {
    this._isMount = false;
  }

  facetClicked(id){
    const { selectedItems: oldSelected } = this.state;
    const selectedItems = {
      ...oldSelected,
      [id]: !oldSelected[id]
    }
    this.setState({selectedItems});
  }


  getTacticsList(){
    const { tacticsCount } = this.state;
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
              isSelected={this.state.selectedItems[facet.id]}
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

  checkAllChecked(tacticList){

    tacticList.map( item => {
      if(!this.state.selectedItems[item.id])
        console.log("false")
        return;
    });

    console.log("true")
  }

  render() {
    return (
      <div style={{backgroundColor: "gray", padding: 10}}>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiTitle size="m">
              <h1>Tactics</h1>
            </EuiTitle>
          </EuiFlexItem>

          <EuiFlexItem grow={false}>botton
          </EuiFlexItem>
        </EuiFlexGroup>
        
        <EuiFacetGroup style={{ }}>
          {this.getTacticsList()}
        </EuiFacetGroup>

      </div>
    )
  }
}
