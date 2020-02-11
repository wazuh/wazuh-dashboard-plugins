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
  EuiFieldSearch,
  EuiFlexGrid,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiTitle,
} from '@elastic/eui';
import { EuiPopover } from '@elastic/eui';
import { AttkPopover } from './attk-popover';
import { Func } from 'mocha';

export class Poc1 extends Component {
  state:{
    selectedMap: {}
    filter: string
  }

  props!: {
    mitreobject: object,
    addFilter: Function,
    addNegativeFilter: Function,
  }
  constructor(props) {
    super(props);
    this.state = {
      selectedMap: {},
      filter: ''
    };
  }

  componentWillMount() {
    const { mitreobject } = this.props;
    const selectedMap = {};
    Object.keys(mitreobject).forEach(tecn => selectedMap[tecn] = tecn === "Initial Access" ? true : false)
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
    const { selectedMap, filter } = this.state;
    const selectedTact = Object.keys(selectedMap).filter(tact => selectedMap[tact]);

    const allTechniques = selectedTact
    .map(tact => {
      const techniques = mitreobject[tact].techniques
      .map(tecn => {
        return (
          <AttkPopover 
            attacksCount={tecn.attacks_count}
            name={tecn.name}
            id={tecn.id}
            addFilter={(id) => this.props.addFilter(id)}
            addNegativeFilter={(id) => this.props.addNegativeFilter(id)} />
        )
      })
      return techniques;
    })
    const joinTechniques = [].concat(...allTechniques);
    const filterTechniques = joinTechniques.filter(item => item.props.name.toLocaleLowerCase().includes(filter))
    const sortTechniques = filterTechniques.sort((a,b) => b.props.attacksCount - a.props.attacksCount)
    
    return (
      <EuiFacetGroup layout="horizontal"> 
        {sortTechniques}
      </EuiFacetGroup>
    )
  }

  render() {
    return (
      <EuiPanel style={{margin:16}}>
        <EuiFlexGroup>
          <EuiFlexItem 
            grow={false}
            style={{background: '#f4f5f8', margin: '-4px', padding: '16px', width: '17%', minWidth:250}} >
            <EuiTitle><h1>Tactics</h1></EuiTitle>
            {this.renderTactics()}
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiTitle ><h1 style={{marginLeft: 20 }}>Techniques</h1></EuiTitle>
            <div style={{marginLeft: 20, marginTop: 10, marginBottom: 0}}>
              <EuiFieldSearch
                fullWidth={true}
                onChange={(input) => this.setState({filter: input.target.value.toLocaleLowerCase()})}  /> 
            </div>
            <EuiFlexGrid style={{margin: '0px -22px -16px 15px', padding:'16px 0px', overflow:'hidden', overflowY: 'scroll', maxHeight:486}}>
            {this.renderTechniques()}
            </EuiFlexGrid>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    );
  }
}
