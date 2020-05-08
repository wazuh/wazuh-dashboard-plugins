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
import { mitreTechniques } from '../../lib/index'
import { FlyoutTechnique } from './components/flyout-technique/';
import { WzRequest } from '../../../../../react-services/wz-request';

export class Techniques extends Component {
  props!: {
    tacticsObject: any,
    selectedTactics: any
  }
  state: {
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
      currentTechnique: ''
    }
    this.onChangeFlyout.bind(this);
	}

  renderFacet() {
    const {tacticsObject} = this.props;
    const tacticsToRender: Array<JSX.Element> = [];

    Object.keys(tacticsObject).forEach((key, inx) => {
      const currentTechniques = tacticsObject[key];
      if(this.props.selectedTactics[key]){
        currentTechniques.forEach( (technique,idx) => {
          if(technique.toLowerCase().includes(this.state.searchValue.toLowerCase())){
            tacticsToRender.push(
              <EuiFlexItem key={inx+"_"+idx} style={{border: "1px solid #8080804a", padding: "0 5px 0 5px"}}>
                <EuiFacetButton
                  quantity={0}
                  onClick={() => this.showFlyout(technique)}>
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
