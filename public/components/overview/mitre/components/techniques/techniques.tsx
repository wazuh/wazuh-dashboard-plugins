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
import React, { Component, Fragment } from 'react'
import {
  EuiFacetButton,
  EuiFlexGroup,
  EuiFlexGrid,
  EuiFlexItem,
  EuiTitle,
  EuiFieldSearch,
  EuiSpacer
} from '@elastic/eui';
import { mitreTechniques, getElasticAlerts, IFilterParams } from '../../lib'
import { ITactic } from '../../';

export class Techniques extends Component {
  _isMount = false;
  state: {
    searchValue: any
    techniquesCount: {key: string, doc_count: number}[]
  }

  props!: {
    tacticsObject: ITactic
    selectedTactics: any
    indexPattern: any
    filterParams: IFilterParams
  }

	constructor(props) {
    super(props);
    
    this.state = {
      searchValue: "",
      techniquesCount: [],
    }
  }
  
  async componentDidMount(){
    this._isMount = true;
    await this.getTechniquesCount();
  }

  componentDidUpdate(prevProps) {
    const { filterParams } = this.props;
    if ( JSON.stringify(prevProps.filterParams) !== JSON.stringify(filterParams) )
      this.getTechniquesCount();
  }

  componentWillUnmount() {
    this._isMount = false;
  }

  async getTechniquesCount() {
    try{
      const {indexPattern, filterParams} = this.props;
      if ( !indexPattern ) { return; }
      const aggs = {
        techniques: {
          terms: {
              field: "rule.mitre.id",
              size: 1000,
          }
        }
      }
      
      // TODO: use `status` and `statusText`  to show errors
      // @ts-ignore
      const {data, status, statusText, } = await getElasticAlerts(indexPattern, filterParams, aggs);
      const { buckets } = data.aggregations.techniques;
      this._isMount && this.setState({techniquesCount: buckets, loadingAlerts: false});
        
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

  renderFacet() {
    const { tacticsObject } = this.props;
    const { techniquesCount } = this.state;
    const tacticsToRender: Array<JSX.Element> = [];

    Object.keys(tacticsObject).forEach((key, inx) => {
      const currentTechniques = tacticsObject[key];
      if(this.props.selectedTactics[key]){
        currentTechniques.forEach( (technique,idx) => {
          if(technique.toLowerCase().includes(this.state.searchValue.toLowerCase())){
            const quantity = (techniquesCount.find(item => item.key === technique) || {}).doc_count || 0;
            tacticsToRender.push(
              <EuiFlexItem key={inx+"_"+idx} style={{border: "1px solid #8080804a", padding: "0 5px 0 5px"}}>
                <EuiFacetButton
                  quantity={quantity}>
                    {mitreTechniques[technique].name}
                </EuiFacetButton>
              </EuiFlexItem>
            );
          }
        });

      }
    });
    if(tacticsToRender.length){
      return (
      <EuiFlexGrid columns={4} gutterSize="s" style={{ maxHeight: "420px",overflow: "overlay", overflowX: "hidden", paddingRight: 10}}>
        {tacticsToRender}
      </EuiFlexGrid>
      )
    }else{
      return <>No tactics have been selected.</>

    }
    
  }
  onSearchValueChange = e => {
    this.setState({searchValue: e.target.value});
  }

	render() {
		return (

      <div style={{padding: 10}}>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiTitle size="m">
              <h1>Techniques</h1>
            </EuiTitle>
          </EuiFlexItem>

        </EuiFlexGroup>
        <EuiSpacer size="xs" />

        <EuiFieldSearch
          fullWidth={true}
          placeholder="Filter techniques"
          value={this.state.searchValue}
          onChange={e => this.onSearchValueChange(e)}
          isClearable={true}
          aria-label="Use aria labels when no actual label is in use"
        />
        <EuiSpacer size="s" />

        <div>
          {this.renderFacet()}
        </div>

      </div>
		)
	}
}
