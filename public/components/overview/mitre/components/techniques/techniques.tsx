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
  EuiSpacer,
  EuiToolTip
} from '@elastic/eui';
import { FlyoutTechnique } from './components/flyout-technique/';
import { WzRequest } from '../../../../../react-services/wz-request';
import { mitreTechniques, getElasticAlerts, IFilterParams } from '../../lib'
import { ITactic } from '../../';

export class Techniques extends Component {
  _isMount = false;

  props!: {
    tacticsObject: ITactic
    selectedTactics: any
    indexPattern: any
    filterParams: IFilterParams
  }

  state: {
    techniquesCount: {key: string, doc_count: number}[]
    searchValue: any,
    isFlyoutVisible: Boolean,
    currentTechniqueData: {},
    currentTechnique: string
  }

	constructor(props) {
    super(props);
    
    this.state = {
      searchValue: "",
      isFlyoutVisible: false,
      currentTechniqueData: {},
      techniquesCount: [],
      currentTechnique: ''
    }
    this.onChangeFlyout.bind(this);
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
    const tacticsToRender: Array<any> = [];

    Object.keys(tacticsObject).forEach((key, inx) => {
      const currentTechniques = tacticsObject[key];
      if(this.props.selectedTactics[key]){
        currentTechniques.forEach( (technique,idx) => {
          if(technique.toLowerCase().includes(this.state.searchValue.toLowerCase()) || mitreTechniques[technique].name.toLowerCase().includes(this.state.searchValue.toLowerCase()) ){
            const quantity = (techniquesCount.find(item => item.key === technique) || {}).doc_count || 0;
            tacticsToRender.push({
              id: technique,
              label: `${technique} - ${mitreTechniques[technique].name}`,
              quantity
            })
          }
        });

      }
    });

    const tacticsToRenderOrdered = tacticsToRender.sort((a, b) => b.quantity - a.quantity).map( (item,idx) => {
      const tooltipContent = `View details of ${mitreTechniques[item.id].name} (${item.id})`;

      return(
        <EuiFlexItem key={idx} style={{border: "1px solid #8080804a", maxWidth: "calc(25% - 8px)"}}>
          <EuiToolTip delay="long" position="top" content={tooltipContent}>
            <EuiFacetButton
              style={{width: "100%", padding: "0 5px 0 5px"}}
              quantity={item.quantity}
              onClick={() => this.showFlyout(item.id)}>
                {item.id} - {mitreTechniques[item.id].name}
            </EuiFacetButton>
        </EuiToolTip>
        </EuiFlexItem>
      );
        
    })
    if(tacticsToRender.length){
      return (
      <EuiFlexGrid columns={4} gutterSize="s" style={{ maxHeight: "420px",overflow: "overlay", overflowX: "hidden", paddingRight: 10}}>
        {tacticsToRenderOrdered}
      </EuiFlexGrid>
      )
    }else{
      return <>No tactics have been selected.</>

    }
    
  }
  onSearchValueChange = e => {
    this.setState({searchValue: e.target.value});
  }

  async showFlyout(techniqueData) {
    console.log({techniqueData});
    this.setState({isFlyoutVisible: true, currentTechnique: techniqueData });
  }

  closeFlyout() {
    this.setState({ isFlyoutVisible: false, currentTechniqueData: {},  });
  }

  onChangeFlyout = (isFlyoutVisible: boolean) => {
      this.setState({ isFlyoutVisible });
  }

	render() {
    const { isFlyoutVisible, currentTechnique } = this.state;
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
        { isFlyoutVisible &&
          <FlyoutTechnique
            onChangeFlyout={this.onChangeFlyout}
            currentTechniqueData={this.state.currentTechniqueData}
            currentTechnique={currentTechnique} />
        } 
      </div>   
		)
	}
}
