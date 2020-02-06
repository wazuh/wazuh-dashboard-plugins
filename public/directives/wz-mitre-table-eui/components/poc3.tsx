/*
 * Wazuh app - React component for alerts stats.
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
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
  EuiFacetButton,
  EuiFacetGroup,
  EuiFlexGroup,
  EuiFlexGrid,
  EuiFlexItem,
  EuiPanel,
  EuiTitle,
} from '@elastic/eui';
import { EuiPopover } from '@elastic/eui';
import { AttkPopover } from './attk-popover-poc3';
import { try } from 'bluebird';

export class Poc3 extends Component {
  state:{
    selectedMap: {}
  }

  props!: {
    mitreobject: object
  }
  constructor(props) {
    super(props);
    this.state = {
      selectedMap: {}
    };
    console.log(props)
  }

  componentWillMount() {
    const { mitreobject } = this.props;
    const selectedMap = {};
    Object.keys(mitreobject).forEach(tecn => selectedMap[tecn] = true)
    this.setState({selectedMap})
  }

  renderTactics() {
    const { mitreobject } = this.props;
    const { selectedMap } = this.state;
    const tecniques = Object.keys(mitreobject)
    .map(tecn => {
      const isSelected = selectedMap[tecn];
      const newSelectMap = {...selectedMap, [tecn]:!isSelected };
      return (<EuiFacetButton 
        quantity={mitreobject[tecn].attacks_count}
        isSelected={selectedMap[tecn]}
        onClick={() => this.setState({selectedMap:newSelectMap})} >
          {tecn}
      </EuiFacetButton>)
      }
    )
    return (
      <EuiFacetGroup> 
        {tecniques}
      </EuiFacetGroup>
    )
  }

  renderTechniques() {
    const { mitreobject } = this.props;
    const { selectedMap } = this.state;
    const allTechniques = Object.keys(mitreobject)
    .map(tact => {
      const isSelected = selectedMap[tact];
      if(!isSelected) return null;
      const techniques = mitreobject[tact].techniques
      .map(tecn => {
        return (
          <AttkPopover attacksCount={tecn.attacks_count} name={tecn.name}/>
        )
      })
      return techniques;
    })
    const joinTechniques = [].concat(...allTechniques);
    console.log(joinTechniques)

    return (
      <EuiFacetGroup layout="horizontal"> 
        {joinTechniques}
      </EuiFacetGroup>
    )
  }

  render() {
    return (
      <EuiPanel>
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiTitle><h1>Tactics</h1></EuiTitle>
            {this.renderTactics()}
          </EuiFlexItem>
          <EuiFlexItem style={{maxHeight:515}}>
            <EuiTitle><h1>Techniques</h1></EuiTitle>
            <EuiFlexGrid style={{padding: 20, overflow:'hidden', overflowY: 'scroll'}}>
            {this.renderTechniques()}
            </EuiFlexGrid>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    );
  }
}
